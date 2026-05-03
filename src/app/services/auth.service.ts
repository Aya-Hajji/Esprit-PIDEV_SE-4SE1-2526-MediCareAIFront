import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
      map(response => this.normalizeAuthResponse(response, data.email)),
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
    return this.http.post(`${this.apiUrl}/login`, data, { responseType: 'text' }).pipe(
      map(response => this.normalizeAuthResponse(response, data.email)),
      tap(response => {
        console.log('Login successful:', response);
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
   * Logout user
   */
  logout(): void {
    // Clear token and user from local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
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
  private normalizeAuthResponse(raw: unknown, fallbackEmail = ''): AuthResponse {
    const parsed = this.parseRawResponse(raw);

    if (typeof parsed === 'string') {
      const token = parsed.trim().replace(/^"|"$/g, '');
      const roleFromToken = this.extractRoleFromToken(token);
      const emailFromToken = this.extractEmailFromToken(token);
      const userIdFromToken = this.extractUserIdFromToken(token);

      return {
        token,
        role: roleFromToken,
        email: emailFromToken || fallbackEmail,
        user: {
          id: userIdFromToken ?? undefined,
          email: emailFromToken || fallbackEmail,
          role: roleFromToken
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

    const roleFinal = role || this.extractRoleFromToken(token);
    const emailFinal = email || this.extractEmailFromToken(token);
    const userIdFinal = this.resolveAuthUserId(parsed, backendUser, token);

    const fullName = (backendUser?.fullName || parsed?.fullName || '').toString();
    const firstName = (backendUser?.firstName || '').toString();
    const lastName = (backendUser?.lastName || '').toString();

    return {
      token: token.toString(),
      role: roleFinal,
      email: emailFinal,
      user: {
        id: userIdFinal ?? undefined,
        email: emailFinal,
        role: roleFinal,
        fullName,
        firstName,
        lastName,
        gender: backendUser?.gender,
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
    const userData = {
      email: response.email,
      role: response.role,
      ...response.user
    };
    this.setUser(userData);
  }

  private extractRoleFromToken(token: string): string {
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return '';
    }

    const role = payload.role || payload.roles || payload.authority || payload.authorities;
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

  private extractUserIdFromToken(token: string): number | null {
    const payload = this.decodeJwtPayload(token);
    if (!payload) {
      return null;
    }

    const candidate = Number(
      payload.id
      ?? payload.userId
      ?? payload.uid
      ?? payload.user_id
      ?? payload.userID
      ?? payload.nameid
      ?? payload.name_id
      ?? payload.sub
    );

    return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
  }

  private resolveAuthUserId(parsed: any, backendUser: any, token: string): number | null {
    const candidate = Number(
      backendUser?.id
      ?? backendUser?.userId
      ?? backendUser?.uid
      ?? parsed?.id
      ?? parsed?.userId
      ?? parsed?.uid
      ?? parsed?.data?.id
      ?? parsed?.data?.userId
      ?? parsed?.data?.uid
    );

    if (Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }

    return this.extractUserIdFromToken(token);
  }

  private decodeJwtPayload(token: string): any | null {
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
      return JSON.parse(decoded);
    } catch {
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
}
