import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LandingPageClient from '@/components/LandingPageClient';

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
