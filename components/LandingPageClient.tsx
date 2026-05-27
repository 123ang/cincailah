'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MakanCodeInput from '@/components/MakanCodeInput';
import PublicSiteNav from '@/components/PublicSiteNav';

const featureCards = [
  {
    title: 'Fast food roulette',
    body: 'Open the app, tap once, and get a place without filling a form every time.',
    accent: 'bg-mamak text-slate',
  },
  {
    title: 'Group vote mode',
    body: 'When everyone has opinions, run We Fight and let the team pick fairly.',
    accent: 'bg-pandan text-white',
  },
  {
    title: 'Repeat guard',
    body: 'Keep the same place from winning too often, with an override when you need it.',
    accent: 'bg-ocean text-white',
  },
  {
    title: 'Saved makan mood',
    body: 'Budget, halal, vibes, and favourites remember your usual setup.',
    accent: 'bg-terung text-white',
  },
];

const steps = [
  ['01', 'Start fast', 'Try Solo right away, or create a group for your makan crew.'],
  ['02', 'Add spots', 'Save the restaurants you actually eat at, not a generic list.'],
  ['03', 'Spin or fight', 'Tap once for a pick, or vote when the table wants a say.'],
];

const previewWheelTokens = [
  { label: 'Noodles', mark: '🍜', className: 'left-[55%] top-[11%]' },
  { label: 'Tea', mark: '🧋', className: 'right-[11%] top-[39%]' },
  { label: 'Nasi', mark: '🍚', className: 'bottom-[17%] right-[23%]' },
  { label: 'Sushi', mark: '🍣', className: 'bottom-[18%] left-[17%]' },
  { label: 'Pizza', mark: '🍕', className: 'left-[10%] top-[39%]' },
];

function LogoRoulettePreview() {
  const [spinKey, setSpinKey] = useState(0);

  return (
    <div className="relative mx-auto max-w-md">
      <div className="relative overflow-hidden rounded-[2rem] bg-sambal p-5 pt-6 text-white shadow-2xl shadow-sambal/20">
        <div className="pointer-events-none absolute -right-48 top-40 hidden h-80 w-80 rotate-[-24deg] rounded-full border-[34px] border-white/70 border-l-transparent sm:block" />
        <div className="pointer-events-none absolute -left-16 bottom-24 h-36 w-36 rounded-full bg-white/10" />

        <div className="relative z-[1]">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]">
              Live preview
            </span>
            <button
              type="button"
              onClick={() => setSpinKey((current) => current + 1)}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-sambal shadow-lg shadow-slate/10 transition hover:scale-[1.03]"
            >
              Spin again
            </button>
          </div>

          <div className="mt-6">
            <p className="inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
              Fast food roulette
            </p>
            <h1 className="mt-4 max-w-[8ch] text-6xl font-black leading-[0.88] tracking-tight text-white sm:text-7xl">
              Spin once. Go makan.
            </h1>
            <p className="mt-6 max-w-sm text-base font-bold leading-7 text-white/88">
              Cincailah now shows the wheel landing on the answer, not a pop-up after the fun is over.
            </p>
          </div>

          <div className="relative mx-auto mt-8 h-72 w-72 max-w-full">
            <div className="needle-tick absolute left-1/2 top-[-0.45rem] z-[4] h-16 w-10 -translate-x-1/2 drop-shadow-lg">
              <div className="h-full w-full rounded-2xl bg-white [clip-path:polygon(50%_100%,8%_12%,92%_12%)]" />
              <div className="absolute left-1/2 top-5 h-3 w-3 -translate-x-1/2 rounded-full bg-sambal" />
            </div>

            <div
              key={spinKey}
              className="logo-preview-wheel absolute inset-0 rounded-full border-[10px] border-white bg-[conic-gradient(from_-30deg,#ffc233_0deg_60deg,#ff5a00_60deg_120deg,#e9321b_120deg_180deg,#6d2cb7_180deg_240deg,#078bce_240deg_300deg,#45b619_300deg_360deg)] shadow-2xl shadow-black/25"
            >
              <div className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(from_-30deg,transparent_0deg_58deg,rgba(255,255,255,.82)_58deg_60deg)]" />
              <div className="absolute inset-[28%] rounded-full border-[18px] border-white/95 bg-transparent" />
              <Image
                src="/brand/cincailah-logo.jpeg"
                alt=""
                width={96}
                height={96}
                className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-2xl border-4 border-white object-cover shadow-lg"
                priority
              />
              {previewWheelTokens.map((token) => (
                <span
                  key={token.label}
                  aria-label={token.label}
                  className={`absolute flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-white/90 text-lg shadow-lg ${token.className}`}
                >
                  {token.mark}
                </span>
              ))}
            </div>
          </div>

          <div className="-mt-9 rounded-[1.6rem] bg-white/95 p-4 text-slate shadow-2xl shadow-black/20 backdrop-blur dark:bg-gray-950/95 dark:text-white">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-sambal">
              The needle says
            </p>
            <h2 className="mt-1 text-3xl font-black leading-tight tracking-[-0.02em]">
              Nasi Lemak Kak Ani
            </h2>
            <p className="mt-2 text-sm font-semibold text-slate/55 dark:text-gray-300">
              RM8-14 · 7 min walk · Halal · Comfort food
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/solo"
                className="rounded-2xl bg-pandan px-4 py-3 text-center text-sm font-black text-white shadow-lg shadow-pandan/20 transition hover:scale-[1.02]"
              >
                Try Solo
              </Link>
              <Link
                href="/register"
                className="rounded-2xl bg-slate/10 px-4 py-3 text-center text-sm font-black text-slate transition hover:bg-slate/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
              >
                Create group
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .logo-preview-wheel {
          animation: logo-preview-spin 2.45s cubic-bezier(0.13, 0.9, 0.22, 1) both;
        }

        .needle-tick {
          animation: logo-needle-tick 0.16s steps(2, end) 0s 14 alternate;
        }

        @keyframes logo-preview-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(1578deg);
          }
        }

        @keyframes logo-needle-tick {
          from {
            transform: translateX(-50%) rotate(-5deg);
          }
          to {
            transform: translateX(-50%) rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function LandingPageClient() {
  return (
    <div className="min-h-screen overflow-hidden bg-cream text-slate transition-colors dark:bg-gray-950 dark:text-gray-100">
      <PublicSiteNav />

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-74px)] max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
          <LogoRoulettePreview />

          <div className="relative">
            <div className="brand-ring mx-auto max-w-[23rem]">
              <Image
                src="/brand/cincailah-logo.jpeg"
                alt="Cincailah food roulette logo"
                width={720}
                height={720}
                className="brand-logo aspect-square w-full rounded-[2.4rem]"
                priority
              />
            </div>
            <div className="mx-auto mt-8 max-w-md rounded-[1.75rem] border border-white bg-white/80 p-4 shadow-xl shadow-sambal/10 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
              <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.18em] text-sambal">
                Have a makan code?
              </p>
              <MakanCodeInput />
              <p className="mt-3 text-center text-xs font-semibold text-slate/50 dark:text-gray-400">
                Paste a friend&apos;s code and jump straight into the group.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-sambal">Designed for hungry people</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Less setup, more makan.</h2>
            </div>
            <p className="max-w-sm text-sm font-semibold leading-6 text-slate/60 dark:text-gray-300">
              The app keeps the playful wheel identity, but the interface now behaves like a practical lunch tool.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[1.4rem] border border-white bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sambal/10 dark:border-gray-800 dark:bg-gray-900/80"
              >
                <span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black ${feature.accent}`}>
                  {feature.title.slice(0, 1)}
                </span>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate/60 dark:text-gray-300">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white/70 py-16 dark:bg-gray-900/45">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(([number, title, body]) => (
                <div key={number} className="rounded-[1.4rem] border border-sambal/10 bg-cream p-6 dark:border-white/10 dark:bg-gray-950">
                  <p className="text-sm font-black text-sambal">{number}</p>
                  <h3 className="mt-5 text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate/60 dark:text-gray-300">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-16 text-center">
          <div className="brand-card rounded-[2rem] px-6 py-12 shadow-2xl shadow-sambal/20">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/75">Ready when lunch gets noisy</p>
            <h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
              Make the decision before everyone gets hungry-angry.
            </h2>
            <Link
              href="/register"
              className="mt-8 inline-flex rounded-2xl bg-white px-8 py-4 text-base font-black text-sambal shadow-xl transition hover:scale-[1.02]"
            >
              Create free account
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-sambal/10 bg-slate px-4 py-10 text-white dark:border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/cincailah-logo.jpeg"
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-2xl"
            />
            <div>
              <p className="font-black">cincailah</p>
              <p className="text-sm text-white/55">The fastest way to decide where to makan.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm font-bold text-white/60">
            <a href="/about" className="transition hover:text-white">About</a>
            <a href="/privacy" className="transition hover:text-white">Privacy</a>
            <a href="/terms" className="transition hover:text-white">Terms</a>
            <a href="mailto:support@cincailah.com" className="transition hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
