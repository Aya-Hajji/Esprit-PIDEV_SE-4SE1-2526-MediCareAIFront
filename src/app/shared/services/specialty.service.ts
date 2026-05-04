import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Specialty } from '../models/specialty.model';
import { environment } from '../../../environments/environment';
import { CLINICAL_SPECIALTY_SEED } from '../data/clinical-specialties.catalog';

@Injectable({
  providedIn: 'root'
})
export class SpecialtyService {
  private readonly localSpecialtiesKey = 'localSpecialtiesFallback';
  private apiUrl = `${environment.apiBaseUrl}/specialties`;

  constructor(private http: HttpClient) {}

  getAllSpecialties(): Observable<Specialty[]> {
    return this.http.get<Specialty[]>(this.apiUrl).pipe(
      map((list) => (Array.isArray(list) && list.length > 0 ? list : this.cloneClinicalSeed())),
      tap((specialties) => {
        if (specialties.length > 0) {
          this.setLocalSpecialties(specialties);
        }
      }),
      catchError(() => of(this.getLocalSpecialtiesWithSeedFallback()))
    );
  }

  getSpecialtyById(id: number): Observable<Specialty> {
    return this.http.get<Specialty>(`${this.apiUrl}/${id}`).pipe(
      catchError(() =>
        of(this.getLocalSpecialtiesWithSeedFallback().find((item) => item.id === id) || { id, name: '' })
      )
    );
  }

  createSpecialty(specialty: Specialty): Observable<Specialty> {
    return this.http.post<Specialty>(this.apiUrl, specialty).pipe(
      tap((created) => this.saveLocalSpecialty(created)),
      catchError(() => {
        const created = this.createLocalSpecialty(specialty);
        this.saveLocalSpecialty(created);
        return of(created);
      })
    );
  }

  updateSpecialty(id: number, specialty: Specialty): Observable<Specialty> {
    return this.http.put<Specialty>(`${this.apiUrl}/${id}`, specialty).pipe(
      tap((updated) => this.saveLocalSpecialty({ ...updated, id })),
      catchError(() => {
        const updated = this.createLocalSpecialty({ ...specialty, id });
        this.saveLocalSpecialty(updated);
        return of(updated);
      })
    );
  }

  deleteSpecialty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.setLocalSpecialties(this.getLocalSpecialties().filter((item) => item.id !== id))),
      catchError(() => {
        this.setLocalSpecialties(this.getLocalSpecialties().filter((item) => item.id !== id));
        return of(void 0);
      })
    );
  }

  private getLocalSpecialties(): Specialty[] {
    try {
      const data = localStorage.getItem(this.localSpecialtiesKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /** When offline storage is empty, persist the clinical catalog so IDs stay stable for diseases / doctors. */
  private getLocalSpecialtiesWithSeedFallback(): Specialty[] {
    const existing = this.getLocalSpecialties();
    if (existing.length > 0) {
      return existing;
    }
    const seeded = this.cloneClinicalSeed();
    this.setLocalSpecialties(seeded);
    return seeded;
  }

  private cloneClinicalSeed(): Specialty[] {
    return CLINICAL_SPECIALTY_SEED.map((row) => ({ ...row }));
  }

  private setLocalSpecialties(specialties: Specialty[]): void {
    localStorage.setItem(this.localSpecialtiesKey, JSON.stringify(specialties));
  }

  private saveLocalSpecialty(specialty: Specialty): void {
    const specialties = this.getLocalSpecialties();
    const index = specialties.findIndex((item) => item.id === specialty.id);

    if (index !== -1) {
      specialties[index] = specialty;
    } else {
      specialties.push(specialty);
    }

    this.setLocalSpecialties(specialties);
  }

  private createLocalSpecialty(specialty: Specialty): Specialty {
    const specialties = this.getLocalSpecialties();
    const nextId = specialties.length > 0 ? Math.max(...specialties.map((item) => item.id || 0)) + 1 : 1;
    return { ...specialty, id: specialty.id || nextId };
  }
}

