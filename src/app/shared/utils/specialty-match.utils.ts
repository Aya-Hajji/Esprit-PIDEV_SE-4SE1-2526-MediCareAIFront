import { Specialty } from '../models/specialty.model';

const STOP = new Set([
  'and',
  'the',
  'for',
  'with',
  'from',
  'care',
  'disease',
  'medicine',
  'medical',
  'clinical',
  'pathway',
  'pathways'
]);

/**
 * Tokens derived from a specialty row: name, description, and optional `matchTags`.
 * Used to score doctor ↔ specialty alignment when explicit `specialtyId` on the user is absent.
 */
export function clinicalTokensFromSpecialty(specialty: Specialty): string[] {
  const out = new Set<string>();
  const push = (raw: string) => {
    const t = raw.toLowerCase().trim();
    if (t.length < 3 || STOP.has(t)) {
      return;
    }
    out.add(t);
  };

  for (const part of (specialty.name || '').split(/[\s/,&–—\-+()]+/)) {
    push(part);
  }

  const desc = (specialty.description || '').toLowerCase();
  for (const w of desc.split(/\W+/)) {
    push(w);
  }

  const tags = (specialty as Specialty & { matchTags?: string }).matchTags;
  if (tags) {
    for (const part of tags.split(/[,;/]/)) {
      push(part);
    }
  }

  return [...out];
}

/** Collapsed text blob for heuristic matching on a user profile. */
export function clinicalProfileBlob(user: {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  username?: string;
  clinicalDepartment?: string;
}): string {
  return [
    user.firstName,
    user.lastName,
    user.fullName,
    user.email,
    user.username,
    user.clinicalDepartment
  ]
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

export function countTokenHitsInBlob(tokens: string[], blob: string): number {
  if (!blob || tokens.length === 0) {
    return 0;
  }
  let hits = 0;
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    if (blob.includes(token)) {
      hits++;
    }
  }
  return hits;
}
