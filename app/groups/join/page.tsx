import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import JoinGroupClient from '@/components/JoinGroupClient';

export default async function JoinGroupPage() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect('/login');
  }

  return <JoinGroupClient />;
}
