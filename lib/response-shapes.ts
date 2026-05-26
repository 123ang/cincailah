export const memberUserSelect = {
  id: true,
  displayName: true,
  avatarUrl: true,
} as const;

export const publicVoteUserSelect = memberUserSelect;

export type PublicUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export function toPublicVoteUser(user: {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
  };
}
