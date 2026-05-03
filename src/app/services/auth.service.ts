import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  gender: string;
  phoneNumber: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  email: string;
  code: string;
  newPassword: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  email: string;
  user?: {
    id?: string | number;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    role?: string;
    gender?: string;
    phoneNumber?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private apiUrl = `${this.baseUrl}/auth`;
  private patientUrl = `${this.baseUrl}/patient`;
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;
  private tokenSubject: BehaviorSubject<string | null>;
  public token: Observable<string | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromLocalStorage());
    this.currentUser = this.currentUserSubject.asObservable();
    
    this.tokenSubject = new BehaviorSubject<string | null>(this.getTokenFromLocalStorage());
    this.token = this.tokenSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  public get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  /**
   * Register a new user
   */
  register(data: SignupRequest): Observable<AuthResponse> {
    console.log('Sending registration request to:', `${this.apiUrl}/register-with-verification`);
    const payload = this.buildRegisterPayload(data);
    console.log('Payload:', payload);
    return this.http.post(`${this.apiUrl}/register`, payload, { responseType: 'text' }).pipe(
      map(response => this.normalizeAuthResponse(response, data.email, data.gender)),
      tap(response => {
        console.log('Registration successful:', response);
        this.persistAuthResponse(response);
      })
    );
  }

  /**
   * Login user
   */
  login(data: LoginRequest): Observable<AuthResponse> {
    console.log('Sending login request to:', `${this.apiUrl}/login`);
    console.log('Payload:', data);
    const existingUser = this.currentUserValue || this.getUserFromLocalStorage() || {};
    const fallbackGender =
      this.normalizeGenderValue(existingUser?.gender || existingUser?.user?.gender || localStorage.getItem('userGender')) || '';

    return this.http.post(`${this.apiUrl}/login`, data, { responseType: 'text' }).pipe(
      map(response => this.normalizeAuthResponse(response, data.email, fallbackGender)),
      tap(response => {
        console.log('Login successful, normalized response:', response);
        console.log('Role from response:', response.role);
        console.log('User from response:', response.user);
        this.persistAuthResponse(response);
      })
    );
  }

  /**
   * Verify email with code
   */
  verifyEmail(data: VerifyEmailRequest): Observable<AuthResponse> {
    console.log('Sending email verification request');
    return this.http.post(`${this.apiUrl}/verify-email`, data, { responseType: 'text' }).pipe(
      map(response => this.normalizeAuthResponse(response, data.email)),
      tap(response => {
        console.log('Email verified successfully:', response);
        this.persistAuthResponse(response);
      })
    );
  }

  /**
   * Resend email verification code
   */
  resendVerificationCode(data: ResendVerificationRequest): Observable<{ message: string }> {
    console.log('Resending verification code to:', data.email);
    return this.http.post(`${this.apiUrl}/resend-verification`, data, { responseType: 'text' }).pipe(
      map(response => this.normalizeMessageResponse(response, 'Verification code sent.')),
      tap(response => {
        console.log('Verification code resent:', response);
      })
    );
  }

  /**
   * Request password reset
   */
  requestPasswordReset(data: PasswordResetRequest): Observable<{ message: string }> {
    console.log('Requesting password reset for:', data.email);
    return this.http.post(`${this.apiUrl}/forgot-password`, data, { responseType: 'text' }).pipe(
      map(response => this.normalizeMessageResponse(response, 'Password reset code sent.')),
      tap(response => {
        console.log('Password reset email sent:', response);
      })
    );
  }

  /**
   * Confirm password reset with code and new password
   */
  resetPassword(data: PasswordResetConfirmRequest): Observable<{ message: string }> {
    console.log('Resetting password');
    return this.http.post(`${this.apiUrl}/reset-password`, data, { responseType: 'text' }).pipe(
      map(response => this.normalizeMessageResponse(response, 'Password reset successfully.')),
      tap(response => {
        console.log('Password reset successfully:', response);
      })
    );
  }

  /**
   * Health check endpoint from patient-controller
   */
  getPatientHello(): Observable<string> {
    return this.http.get(`${this.patientUrl}/hello`, { responseType: 'text' });
  }

  /**
   * Resolve the current authenticated user's numeric id.
   * Tries the local session first, then falls back to the backend `/auth/user-id` endpoint.
   */
  getCurrentUserId(): Observable<number | null> {
    const localUserId = this.getCurrentUserIdFromSession();
    if (localUserId !== null) {
      return of(localUserId);
    }

    return this.http.get(`${this.apiUrl}/user-id`, { responseType: 'text' }).pipe(
      map((response) => {
        const parsed = this.parseRawResponse(response);
        const resolvedId = this.extractPositiveUserId(parsed);

        if (resolvedId !== null) {
          localStorage.setItem('userId', String(resolvedId));
          const existingUser = this.currentUserValue || this.getUserFromLocalStorage() || {};
          this.setUser({ ...existingUser, id: resolvedId });
        }

        return resolvedId;
      }),
      catchError((error) => {
        console.error('Unable to resolve current user id from backend:', error);
        return of(null);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear token and user from local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userGender');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.tokenValue;
  }

  /**
   * Set token in local storage and update subject
   */
  private setToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.tokenSubject.next(token);
  }

  /**
   * Set user in local storage and update subject
   */
  private setUser(user: any): void {
    localStorage.setItem('authUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Build registration payload compatible with new backend model.
   */
  private buildRegisterPayload(data: SignupRequest): any {
    const firstName = (data.firstName || '').trim();
    const lastName = (data.lastName || '').trim();
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      fullName,
      email: data.email,
      password: data.password,
      role: data.role,
      gender: data.gender,
      phoneNumber: data.phoneNumber
    };
  }

  /**
   * Normalize backend auth response (JSON object, JSON string, or raw token string).
   */
  private normalizeAuthResponse(raw: unknown, fallbackEmail = '', fallbackGender = ''): AuthResponse {
    const parsed = this.parseRawResponse(raw);
    console.log('Raw auth response:', raw);
    console.log('Parsed auth response:', parsed);

    if (typeof parsed === 'string') {
      const token = parsed.trim().replace(/^"|"$/g, '');
      const roleFromToken = this.extractRoleFromToken(token);
      const emailFromToken = this.extractEmailFromToken(token);

      console.log('Token extracted:', token.substring(0, 50) + '...');
      console.log('Role from token:', roleFromToken);
      console.log('Email from token:', emailFromToken);

      return {
        token,
        role: roleFromToken,
        email: emailFromToken || fallbackEmail,
        user: {
          email: emailFromToken || fallbackEmail,
          role: roleFromToken,
          gender: this.normalizeGenderValue(fallbackGender) || undefined
        }
      };
    }

    const token =
      parsed?.token ||
      parsed?.accessToken ||
      parsed?.jwt ||
      parsed?.jwtToken ||
      parsed?.data?.token ||
      '';

    const backendUser = parsed?.user || parsed?.data?.user || parsed?.data || {};
    const role = (parsed?.role || backendUser?.role || '').toString();
    const email = (parsed?.email || backendUser?.email || fallbackEmail || '').toString();

    console.log('Token from parsed response:', token ? token.substring(0, 50) + '...' : 'null');
    console.log('Role from parsed response:', role);
    console.log('Email from parsed response:', email);
    console.log('Backend user object:', backendUser);

    const roleFinal = role || this.extractRoleFromToken(token);
    const emailFinal = email || this.extractEmailFromToken(token);

    console.log('Final role after token extraction:', roleFinal);
    console.log('Final email after token extraction:', emailFinal);

    const fullName = (backendUser?.fullName || parsed?.fullName || '').toString();
    const firstName = (backendUser?.firstName || '').toString();
    const lastName = (backendUser?.lastName || '').toString();
    const gender = this.normalizeGenderValue(backendUser?.gender || parsed?.gender || fallbackGender);

    return {
      token: token.toString(),
      role: roleFinal,
      email: emailFinal,
      user: {
        id: backendUser?.id,
        email: emailFinal,
        role: roleFinal,
        fullName,
        firstName,
        lastName,
        gender: gender || undefined,
        phoneNumber: backendUser?.phoneNumber
      }
    };
  }

  private parseRawResponse(raw: unknown): any {
    if (raw && typeof raw === 'object') {
      return raw;
    }

    if (typeof raw !== 'string') {
      return {};
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return {};
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  private normalizeMessageResponse(raw: unknown, fallbackMessage: string): { message: string } {
    const parsed = this.parseRawResponse(raw);

    if (typeof parsed === 'string') {
      return { message: parsed || fallbackMessage };
    }

    return {
      message: parsed?.message || fallbackMessage
    };
  }

  private persistAuthResponse(response: AuthResponse): void {
    if (!response?.token) {
      return;
    }

    this.setToken(response.token);
    const resolvedUserId = this.extractPositiveUserId(response.user) ?? this.extractNumericUserIdFromToken(response.token);
    const existingUser = this.currentUserValue || this.getUserFromLocalStorage() || {};
    const resolvedGender = this.normalizeGenderValue(
      response.user?.gender || existingUser?.gender || existingUser?.user?.gender || localStorage.getItem('userGender')
    );
    const userData = {
      email: response.email,
      role: response.role,
      ...response.user,
      ...(resolvedGender ? { gender: resolvedGender } : {}),
      ...(resolvedUserId !== null ? { id: resolvedUserId } : {})
    };

    if (resolvedUserId !== null) {
      localStorage.setItem('userId', String(resolvedUserId));
    }

    if (resolvedGender) {
      localStorage.setItem('userGender', resolvedGender);
    }

    this.setUser(userData);
  }

  private normalizeGenderValue(value: unknown): string {
    const normalized = (value || '').toString().trim().toUpperCase();
    if (normalized === 'F') {
      return 'FEMALE';
    }
    if (normalized === 'M') {
      return 'MALE';
    }
    return normalized;
  }

  private extractRoleFromToken(token: string): string {
    const payload = this.decodeJwtPayload(token);
    console.log('JWT payload:', payload);
    if (!payload) {
      console.log('No JWT payload found');
      return '';
    }

    const role = payload.role || payload.roles || payload.authority || payload.authorities || payload.userRole || payload.user?.role || payload.claims?.role;
    console.log('Role found in payload:', role);
    if (Array.isArray(role)) {
      return (role[0] || '').toString();
    }

    return (role || '').toString();
  }

  private extractEmailFromToken(token: string): string {
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return '';
    }

    return (payload.email || payload.sub || payload.username || '').toString();
  }

  private decodeJwtPayload(token: string): any | null {
    if (!token || !token.includes('.')) {
      console.log('Token is not a valid JWT format');
      return null;
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        console.log('No payload part in JWT');
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);
      console.log('Successfully decoded JWT payload');
      return parsed;
    } catch (error) {
      console.error('Error decoding JWT payload:', error);
      return null;
    }
  }

  /**
   * Get token from local storage
   */
  private getTokenFromLocalStorage(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('authToken');
    if (!token || token === 'undefined' || token === 'null') return null;
    return token;
  }

  /**
   * Get user from local storage
   */
  private getUserFromLocalStorage(): any {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('authUser');
    if (!user || user === 'undefined' || user === 'null') return null;
    try {
      return JSON.parse(user);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('authUser');
      return null;
    }
  }

  private getCurrentUserIdFromSession(): number | null {
    const currentUserId = this.extractPositiveUserId(this.currentUserValue);
    if (currentUserId !== null) {
      return currentUserId;
    }

    const storedUser = this.getUserFromLocalStorage();
    const storedUserId = this.extractPositiveUserId(storedUser);
    if (storedUserId !== null) {
      return storedUserId;
    }

    const persistedUserId = Number(localStorage.getItem('userId'));
    if (Number.isFinite(persistedUserId) && persistedUserId > 0) {
      return persistedUserId;
    }

    return this.extractNumericUserIdFromToken(this.tokenValue || this.getTokenFromLocalStorage());
  }

  private extractPositiveUserId(source: unknown): number | null {
    if (source === null || source === undefined) {
      return null;
    }

    if (typeof source === 'number') {
      return Number.isFinite(source) && source > 0 ? source : null;
    }

    if (typeof source === 'string') {
      const trimmed = source.trim();
      if (!trimmed) {
        return null;
      }

      const asNumber = Number(trimmed);
      if (Number.isFinite(asNumber) && asNumber > 0) {
        return asNumber;
      }

      const parsed = this.parseRawResponse(trimmed);
      return parsed === source ? null : this.extractPositiveUserId(parsed);
    }

    if (typeof source === 'object') {
      const objectSource = source as Record<string, unknown>;
      const candidate = objectSource['id'] ?? objectSource['userId'] ?? objectSource['user_id'] ?? objectSource['uid'];
      const nested = objectSource['user'];
      const data = objectSource['data'];

      const directCandidate = this.extractPositiveUserId(candidate);
      if (directCandidate !== null) {
        return directCandidate;
      }

      const nestedCandidate = this.extractPositiveUserId(nested);
      if (nestedCandidate !== null) {
        return nestedCandidate;
      }

      return this.extractPositiveUserId(data);
    }

    return null;
  }

  private extractNumericUserIdFromToken(token: string | null): number | null {
    if (!token || !token.includes('.')) {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const decoded = atob(padded);
      const parsed = JSON.parse(decoded);
      return this.extractPositiveUserId(parsed);
    } catch {
      return null;
    }
  }
}
