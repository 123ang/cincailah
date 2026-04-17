'use client';

import { useEffect, useRef, useState } from 'react';

interface PendingRating {
  decisionId: string;
  restaurantId: string;
  restaurantName: string;
  decidedAt: number; // epoch ms
}

const STORAGE_KEY = 'cincailah_pending_rating';
const PROMPT_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours

export function schedulePendingRating(
  decisionId: string,
  restaurantId: string,
  restaurantName: string
) {
  const entry: PendingRating = {
    decisionId,
    restaurantId,
    restaurantName,
    decidedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export default function RatingPrompt() {
  const [pending, setPending] = useState<PendingRating | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const upRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const entry: PendingRating = JSON.parse(raw);
        if (Date.now() - entry.decidedAt >= PROMPT_DELAY_MS) {
          setPending(entry);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    };

    check();
    const interval = setInterval(check, 60_000); // re-check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!pending || submitted) return;
    upRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pending, submitted]);

  const dismiss = () => {
    localStorage.removeItem(STORAGE_KEY);
    setPending(null);
  };

  const rate = async (thumbs: 'up' | 'down') => {
    if (!pending) return;
    setSubmitting(true);
    try {
      await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: pending.restaurantId,
          decisionId: pending.decisionId,
          thumbs,
        }),
      });
      setSubmitted(true);
      localStorage.removeItem(STORAGE_KEY);
      setTimeout(() => setPending(null), 2000);
    } finally {
      setSubmitting(false);
    }
  };

  if (!pending) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 w-full max-w-sm pointer-events-auto animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-label="Rate your recent meal"
      >
        {submitted ? (
          <div className="text-center">
            <p className="text-2xl mb-1">🙏</p>
            <p className="font-bold text-slate dark:text-white text-sm">Thanks for rating!</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-slate dark:text-white text-sm">How was it? 🍽️</p>
                <p className="text-xs text-gray-400 mt-0.5">{pending.restaurantName}</p>
              </div>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-gray-300 hover:text-gray-500 text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex gap-3">
              <button
                ref={upRef}
                onClick={() => rate('up')}
                disabled={submitting}
                className="flex-1 bg-pandan/10 hover:bg-pandan/20 text-pandan font-bold py-3 rounded-xl text-2xl transition disabled:opacity-50"
                aria-label="Thumbs up"
              >
                👍
              </button>
              <button
                onClick={() => rate('down')}
                disabled={submitting}
                className="flex-1 bg-red-50 hover:bg-red-100 text-sambal font-bold py-3 rounded-xl text-2xl transition disabled:opacity-50"
                aria-label="Thumbs down"
              >
                👎
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
