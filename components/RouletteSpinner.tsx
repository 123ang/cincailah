'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatPrice, haversineKm } from '@/lib/utils';
import { fireConfetti } from '@/lib/confetti';
import RatingPrompt, { schedulePendingRating } from '@/components/RatingPrompt';

interface Restaurant {
  id: string;
  name: string;
  cuisineTags: unknown;
  vibeTags: unknown;
  priceMin: number;
  priceMax: number;
  halal: boolean;
  vegOptions: boolean;
  walkMinutes: number;
  mapsUrl: string | null;
  photoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface RouletteSpinnerProps {
  groupId: string;
  userId: string;
  filters: unknown;
}

const LOADING_TEXTS = [
  'Asking the boss...',
  'Checking wallet...',
  'Consulting grandma...',
  'Flipping coin...',
  'Reading your fortune...',
  'Sniffing the air...',
];

type Phase = 'loading' | 'spinning' | 'result';

export default function RouletteSpinner({
  groupId,
  filters,
}: RouletteSpinnerProps) {
  const router = useRouter();
  const allowRepeatPicks = useMemo(() => {
    if (!filters || typeof filters !== 'object') return false;
    return (filters as Record<string, unknown>).allowRepeatPicks === true;
  }, [filters]);

  const [phase, setPhase] = useState<Phase>('loading');
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [candidates, setCandidates] = useState<Restaurant[]>([]);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [decisionId, setDecisionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [excludeIds, setExcludeIds] = useState<string[]>([]);
  const [maxReroll, setMaxReroll] = useState<number>(3);
  const [rerollsUsed, setRerollsUsed] = useState<number>(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const celebratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const a = new Audio('/sounds/winner.mp3');
    a.preload = 'auto';
    a.volume = 0.6;
    audioRef.current = a;
    // Ask for geolocation silently — used to show distance on the winner reveal
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { /* permission denied or unavailable — ignore */ }
      );
    }
  }, []);

  const celebrate = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play();
      }
    } catch {
      // autoplay blocked; ignore
    }
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([80, 40, 140]);
      }
    } catch {
      // ignore
    }
    try {
      fireConfetti();
    } catch {
      // ignore
    }
  }, []);

  const drawWheel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      centerX: number,
      centerY: number,
      radius: number,
      items: Restaurant[],
      rotation: number
    ) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (items.length === 0) return;

      const sliceAngle = (2 * Math.PI) / items.length;
      const colors = [
        '#FF5A00',
        '#FFC233',
        '#45B619',
        '#3B82F6',
        '#8B5CF6',
        '#EC4899',
      ];

      items.forEach((item, i) => {
        const angle = (rotation * Math.PI) / 180 + i * sliceAngle;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + sliceAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Inter';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4;
        ctx.fillText(item.name.substring(0, 20), radius - 20, 5);
        ctx.restore();
      });

      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#FF5A00';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Pointer at top (12 o'clock): wide base above the rim, tip points down into the winning slice.
      const rimY = centerY - radius;
      const baseY = rimY - 20;
      const baseHalf = 20;
      const tipY = rimY + 10;
      ctx.beginPath();
      ctx.moveTo(centerX - baseHalf, baseY);
      ctx.lineTo(centerX + baseHalf, baseY);
      ctx.lineTo(centerX, tipY);
      ctx.closePath();
      ctx.fillStyle = '#FF5A00';
      ctx.fill();
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2;
      ctx.stroke();
    },
    []
  );

  const startSpinAnimation = useCallback(
    (allCandidates: Restaurant[], finalWinner: Restaurant) => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 40;

      const totalSpinTime = allCandidates.length === 1 ? 1200 : 3000;
      const startTime = Date.now();
      const winnerIndex = Math.max(
        0,
        allCandidates.findIndex((c) => c.id === finalWinner.id)
      );
      const n = Math.max(1, allCandidates.length);
      const sliceDeg = 360 / n;
      // Pointer is fixed at top = 270° (clockwise from +x). Align winner slice midpoint to 270°.
      const alignDeg = ((270 - (winnerIndex + 0.5) * sliceDeg) % 360 + 360) % 360;
      const fullSpins = allCandidates.length === 1 ? 2 : 5;
      const targetAngle = fullSpins * 360 + alignDeg;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalSpinTime, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const currentRotation = easeProgress * targetAngle;
        rotationRef.current = currentRotation;

        drawWheel(ctx, centerX, centerY, radius, allCandidates, currentRotation);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setTimeout(() => {
            setPhase('result');
          }, 400);
        }
      };

      animate();
      return true;
    },
    [drawWheel]
  );

  const fetchDecision = useCallback(
    async (extraExclude: string[] = []) => {
      try {
        setError('');
        setPhase('loading');
        celebratedRef.current = false;

        // Drop fields the server's Zod schema rejects:
        //   - empty string (e.g. budgetFilter: '')
        //   - null / undefined
        //   - empty arrays are fine; boolean false is fine
        const sanitizedFilters =
          filters && typeof filters === 'object'
            ? Object.fromEntries(
                Object.entries(filters as Record<string, unknown>).filter(
                  ([, v]) => v !== '' && v !== null && v !== undefined
                )
              )
            : undefined;

        const res = await fetch('/api/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            filters: sanitizedFilters,
            excludeIds: extraExclude,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to get decision');
        }

        setCandidates(data.candidates);
        setWinner(data.winner);
        if (data.decisionId) setDecisionId(data.decisionId);
        if (typeof data.maxReroll === 'number') setMaxReroll(data.maxReroll);

        setTimeout(() => {
          setPhase('spinning');
        }, 800);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
        setPhase('result');
      }
    },
    [groupId, filters]
  );

  // Kick off (or re-attempt) the canvas spin only once the `spinning` phase
  // has actually rendered — otherwise `canvasRef.current` is null and the
  // animation silently aborts, leaving the UI stuck on the spinning screen.
  useEffect(() => {
    if (phase !== 'spinning' || !winner || candidates.length === 0) return;

    // With only one candidate there's no meaningful wheel — show a short
    // reveal and jump to the result.
    if (candidates.length === 1) {
      const t = setTimeout(() => setPhase('result'), 900);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    let rafId: number | null = null;

    const tryStart = () => {
      if (cancelled) return;
      const ok = startSpinAnimation(candidates, winner);
      if (!ok) {
        rafId = requestAnimationFrame(tryStart);
      }
    };
    tryStart();

    return () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [phase, winner, candidates, startSpinAnimation]);

  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_TEXTS.length;
      setLoadingText(LOADING_TEXTS[idx]);
    }, 1200);

    void fetchDecision([]);

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Celebrate once when result phase shows with a valid winner
  useEffect(() => {
    if (phase === 'result' && winner && !error && !celebratedRef.current) {
      celebratedRef.current = true;
      celebrate();
      if (decisionId) {
        schedulePendingRating(decisionId, winner.id, winner.name);
      }
    }
  }, [phase, winner, error, celebrate, decisionId]);

  const handleNotThis = () => {
    if (!winner) return;
    const nextExclude = allowRepeatPicks ? excludeIds : [...excludeIds, winner.id];
    if (!allowRepeatPicks) {
      setExcludeIds((prev) => [...prev, winner.id]);
    }
    setRerollsUsed((n) => n + 1);
    void fetchDecision(nextExclude);
  };

  const rerollsLeft = Math.max(0, maxReroll - rerollsUsed);
  const canReroll = rerollsLeft > 0;

  if (phase === 'loading') {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 border-t-sambal animate-spin"></div>
            <Image
              src="/brand/cincailah-logo.jpeg"
              alt=""
              width={64}
              height={64}
              className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-lg shadow-sambal/20"
            />
          </div>
          <p className="mt-8 text-lg font-bold text-gray-700 animate-pulse">
            {loadingText}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {rerollsUsed > 0
              ? `Rerolling (${rerollsUsed}/${maxReroll})…`
              : 'Applying filters & anti-repeat…'}
          </p>
          <div className="mt-6 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-sambal animate-bounce" />
            <div
              className="w-2 h-2 rounded-full bg-sambal animate-bounce"
              style={{ animationDelay: '0.15s' }}
            />
            <div
              className="w-2 h-2 rounded-full bg-sambal animate-bounce"
              style={{ animationDelay: '0.3s' }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'spinning') {
    const onlyOne = candidates.length === 1;
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <h2 className="text-2xl font-black text-slate mb-6">
            {onlyOne ? 'Only one match — easy!' : 'Spinning the wheel…'}
          </h2>
          {onlyOne ? (
            <div className="w-40 h-40 rounded-full overflow-hidden shadow-lg ring-4 ring-sambal/30 animate-pulse bg-gradient-to-br from-sambal to-red-400 flex items-center justify-center">
              {candidates[0]?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={candidates[0].photoUrl}
                  alt={candidates[0].name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src="/brand/cincailah-logo.jpeg"
                  alt=""
                  width={88}
                  height={88}
                  className="h-[88px] w-[88px] rounded-[1.4rem] object-cover shadow-lg shadow-sambal/20"
                />
              )}
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="max-w-full"
            />
          )}
          <p className="text-sm text-gray-400 mt-4">
            {candidates.length} option{candidates.length === 1 ? '' : 's'} in the mix!
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <span className="text-6xl mb-4">😔</span>
          <h2 className="text-2xl font-black text-slate mb-2">Aiyah…</h2>
          <p className="text-gray-500 text-center max-w-xs">{error}</p>
          <button
            onClick={() => router.push(`/group/${groupId}`)}
            className="mt-6 bg-sambal hover:bg-sambal-dark text-white font-bold px-6 py-3 rounded-xl transition"
          >
            ← Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!winner) {
    return null;
  }

  return (
    <div className="mx-auto max-w-md px-4">
      <div className="flex min-h-[76vh] flex-col justify-center py-6">
        <div
          className="relative overflow-hidden rounded-[2rem] bg-sambal p-5 pt-6 text-white shadow-2xl shadow-sambal/25 animate-bounce-in"
          role="status"
          aria-live="assertive"
          aria-label={`Winner: ${winner.name}`}
        >
          <div className="pointer-events-none absolute -right-36 top-20 h-80 w-80 rotate-[-22deg] rounded-full border-[34px] border-white/70 border-l-transparent" />
          <div className="pointer-events-none absolute -left-16 bottom-20 h-36 w-36 rounded-full bg-white/10" />

          <div className="relative z-[1]">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]">
                Fast food roulette
              </span>
              <div className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-black">
                You Pick
              </div>
              {rerollsUsed > 0 && (
                <div className="rounded-full bg-black/25 px-3 py-1.5 text-xs font-black">
                  Reroll {rerollsUsed}/{maxReroll}
                </div>
              )}
            </div>

            <div className="mt-5">
              <h2 className="max-w-[13rem] text-4xl font-black leading-[0.92] tracking-[-0.06em]">
                The wheel has spoken.
              </h2>
              <p className="mt-3 max-w-[17rem] text-sm font-bold leading-5 text-white/78">
                No pop-up. The needle lands and your makan answer stays right here.
              </p>
            </div>

            <div className="relative mx-auto mt-8 h-72 w-72 max-w-full">
              <div className="absolute left-1/2 top-[-0.45rem] z-[4] h-16 w-10 -translate-x-1/2 drop-shadow-lg">
                <div className="h-full w-full rounded-2xl bg-white [clip-path:polygon(50%_100%,8%_12%,92%_12%)]" />
                <div className="absolute left-1/2 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-sambal" />
              </div>

              <div className="absolute inset-0 rounded-full border-[10px] border-white bg-[conic-gradient(from_-30deg,#ffc233_0deg_60deg,#ff5a00_60deg_120deg,#e9321b_120deg_180deg,#6d2cb7_180deg_240deg,#078bce_240deg_300deg,#45b619_300deg_360deg)] shadow-2xl shadow-black/25">
                <div className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(from_-30deg,transparent_0deg_58deg,rgba(255,255,255,.82)_58deg_60deg)]" />
                <div className="absolute inset-[28%] rounded-full border-[18px] border-white/95 bg-transparent" />
                {winner.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={winner.photoUrl}
                    alt=""
                    className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/brand/cincailah-logo.jpeg"
                    alt=""
                    className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                )}
              </div>
            </div>

            <div className="-mt-10 rounded-[1.6rem] bg-white/95 p-4 text-slate shadow-2xl shadow-black/20 backdrop-blur">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sambal">
                The needle says
              </p>
              <h3 className="mt-1 text-3xl font-black leading-none tracking-[-0.05em]">
                {winner.name}
              </h3>
              <p className="mt-2 text-sm font-semibold text-gray-500">
                {Array.isArray(winner.cuisineTags) && winner.cuisineTags.length > 0
                  ? (winner.cuisineTags as string[]).join(' · ')
                  : 'Restaurant'}
              </p>
              {userCoords && winner.latitude != null && winner.longitude != null && (
                <p className="mt-1 text-xs font-bold text-blue-500">
                  {haversineKm(userCoords.lat, userCoords.lng, winner.latitude, winner.longitude).toFixed(1)} km away
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {winner.halal && (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                    Halal
                  </span>
                )}
                {winner.vegOptions && (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                    Veg options
                  </span>
                )}
                {Array.isArray(winner.vibeTags) &&
                  (winner.vibeTags as string[]).slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gray-50 p-3 text-center">
                  <p className="text-xs font-semibold text-gray-400">Budget</p>
                  <p className="mt-0.5 text-sm font-black text-slate">
                    {formatPrice(winner.priceMin, winner.priceMax)}
                  </p>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3 text-center">
                  <p className="text-xs font-semibold text-gray-400">Walk</p>
                  <p className="mt-0.5 text-sm font-black text-slate">
                    {winner.walkMinutes} min
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                {winner.mapsUrl ? (
                  <a
                    href={winner.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center rounded-2xl bg-pandan py-3 text-center text-sm font-black text-white shadow-lg shadow-pandan/30 transition hover:bg-pandan-dark"
                  >
                    Let&apos;s go
                  </a>
                ) : (
                  <button
                    onClick={() => router.push(`/group/${groupId}`)}
                    className="flex-1 rounded-2xl bg-pandan py-3 text-center text-sm font-black text-white transition hover:bg-pandan-dark"
                  >
                    Confirmed
                  </button>
                )}
                <button
                  onClick={handleNotThis}
                  disabled={!canReroll}
                  className="flex-1 rounded-2xl bg-gray-100 py-3 text-center text-sm font-black text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {canReroll ? (
                    <>
                      Spin again
                      <span className="block text-[11px] font-medium text-gray-500">
                        {rerollsLeft} reroll{rerollsLeft === 1 ? '' : 's'} left
                      </span>
                    </>
                  ) : (
                    <>
                      No more rerolls
                      <span className="block text-[11px] font-medium text-gray-500">
                        Cincailah lah!
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/group/${groupId}/decide`)}
          className="mt-6 text-sm font-semibold text-gray-400 transition hover:text-gray-600"
        >
          ← Back to filters
        </button>
      </div>

      <RatingPrompt />

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
