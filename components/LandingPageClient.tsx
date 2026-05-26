'use client';

import Link from 'next/link';
import Image from 'next/image';
import MakanCodeInput from '@/components/MakanCodeInput';
import DarkModeToggle from '@/components/DarkModeToggle';

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

export default function LandingPageClient() {
  return (
    <div className="min-h-screen overflow-hidden bg-cream text-slate">
      <nav className="sticky top-0 z-50 border-b border-white/70 bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3" aria-label="Cincailah home">
            <Image
              src="/brand/cincailah-logo.jpeg"
              alt=""
              width={44}
              height={44}
              className="brand-logo h-11 w-11 rounded-2xl"
              priority
            />
            <div>
              <p className="text-lg font-black leading-none tracking-tight">cincailah</p>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sambal">makan roulette</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <DarkModeToggle />
            <Link
              href="/solo"
              className="hidden rounded-full px-4 py-2 text-sm font-black text-slate transition hover:bg-white sm:inline-flex"
            >
              Solo
            </Link>
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-black text-slate transition hover:bg-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="btn-cincai rounded-full px-5 py-2 text-sm font-black text-white"
            >
              Start
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="mx-auto grid min-h-[calc(100vh-74px)] max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:py-14">
          <div className="brand-card relative overflow-hidden rounded-[2rem] px-6 py-8 shadow-2xl shadow-sambal/20 sm:px-10 sm:py-12">
            <div className="absolute -bottom-16 -left-20 h-52 w-52 rounded-full border-[28px] border-white/80 border-r-transparent" />
            <div className="relative max-w-xl">
              <p className="mb-5 inline-flex rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.16em]">
                Fast food roulette
              </p>
              <h1 className="max-w-[8ch] text-6xl font-black leading-[0.88] tracking-tight text-white sm:text-7xl md:text-8xl">
                Spin once. Go makan.
              </h1>
              <p className="mt-7 max-w-md text-lg font-bold leading-8 text-white/90">
                Cincailah now starts with the decision button. Your usual filters stay saved underneath, so random food feels fun instead of troublesome.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/solo"
                  className="rounded-2xl bg-white px-7 py-4 text-center text-base font-black text-sambal shadow-xl shadow-slate/10 transition hover:scale-[1.02]"
                >
                  Try solo spin
                </Link>
                <Link
                  href="/register"
                  className="rounded-2xl border-2 border-white/50 px-7 py-4 text-center text-base font-black text-white transition hover:bg-white/10"
                >
                  Create group
                </Link>
              </div>
            </div>
          </div>

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
            <div className="mx-auto mt-8 max-w-md rounded-[1.75rem] border border-white bg-white/80 p-4 shadow-xl shadow-sambal/10 backdrop-blur">
              <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.18em] text-sambal">
                Have a makan code?
              </p>
              <MakanCodeInput />
              <p className="mt-3 text-center text-xs font-semibold text-slate/50">
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
            <p className="max-w-sm text-sm font-semibold leading-6 text-slate/60">
              The app keeps the playful wheel identity, but the interface now behaves like a practical lunch tool.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {featureCards.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[1.4rem] border border-white bg-white/80 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sambal/10"
              >
                <span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black ${feature.accent}`}>
                  {feature.title.slice(0, 1)}
                </span>
                <h3 className="text-lg font-black">{feature.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate/60">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-white/70 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(([number, title, body]) => (
                <div key={number} className="rounded-[1.4rem] border border-sambal/10 bg-cream p-6">
                  <p className="text-sm font-black text-sambal">{number}</p>
                  <h3 className="mt-5 text-2xl font-black">{title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-slate/60">{body}</p>
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

      <footer className="border-t border-sambal/10 bg-slate px-4 py-10 text-white">
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
