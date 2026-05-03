import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { User, UserRequestDTO, UserResponseDTO } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/auth`;

  constructor(private http: HttpClient) {}

  
  getAllUsers(): Observable<User[]> {
    return this.http.get(`${this.apiUrl}/users`, { responseType: 'text' }).pipe(
      map((raw) => this.normalizeUsersResponse(raw))
    );
  }

  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }
  getUserByEmail(email: string): Observable<User> {
    const encoded = encodeURIComponent(email);

    // Correct endpoint from backend controller - expect text response for parsing flexibility
    return this.http.get(`${this.apiUrl}/users/email/${encoded}`, { responseType: 'text' }).pipe(
      map((raw) => {
        const parsed = this.tryParseJson(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as User;
        }
        throw new Error(`Invalid user response: ${JSON.stringify(parsed)}`);
      }),
      catchError((err) => throwError(() => err))
    );
  }

  createUser(user: UserRequestDTO): Observable<UserResponseDTO> {
    return this.http.post<UserResponseDTO>(this.apiUrl, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private normalizeUsersResponse(raw: string): User[] {
    const parsed = this.tryParseJson(raw);

    if (Array.isArray(parsed)) {
      return this.extractUsersFromUnknown(parsed);
    }

    if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const candidates = [
        obj['users'],
        obj['data'],
        obj['content'],
        obj['items'],
        obj['result'],
        obj['results'],
        obj['payload'],
        obj['records']
      ];
      const arr = candidates.find((value) => Array.isArray(value));
      if (Array.isArray(arr)) {
        return this.extractUsersFromUnknown(arr);
      }

      // Some backends return a single user object instead of a list.
      if ('id' in obj || 'email' in obj || 'user' in obj) {
        return [obj as unknown as User];
      }

      return this.extractUsersFromUnknown(obj);
    }

    return [];
  }

  private extractUsersFromUnknown(input: unknown): User[] {
    const result: User[] = [];
    const seen = new Set<unknown>();

    const visit = (value: unknown): void => {
      if (!value || seen.has(value)) {
        return;
      }

      if (typeof value !== 'object') {
        return;
      }

      seen.add(value);

      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }

      const obj = value as Record<string, unknown>;

      // A user-like object usually has at least an id or identity-ish field.
      const hasUserShape = (
        'id' in obj
        || 'userId' in obj
        || 'uid' in obj
        || 'email' in obj
        || 'username' in obj
        || 'userName' in obj
      );

      if (hasUserShape) {
        result.push(obj as unknown as User);
      }

      Object.values(obj).forEach(visit);
    };

    visit(input);

    const uniqueByIdentity = new Map<string, User>();
    for (const user of result) {
      const key = [
        (user as any)?.id,
        (user as any)?.userId,
        (user as any)?.uid,
        (user as any)?.email,
        (user as any)?.username,
        (user as any)?.userName
      ].map((v) => (v ?? '').toString().trim()).join('|');

      if (!uniqueByIdentity.has(key)) {
        uniqueByIdentity.set(key, user);
      }
    }

    return Array.from(uniqueByIdentity.values());
  }

  private tryParseJson(value: string): unknown {
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
}
