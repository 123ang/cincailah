'use client';

import { useEffect, useState } from 'react';
import { SOUND_MUTED_EVENT, isSoundMuted, setSoundMuted } from '@/lib/sound';
import { useT } from '@/components/LocaleProvider';

export default function SoundToggle({ className = '' }: { className?: string }) {
  const t = useT();
  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMuted(isSoundMuted());
    const onChange = (event: Event) => setMuted(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener(SOUND_MUTED_EVENT, onChange);
    return () => window.removeEventListener(SOUND_MUTED_EVENT, onChange);
  }, []);

  if (!mounted) return null;

  const label = muted ? t('Unmute sound effects') : t('Mute sound effects');
  return (
    <button
      type="button"
      onClick={() => setSoundMuted(!muted)}
      aria-label={label}
      aria-pressed={muted}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-base text-gray-500 transition hover:bg-gray-100 hover:text-slate dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white ${className}`}
    >
      <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
    </button>
  );
}
