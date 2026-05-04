export interface User {
  id?: number;
  username?: string;
  email: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'NURSE' | 'PHARMACIST';
  fullName?: string;
  firstName?: string;
  lastName?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phoneNumber?: string;
  premium?: boolean;
  /** When provided by auth API or demo enrichment; used for specialty-based routing. */
  specialtyId?: number;
  /** Free-text department from API (e.g. “Cardiology clinic”). */
  clinicalDepartment?: string;
}

/**
 * Backend User entity DTO (matches Java entity)
 */
export interface BackendUser {
  id?: number;
  fullName: string;
  email: string;
  password?: string;
  role: string;
}

export interface UserRequestDTO {
  username: string;
  email: string;
  password: string;
  role: string;
  premium?: boolean;
}

export interface UserResponseDTO {
  id: number;
  username: string;
  email: string;
  role: string;
  premium: boolean;
}

/** GET /auth/doctors/recommend — multi-table keyword match (profile + visit notes + medical record). */
export interface PhysicianRecommendationApiRow {
  doctorId: number;
  fullName: string;
  email: string;
  clinicalDepartment?: string;
  clinicalKeywords?: string;
  matchScore: number;
  matchedSignals: string;
}
