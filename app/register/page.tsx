import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import RegisterPageClient from '@/components/RegisterPageClient';

export default async function RegisterPage() {
  const session = await getSession();

  // If already logged in, redirect
  if (session?.isLoggedIn) {
    if (session.activeGroupId) {
      redirect('/group/' + session.activeGroupId);
    } else {
      redirect('/groups');
    }
  }

  return <RegisterPageClient />;
}
