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
