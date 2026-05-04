import { User } from '../models/user.model';

export type UserDisplayFields = Pick<User, 'id' | 'firstName' | 'lastName' | 'fullName' | 'username' | 'email'>;

/** Human-readable name for UI (never includes database id). */
export function getUserDisplayName(user: UserDisplayFields | null | undefined): string {
  if (!user) {
    return 'Unknown';
  }
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  const name = fromParts || user.fullName || user.username || user.email;
  return (name || 'Unknown').trim();
}

export function buildUserDisplayMap(users: User[]): Map<number, string> {
  const map = new Map<number, string>();
  for (const u of users) {
    if (u.id != null) {
      map.set(u.id, getUserDisplayName(u));
    }
  }
  return map;
}

export function displayNameForUserId(map: Map<number, string>, id: number | undefined | null): string {
  if (id == null || id <= 0) {
    return '—';
  }
  return map.get(id) ?? 'Unknown';
}
