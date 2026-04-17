'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <div className="mx-auto max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate">Install Cincailah</p>
          <p className="text-xs text-gray-500">Add to home screen for faster access.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Later
          </button>
          <button
            onClick={async () => {
              await deferredPrompt.prompt();
              await deferredPrompt.userChoice;
              setDeferredPrompt(null);
            }}
            className="text-xs font-bold bg-sambal text-white px-3 py-2 rounded-lg"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}
