export function isPrivilegedGroupRole(role?: string | null) {
  return role === 'owner' || role === 'admin';
}

export function getRoleLabel(role?: string | null) {
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Member';
}
