import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LandingPageClient from '@/components/LandingPageClient';

export const metadata: Metadata = {
  title: 'Cincailah — Decide Where to Makan in 10 Seconds',
  description:
    'No more "makan apa?" debates. Spin the wheel or run a group vote. Free, fast, and works on any device. Try it — no signup needed!',
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  const session = await getSession();

  // If logged in, redirect to groups or active group
  if (session?.isLoggedIn) {
    if (session.activeGroupId) {
      redirect('/group/' + session.activeGroupId);
    } else {
      redirect('/groups');
    }
  }

  return <LandingPageClient />;
}
