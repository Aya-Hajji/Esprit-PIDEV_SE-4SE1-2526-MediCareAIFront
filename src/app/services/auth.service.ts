import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
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

export interface AuthResponse {
  token: string;
  role?: string;
  email?: string;
  user?: {
    id?: number | string;
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

  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser');

    if (token) {
      this.tokenSubject.next(token);
    }

    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse user from localStorage');
        localStorage.removeItem('authUser');
      }
    }
  }

  // ==================== AUTH METHODS ====================

  register(data: SignupRequest): Observable<AuthResponse> {
    console.log('📝 Registering with email:', data.email);
    const payload = this.buildRegisterPayload(data);
    return this.http.post(`${this.apiUrl}/register`, payload, { responseType: 'text' }).pipe(
      map(raw => {
        console.log('📦 Raw registration response received');
        return this.normalizeAuthResponse(raw);
      }),
      tap(response => {
        console.log('📤 Persisting auth response from registration...');
        this.persistAuthResponse(response);
      }),
      catchError(err => {
        console.error('❌ Register error:', err);
        return throwError(() => err);
      })
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 Logging in with email:', data.email);
    return this.http.post(`${this.apiUrl}/login`, data, { responseType: 'text' }).pipe(
      map(raw => {
        console.log('📦 Raw login response received');
        return this.normalizeAuthResponse(raw);
      }),
      tap(response => {
        console.log('📤 Persisting auth response...');
        this.persistAuthResponse(response);
      }),
      catchError(err => {
        console.error('❌ Login error:', err);
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    localStorage.removeItem('userId');
    
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  requestPasswordReset(data: { email: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, data).pipe(
      catchError(err => {
        console.error('Password reset request error:', err);
        return throwError(() => err);
      })
    );
  }

  resetPassword(data: { email: string; code: string; newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, data).pipe(
      catchError(err => {
        console.error('Password reset error:', err);
        return throwError(() => err);
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.tokenValue;
  }

  get tokenValue(): string | null {
    return this.tokenSubject.value;
  }

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  /** Retourne l'ID utilisateur de manière fiable */
  getCurrentUserId(): number | null {
    console.log('🔍 getCurrentUserId() called - Attempting 5 different strategies...');
    
    // Essai 1: Depuis le BehaviorSubject
    const user = this.currentUserValue;
    console.log('🔍 [1] Current user from BehaviorSubject:', user);
    
    if (user?.id) {
      const id = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      if (!isNaN(id) && id > 0) {
        console.log('✅ [1] Found valid user ID from BehaviorSubject:', id);
        return id;
      }
    }

    if (user?.userId) {
      const id = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      if (!isNaN(id) && id > 0) {
        console.log('✅ [1] Found valid user ID (userId) from BehaviorSubject:', id);
        return id;
      }
    }

    // Essai 2: Directement depuis localStorage.userId
    const userIdStr = localStorage.getItem('userId');
    console.log('🔍 [2] localStorage.userId:', userIdStr);
    
    if (userIdStr) {
      const id = parseInt(userIdStr, 10);
      if (!isNaN(id) && id > 0) {
        console.log('✅ [2] Found valid user ID from localStorage.userId:', id);
        return id;
      } else {
        console.error('❌ [2] localStorage.userId is not a valid number:', userIdStr);
      }
    }

    // Essai 3: Depuis l'objet utilisateur en localStorage.authUser
    const userJsonStr = localStorage.getItem('authUser');
    console.log('🔍 [3] localStorage.authUser:', userJsonStr);
    
    if (userJsonStr) {
      try {
        const userObj = JSON.parse(userJsonStr);
        console.log('🔍 [3] Parsed authUser object:', userObj);
        
        if (userObj.id) {
          const id = typeof userObj.id === 'string' ? parseInt(userObj.id, 10) : userObj.id;
          if (!isNaN(id) && id > 0) {
            console.log('✅ [3] Found valid user ID from authUser.id:', id);
            return id;
          }
        }
        
        if (userObj.userId) {
          const id = typeof userObj.userId === 'string' ? parseInt(userObj.userId, 10) : userObj.userId;
          if (!isNaN(id) && id > 0) {
            console.log('✅ [3] Found valid user ID from authUser.userId:', id);
            return id;
          }
        }
      } catch (e) {
        console.error('❌ [3] Error parsing authUser:', e);
      }
    }

    // Essai 4: Décoder le JWT token
    console.log('🔍 [4] Attempting to decode JWT token...');
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const decoded = JSON.parse(atob(parts[1]));
          console.log('🔍 [4] JWT payload decoded:', decoded);
          
          // Chercher id, sub, ou user.id dans le JWT
          if (decoded.id) {
            const id = typeof decoded.id === 'string' ? parseInt(decoded.id, 10) : decoded.id;
            if (!isNaN(id) && id > 0) {
              console.log('✅ [4] Found user ID from JWT.id:', id);
              return id;
            }
          }
          
          if (decoded.sub) {
            const id = typeof decoded.sub === 'string' ? parseInt(decoded.sub, 10) : decoded.sub;
            if (!isNaN(id) && id > 0) {
              console.log('✅ [4] Found user ID from JWT.sub:', id);
              return id;
            }
          }
          
          if (decoded.user?.id) {
            const id = typeof decoded.user.id === 'string' ? parseInt(decoded.user.id, 10) : decoded.user.id;
            if (!isNaN(id) && id > 0) {
              console.log('✅ [4] Found user ID from JWT.user.id:', id);
              return id;
            }
          }
        }
      } catch (e) {
        console.error('❌ [4] Error decoding JWT:', e);
      }
    } else {
      console.log('🔍 [4] No JWT token found');
    }

    // Essai 5: Dernier recours - vérifier le BehaviorSubject directement
    console.log('🔍 [5] Final attempt - checking BehaviorSubject.value directly...');
    const subValue = this.currentUserSubject.value;
    console.log('🔍 [5] BehaviorSubject.value:', subValue);
    
    if (subValue?.id) {
      const id = typeof subValue.id === 'string' ? parseInt(subValue.id, 10) : subValue.id;
      if (!isNaN(id) && id > 0) {
        console.log('✅ [5] Found user ID from BehaviorSubject.value:', id);
        return id;
      }
    }

    // ÉCHEC - Afficher un résumé complet
    console.error('❌❌❌ FAILED: Could not find valid user ID anywhere! ❌❌❌');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('DIAGNOSTIC SUMMARY:');
    console.error('  localStorage.userId:', localStorage.getItem('userId'));
    console.error('  localStorage.authUser:', localStorage.getItem('authUser'));
    console.error('  localStorage.authToken present:', !!localStorage.getItem('authToken'));
    console.error('  BehaviorSubject currentUserValue:', this.currentUserValue);
    console.error('═══════════════════════════════════════════════════════════');
    
    return null;
  }

  // ==================== PRIVATE HELPERS ====================

  private buildRegisterPayload(data: SignupRequest): any {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    return {
      fullName,
      email: data.email,
      password: data.password,
      role: data.role?.toUpperCase(),
      gender: data.gender,
      phoneNumber: data.phoneNumber
    };
  }

  private normalizeAuthResponse(raw: unknown): AuthResponse {
    const parsed = this.parseRawResponse(raw);

    console.log('🔍 Raw response:', raw);
    console.log('🔍 Parsed response:', parsed);

    const token = parsed?.token || parsed?.accessToken || parsed?.jwt || 
                  parsed?.data?.token || (typeof parsed === 'string' ? parsed : '');

    const userData = parsed?.user || parsed?.data?.user || parsed?.data || parsed || {};

    // Extraction de l'ID - essayer plusieurs chemins possibles
    let userId = userData.id || userData.userId || userData.user?.id || parsed?.id;
    
    console.log('🔍 User data extracted:', userData);
    console.log('🔍 User ID extracted:', userId);

    // Si userId est un objet, chercher la propriété id
    if (typeof userId === 'object' && userId !== null) {
      userId = userId.id || userId.userId;
    }

    // Assurer que userId est un nombre
    if (userId && typeof userId === 'string') {
      userId = parseInt(userId, 10);
    }

    const result = {
      token: token.toString().trim(),
      role: (userData.role || parsed?.role || '').toString().toUpperCase(),
      email: (userData.email || parsed?.email || '').toString(),
      user: {
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: userData.fullName,
        role: userData.role,
        gender: userData.gender,
        phoneNumber: userData.phoneNumber
      }
    };

    console.log('✅ Final normalized response:', result);
    return result;
  }

  private parseRawResponse(raw: unknown): any {
    if (raw && typeof raw === 'object') return raw;
    if (typeof raw !== 'string') return {};

    const trimmed = raw.trim();
    if (!trimmed) return {};

    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed; // c'est probablement un token brut
    }
  }

  private persistAuthResponse(response: AuthResponse): void {
    if (!response?.token) {
      console.error('❌ Cannot persist: No token in response');
      return;
    }

    // Sauvegarder le token
    localStorage.setItem('authToken', response.token);
    this.tokenSubject.next(response.token);
    console.log('✅ Token saved to localStorage');

    // Sauvegarder l'utilisateur
    const userToSave = response.user || { email: response.email, role: response.role };
    localStorage.setItem('authUser', JSON.stringify(userToSave));
    console.log('✅ User data saved to localStorage:', userToSave);

    // Sauvegarder userId séparément (très important)
    if (userToSave.id) {
      const userIdStr = userToSave.id.toString();
      localStorage.setItem('userId', userIdStr);
      console.log('✅ UserID saved to localStorage:', userIdStr);
      
      // Vérifier que c'est bien sauvegardé
      const saved = localStorage.getItem('userId');
      console.log('🔍 Verification - userId in localStorage:', saved);
    } else {
      console.error('❌ No user ID found in response:', userToSave);
    }

    this.currentUserSubject.next(userToSave);
  }
}