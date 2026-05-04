import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PhysicianRecommendationApiRow, User, UserRequestDTO, UserResponseDTO } from '../models/user.model';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { CLINICAL_SPECIALTY_SEED } from '../data/clinical-specialties.catalog';

export interface UserFilters {
  role?: User['role'];
  search?: string;
  query?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private readonly authUsersUrl = `${this.baseUrl}/auth/users`;
  private readonly authDoctorsUrl = `${this.baseUrl}/auth/doctors`;
  private readonly registerUrl = `${this.baseUrl}/auth/register`;
  private readonly cacheStorageKey = 'cachedUsers';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllUsers(filters?: UserFilters): Observable<User[]> {
    const params = this.buildUserParams(filters);
    return this.http.get<unknown>(this.authUsersUrl, { params }).pipe(
      map((response) => this.normalizeUserList(response)),
      map((users) => this.applyLocalFilters(users, filters)),
      tap((users) => this.setCachedUsers(this.mergeUsers(users, this.getCachedUsers()))),
      catchError(() => of(this.applyLocalFilters(this.getCachedUsers(), filters)))
    );
  }

  getDoctors(): Observable<User[]> {
    return this.http.get<unknown>(this.authDoctorsUrl).pipe(
      map((response) => this.normalizeUserList(response)),
      map((users) => this.filterByRole(users, 'DOCTOR')),
      map((doctors) => this.attachStableDemoSpecialty(doctors)),
      tap((users) => this.setCachedUsers(this.mergeUsers(users, this.getCachedUsers()))),
      catchError(() =>
        of(this.attachStableDemoSpecialty(this.filterByRole(this.getCachedUsers(), 'DOCTOR')))
      )
    );
  }

  searchDoctors(query: string): Observable<User[]> {
    const params = new HttpParams().set('query', query.trim()).set('search', query.trim()).set('page', '0').set('size', '20');
    return this.http.get<unknown>(this.authDoctorsUrl, { params }).pipe(
      map((response) => this.normalizeUserList(response)),
      map((users) => this.attachStableDemoSpecialty(this.filterUsersByQuery(this.filterByRole(users, 'DOCTOR'), query))),
      catchError(() => this.getDoctors().pipe(map((users) => this.filterUsersByQuery(users, query))))
    );
  }

  /**
   * Backend JPQL keyword recommendation (User + VisitNote + MedicalRecord).
   */
  recommendDoctorsByKeywords(keywords: string, limit = 15): Observable<PhysicianRecommendationApiRow[]> {
    const q = keywords.trim();
    if (!q) {
      return of([]);
    }
    const params = new HttpParams().set('keywords', q).set('limit', String(limit));
    return this.http.get<PhysicianRecommendationApiRow[]>(`${this.baseUrl}/auth/doctors/recommend`, { params }).pipe(
      catchError(() => of([]))
    );
  }

  getPatients(): Observable<User[]> {
    // Backend AuthController#getUsers is ADMIN-only; avoid 403 + useless traffic for other roles.
    if (!this.authService.hasRole('ADMIN')) {
      return of(this.applyLocalFilters(this.getCachedUsers(), { role: 'PATIENT' }));
    }
    return this.getAllUsers({ role: 'PATIENT' });
  }

  searchPatients(query: string): Observable<User[]> {
    return this.getPatients().pipe(
      map((users) => this.filterUsersByQuery(users, query))
    );
  }

  searchUsers(query: string, roles?: User['role'][]): Observable<User[]> {
    return this.getAllUsers().pipe(
      map((users) => {
        const normalizedRoles = (roles ?? []).map((role) => this.normalizeRole(role));
        const byRole = normalizedRoles.length > 0
          ? users.filter((user) => normalizedRoles.includes(this.normalizeRole(user.role)))
          : users;

        return this.filterUsersByQuery(byRole, query);
      })
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<unknown>(`${this.authUsersUrl}/${id}`).pipe(
      map((response) => {
        const users = this.normalizeUserList(response);
        if (users.length > 0) {
          return users[0];
        }

        if (response && typeof response === 'object') {
          return this.coerceUsers([response])[0];
        }

        throw new Error('User not found');
      })
    );
  }

  getUserByEmail(email: string): Observable<User> {
    return this.getAllUsers({ search: email }).pipe(
      map((users) => {
        const exact = users.find((user) => (user.email || '').toLowerCase() === email.trim().toLowerCase());
        if (exact) {
          return exact;
        }

        throw new Error('User not found');
      })
    );
  }

  createUser(user: UserRequestDTO): Observable<UserResponseDTO> {
    return this.http.post<UserResponseDTO>(this.registerUrl, user).pipe(
      tap((created) => {
        const mapped: User = {
          id: created.id,
          username: created.username,
          email: created.email,
          role: this.normalizeRole(created.role) as User['role']
        };

        const cached = this.getCachedUsers();
        const merged = this.mergeUsers([mapped], cached);
        this.setCachedUsers(merged);
      })
    );
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.authUsersUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.authUsersUrl}/${id}`);
  }

  private buildUserParams(filters?: UserFilters): HttpParams {
    let params = new HttpParams();

    if (filters?.role) {
      params = params.set('role', this.normalizeRole(filters.role));
    }

    const query = (filters?.query || filters?.search || '').trim();
    if (query.length > 0) {
      params = params.set('query', query).set('search', query);
    }

    if (filters?.page !== undefined && filters.page !== null) {
      params = params.set('page', String(filters.page));
    }

    if (filters?.size !== undefined && filters.size !== null) {
      params = params.set('size', String(filters.size));
    }

    return params;
  }

  private applyLocalFilters(users: User[], filters?: UserFilters): User[] {
    const byRole = filters?.role ? this.filterByRole(users, this.normalizeRole(filters.role)) : users;
    return filters?.search ? this.filterUsersByQuery(byRole, filters.search) : byRole;
  }

  private normalizeUserList(response: unknown): User[] {
    if (Array.isArray(response)) {
      return this.coerceUsers(response);
    }

    if (response && typeof response === 'object') {
      const source = response as Record<string, unknown>;

      if (Array.isArray(source['content'])) {
        return this.coerceUsers(source['content']);
      }

      if (Array.isArray(source['data'])) {
        return this.coerceUsers(source['data']);
      }

      if (Array.isArray(source['users'])) {
        return this.coerceUsers(source['users']);
      }
    }

    return [];
  }

  private coerceUsers(input: unknown[]): User[] {
    return input
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const raw = item as Record<string, unknown>;
        return {
          id: typeof raw['id'] === 'number' ? raw['id'] : undefined,
          username: typeof raw['username'] === 'string' ? raw['username'] : undefined,
          email: (raw['email'] as string) || '',
          role: this.normalizeRole(raw['role']) as User['role'],
          fullName: typeof raw['fullName'] === 'string' ? raw['fullName'] : undefined,
          firstName: typeof raw['firstName'] === 'string' ? raw['firstName'] : undefined,
          lastName: typeof raw['lastName'] === 'string' ? raw['lastName'] : undefined,
          phoneNumber: typeof raw['phoneNumber'] === 'string' ? raw['phoneNumber'] : undefined,
          premium: typeof raw['premium'] === 'boolean' ? raw['premium'] : undefined,
          specialtyId: this.readOptionalPositiveInt(raw, ['specialtyId', 'specialty_id', 'specialtyID']),
          clinicalDepartment:
            typeof raw['clinicalDepartment'] === 'string'
              ? raw['clinicalDepartment']
              : typeof raw['department'] === 'string'
                ? raw['department']
                : typeof raw['service'] === 'string'
                  ? raw['service']
                  : undefined
        } as User;
      })
      .filter((user) => !!user.email || !!user.id);
  }

  private setCachedUsers(users: User[]): void {
    try {
      localStorage.setItem(this.cacheStorageKey, JSON.stringify(users));
    } catch {
      // Ignore storage errors and keep app functional.
    }
  }

  private getCachedUsers(): User[] {
    try {
      const raw = localStorage.getItem(this.cacheStorageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return this.coerceUsers(parsed);
    } catch {
      return [];
    }
  }

  private mergeUsers(primary: User[], secondary: User[]): User[] {
    const merged: User[] = [];
    const seen = new Set<string>();

    const pushIfNew = (user: User) => {
      const key = user.id ? `id:${user.id}` : `email:${(user.email || '').toLowerCase()}`;
      if (!key || seen.has(key)) {
        return;
      }
      seen.add(key);
      merged.push(user);
    };

    primary.forEach(pushIfNew);
    secondary.forEach(pushIfNew);
    return merged;
  }

  private filterByRole(users: User[], role: string): User[] {
    return users.filter((user) => {
      const normalized = this.normalizeRole(user.role);
      return normalized === role && !!user.id;
    });
  }

  private filterUsersByQuery(users: User[], query: string): User[] {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const tokens = [
        user.username,
        user.email,
        user.fullName,
        user.firstName,
        user.lastName,
        user.phoneNumber,
        user.id ? String(user.id) : ''
      ]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .map((value) => value!.toLowerCase());

      return tokens.some((token) => token.includes(normalizedQuery));
    });
  }

  /**
   * When the API omits department / specialty linkage, assign a stable canonical department label
   * from the clinical catalog so recommendations match by **name** (works even if backend specialty IDs differ).
   */
  private attachStableDemoSpecialty(doctors: User[]): User[] {
    const catalog = CLINICAL_SPECIALTY_SEED;
    if (!doctors.length || catalog.length === 0) {
      return doctors;
    }
    return doctors.map((d) => {
      if (d.specialtyId != null && d.specialtyId > 0) {
        return d;
      }
      if ((d.clinicalDepartment || '').trim().length > 0) {
        return d;
      }
      const idx = Math.abs(this.stableUserHash(d)) % catalog.length;
      const label = catalog[idx]?.name ?? '';
      return label ? { ...d, clinicalDepartment: label } : d;
    });
  }

  private stableUserHash(user: User): number {
    const key = `${user.id ?? ''}|${(user.email || '').toLowerCase()}`;
    let h = 0;
    for (let i = 0; i < key.length; i++) {
      h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
    }
    return h;
  }

  private readOptionalPositiveInt(raw: Record<string, unknown>, keys: string[]): number | undefined {
    for (const key of keys) {
      const v = raw[key];
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        return Math.floor(v);
      }
      if (typeof v === 'string' && /^\d+$/.test(v.trim())) {
        const n = parseInt(v, 10);
        if (n > 0) {
          return n;
        }
      }
    }
    return undefined;
  }

  private normalizeRole(role: unknown): string {
    if (typeof role !== 'string') {
      return '';
    }

    return role
      .toUpperCase()
      .replace(/^ROLE_/, '')
      .trim();
  }
}

