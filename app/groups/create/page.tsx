import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import CreateGroupClient from '@/components/CreateGroupClient';

export default async function CreateGroupPage() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect('/login');
  }

  return <CreateGroupClient />;
}
