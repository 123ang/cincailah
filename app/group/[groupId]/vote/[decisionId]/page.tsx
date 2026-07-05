import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import VotePageClient from '@/components/VotePageClient';

export default async function ExistingVotePage({
  params,
}: {
  params: Promise<{ groupId: string; decisionId: string }>;
}) {
  const session = await getSession();
  const { groupId, decisionId } = await params;

  if (!session.isLoggedIn || !session.userId) {
    redirect('/');
  }

  return (
    <VotePageClient
      groupId={groupId}
      userId={session.userId}
      displayName={session.displayName || 'User'}
      filters={{}}
      initialDecisionId={decisionId}
    />
  );
}
