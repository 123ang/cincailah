'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          void registration.unregister();
        });
      });
      if ('caches' in window) {
        void caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => key.startsWith('cincailah-'))
              .map((key) => caches.delete(key))
          )
        );
      }
      return;
    }

    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // non-fatal in development or unsupported environments
    });
  }, []);

  return null;
}
