import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LoginPageClient from '@/components/LoginPageClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const session = await getSession();

  // If already logged in, redirect
  if (session?.isLoggedIn) {
    if (session.activeGroupId) {
      redirect('/group/' + session.activeGroupId);
    } else {
      redirect('/groups');
    }
  }

  const params = await searchParams;

  return (
    <LoginPageClient
      redirectTo={params.redirect || ''}
      error={params.error || ''}
    />
  );
}
