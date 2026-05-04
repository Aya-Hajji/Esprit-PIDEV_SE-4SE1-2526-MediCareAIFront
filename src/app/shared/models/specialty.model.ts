export interface Specialty {
  id?: number;
  name: string;
  description?: string;
  /** Comma/semicolon-separated synonyms for routing (demo + offline); backend may omit. */
  matchTags?: string;
}

export interface SpecialtyDTO {
  id?: number;
  name: string;
  description?: string;
  matchTags?: string;
}
