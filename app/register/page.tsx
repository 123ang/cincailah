import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import RegisterPageClient from '@/components/RegisterPageClient';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  const pendingCode = (params.code || '').trim().toUpperCase() || undefined;

  // If already logged in, route them straight to join flow or their group
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

  return <RegisterPageClient pendingCode={pendingCode} />;
}
