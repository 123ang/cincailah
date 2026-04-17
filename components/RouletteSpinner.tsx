'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/utils';

interface Restaurant {
  id: string;
  name: string;
  cuisineTags: any;
  vibeTags: any;
  priceMin: number;
  priceMax: number;
  halal: boolean;
  vegOptions: boolean;
  walkMinutes: number;
  mapsUrl: string | null;
}

interface RouletteSpinnerProps {
  groupId: string;
  userId: string;
  filters: any;
}

const LOADING_TEXTS = [
  "Asking the boss...",
  "Checking wallet...",
  "Consulting grandma...",
  "Flipping coin...",
  "Reading your fortune...",
  "Sniffing the air...",
];

export default function RouletteSpinner({ groupId, userId, filters }: RouletteSpinnerProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<'loading' | 'spinning' | 'result'>('loading');
  const [loadingText, setLoadingText] = useState(LOADING_TEXTS[0]);
  const [candidates, setCandidates] = useState<Restaurant[]>([]);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Cycle through loading texts
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_TEXTS.length;
      setLoadingText(LOADING_TEXTS[idx]);
    }, 1200);

    // Fetch decision from API
    fetchDecision();

    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const fetchDecision = async () => {
    try {
      const res = await fetch('/api/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, filters }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get decision');
      }

      setCandidates(data.candidates);
      setWinner(data.winner);

      // Start spinning after 1 second
      setTimeout(() => {
        setPhase('spinning');
        startSpinAnimation(data.candidates, data.winner);
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setPhase('result');
    }
  };

  const startSpinAnimation = (allCandidates: Restaurant[], finalWinner: Restaurant) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;

    let currentRotation = 0;
    const totalSpinTime = 3000; // 3 seconds
    const startTime = Date.now();
    const winnerIndex = allCandidates.findIndex(c => c.id === finalWinner.id);
    const targetAngle = (360 * 5) + (360 - (winnerIndex / allCandidates.length) * 360); // 5 full rotations + position

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalSpinTime, 1);
      
      // Easing function: ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      currentRotation = easeProgress * targetAngle;
      setRotation(currentRotation);
      
      drawWheel(ctx, centerX, centerY, radius, allCandidates, currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Finished spinning
        setTimeout(() => {
          setPhase('result');
        }, 500);
      }
    };

    animate();
  };

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    items: Restaurant[],
    rotation: number
  ) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    const sliceAngle = (2 * Math.PI) / items.length;
    const colors = ['#DC2626', '#FACC15', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

    items.forEach((item, i) => {
      const angle = (rotation * Math.PI) / 180 + i * sliceAngle;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw text
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

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw pointer at top
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 20);
    ctx.lineTo(centerX - 15, centerY - radius);
    ctx.lineTo(centerX + 15, centerY - radius);
    ctx.closePath();
    ctx.fillStyle = '#DC2626';
    ctx.fill();
  };

  useEffect(() => {
    if (phase === 'spinning' && candidates.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        drawWheel(ctx, centerX, centerY, radius, candidates, rotation);
      }
    }
  }, [rotation, phase, candidates]);

  if (phase === 'loading') {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-gray-200 border-t-sambal animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-5xl">🍛</span>
          </div>
          <p className="mt-8 text-lg font-bold text-gray-700 animate-pulse">{loadingText}</p>
          <p className="text-sm text-gray-400 mt-2">Applying filters & anti-repeat...</p>
          <div className="mt-6 flex gap-1">
            <div className="w-2 h-2 rounded-full bg-sambal animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 rounded-full bg-sambal animate-bounce" style={{ animationDelay: '0.15s' }}></div>
            <div className="w-2 h-2 rounded-full bg-sambal animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'spinning') {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <h2 className="text-2xl font-black text-slate mb-6">Spinning the wheel...</h2>
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="max-w-full"
          />
          <p className="text-sm text-gray-400 mt-4">{candidates.length} options in the mix!</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <span className="text-6xl mb-4">😔</span>
          <h2 className="text-2xl font-black text-slate mb-2">Aiyah...</h2>
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
    <div className="max-w-md mx-auto px-4">
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-full animate-bounce-in">
          <p className="text-center text-sm text-gray-400 mb-4">🎉 The boss has spoken!</p>

          {/* Result Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-sambal to-red-400 flex items-center justify-center relative">
              <span className="text-7xl">🍜</span>
              <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs font-bold text-sambal">
                You Pick
              </div>
            </div>

            <div className="p-5">
              <h2 className="text-2xl font-black text-slate">{winner.name}</h2>
              <p className="text-gray-400 text-sm mt-1">
                {Array.isArray(winner.cuisineTags) && winner.cuisineTags.length > 0
                  ? winner.cuisineTags.join(' · ')
                  : 'Restaurant'}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                {winner.halal && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    ✅ Halal
                  </span>
                )}
                {winner.vegOptions && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                    🌱 Veg Options
                  </span>
                )}
                {Array.isArray(winner.vibeTags) &&
                  winner.vibeTags.slice(0, 3).map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">Budget</p>
                  <p className="text-sm font-bold text-slate mt-0.5">
                    {formatPrice(winner.priceMin, winner.priceMax)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-400">Walk</p>
                  <p className="text-sm font-bold text-slate mt-0.5">{winner.walkMinutes} min 🚶</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-5">
                {winner.mapsUrl ? (
                  <a
                    href={winner.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-pandan hover:bg-pandan-dark text-white font-bold py-3 rounded-xl text-center text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-pandan/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Let's Go!
                  </a>
                ) : (
                  <button
                    onClick={() => router.push(`/group/${groupId}`)}
                    className="flex-1 bg-pandan hover:bg-pandan-dark text-white font-bold py-3 rounded-xl text-center text-sm transition"
                  >
                    Confirmed! ✅
                  </button>
                )}
                <button
                  onClick={() => router.push(`/group/${groupId}`)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-center text-sm transition"
                >
                  Don't want 😤
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push(`/group/${groupId}`)}
          className="mt-6 text-sm text-gray-400 hover:text-gray-600 font-medium transition"
        >
          ← Back to filters
        </button>
      </div>

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
