import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import LoginPageClient from '@/components/LoginPageClient';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; code?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const pendingCode = (params.code || '').trim().toUpperCase() || undefined;

  if (session?.isLoggedIn) {
    if (pendingCode) {
      redirect(`/join/${pendingCode}`);
    }
    if (session.activeGroupId) {
      redirect('/group/' + session.activeGroupId);
    } else {
      redirect('/groups');
    }
  }

  return (
    <LoginPageClient
      redirectTo={params.redirect || ''}
      error={params.error || ''}
      pendingCode={pendingCode}
    />
  );
}
