'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface MakanCodeInputProps {
  variant?: 'hero' | 'compact';
  placeholder?: string;
}

export default function MakanCodeInput({
  variant = 'hero',
  placeholder = 'Enter Makan Code',
}: MakanCodeInputProps) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) {
      setError('Code should be at least 4 characters');
      return;
    }
    setSubmitting(true);
    router.push(`/join/${encodeURIComponent(trimmed)}`);
  };

  if (variant === 'compact') {
    return (
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🤝</span>
          <span className="text-sm font-bold text-slate">
            Got a Makan Code from a friend?
          </span>
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={placeholder}
            maxLength={12}
            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none"
          />
          <button
            type="submit"
            disabled={submitting || code.trim().length < 4}
            className="btn-cincai text-white font-bold px-5 py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            Join
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-2 font-semibold">{error}</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
          Have a Makan Code?
        </label>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder={placeholder}
            maxLength={12}
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-base font-mono font-bold tracking-widest text-center focus:ring-2 focus:ring-sambal/30 focus:border-sambal outline-none"
          />
          <button
            type="submit"
            disabled={submitting || code.trim().length < 4}
            className="btn-cincai text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"
          >
            Join →
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-2 font-semibold">{error}</p>
        )}
      </div>
    </form>
  );
}
