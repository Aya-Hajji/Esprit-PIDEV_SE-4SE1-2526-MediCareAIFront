import { Injectable } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Specialty } from '../models/specialty.model';
import { UserService } from './user.service';
import { SpecialtyService } from './specialty.service';
import {
  clinicalProfileBlob,
  clinicalTokensFromSpecialty,
  countTokenHitsInBlob
} from '../utils/specialty-match.utils';

export interface DoctorRecommendation {
  doctor: User;
  specialty: Specialty;
  matchScore: number; // 0-100
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorRecommendationService {
  /** Below this score, a doctor is not shown for the selected specialty. */
  private readonly minMatchScore = 56;

  constructor(
    private userService: UserService,
    private specialtyService: SpecialtyService
  ) {}

  recommendDoctorsBySpecialty(specialtyId: number, limit: number = 5): Observable<DoctorRecommendation[]> {
    return combineLatest([
      this.userService.getDoctors(),
      this.specialtyService.getAllSpecialties()
    ]).pipe(
      map(([doctors, specialties]) => {
        const targetSpecialty = specialties.find((s) => s.id === specialtyId);
        if (!targetSpecialty) {
          console.warn(`Specialty with ID ${specialtyId} not found`);
          return [];
        }

        const recommendations = doctors
          .map((doctor) => {
            const { score, signals } = this.scoreDoctorForSpecialty(doctor, targetSpecialty);
            return {
              doctor,
              specialty: targetSpecialty,
              matchScore: score,
              reason: this.buildRecommendationReason(doctor, targetSpecialty, score, signals)
            };
          })
          .filter((rec) => rec.matchScore >= this.minMatchScore)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, limit);

        return recommendations;
      }),
      catchError((error) => {
        console.error('Error recommending doctors:', error);
        return of([]);
      })
    );
  }

  /**
   * Spring Boot keyword recommendation across doctor profile, visit notes, and medical record text.
   * Keeps the same {@link DoctorRecommendation} shape so UI / future ML can consume one pipeline.
   */
  recommendDoctorsByBackendKeywords(rawKeywords: string, limit: number = 15): Observable<DoctorRecommendation[]> {
    return this.userService.recommendDoctorsByKeywords(rawKeywords, limit).pipe(
      map((rows) =>
        rows.map((r) => ({
          doctor: {
            id: r.doctorId,
            email: r.email,
            fullName: r.fullName,
            role: 'DOCTOR',
            clinicalDepartment: r.clinicalDepartment
          } as User,
          specialty: { id: 0, name: 'Keyword match (API)', matchTags: rawKeywords } as Specialty,
          matchScore: r.matchScore,
          reason: r.matchedSignals || 'Backend keyword ranking'
        }))
      ),
      catchError(() => of([]))
    );
  }

  recommendDoctorsBySpecialtyName(specialtyName: string, limit: number = 5): Observable<DoctorRecommendation[]> {
    const q = specialtyName.trim().toLowerCase();
    if (!q) {
      return of([]);
    }
    return this.specialtyService.getAllSpecialties().pipe(
      switchMap((specialties) => {
        const specialty = this.resolveSpecialtyByName(specialties, q);
        if (!specialty?.id) {
          return of([]);
        }
        return this.recommendDoctorsBySpecialty(specialty.id, limit);
      }),
      catchError((error) => {
        console.error('Error recommending doctors by specialty name:', error);
        return of([]);
      })
    );
  }

  private resolveSpecialtyByName(specialties: Specialty[], q: string): Specialty | undefined {
    const exact = specialties.find((s) => s.name.toLowerCase().trim() === q);
    if (exact) {
      return exact;
    }
    const starts = specialties.find((s) => s.name.toLowerCase().startsWith(q));
    if (starts) {
      return starts;
    }
    const includes = specialties.find((s) => s.name.toLowerCase().includes(q) || q.includes(s.name.toLowerCase()));
    if (includes) {
      return includes;
    }
    return specialties.find((s) => {
      const tokens = clinicalTokensFromSpecialty(s);
      return tokens.some((t) => t.includes(q) || q.includes(t));
    });
  }

  private scoreDoctorForSpecialty(doctor: User, specialty: Specialty): { score: number; signals: string[] } {
    const signals: string[] = [];
    const specId = specialty.id;
    const docSpec = doctor.specialtyId;

    if (specId != null && docSpec != null && docSpec > 0 && specId === docSpec) {
      signals.push('Registered specialty matches selection');
      return { score: 99, signals };
    }

    const blob = clinicalProfileBlob(doctor);
    const tokens = clinicalTokensFromSpecialty(specialty);
    const hits = countTokenHitsInBlob(tokens, blob);
    if (hits > 0) {
      signals.push(`Clinical keyword overlap (${hits})`);
    }

    let score = 46;
    score += Math.min(30, hits * 10);

    const specName = specialty.name.toLowerCase();
    const dept = (doctor.clinicalDepartment || '').toLowerCase();
    let deptAligned = false;
    if (dept) {
      if (dept.includes(specName) || specName.split(/\s+/).some((w) => w.length > 3 && dept.includes(w))) {
        deptAligned = true;
        score += 18;
        signals.push('Department label aligns with specialty');
      } else if (tokens.some((t) => t.length > 3 && dept.includes(t))) {
        deptAligned = true;
        score += 14;
        signals.push('Department mentions related clinical terms');
      }
    }

    const namesSpecialtyInProfile = blob.includes(specName);
    if (namesSpecialtyInProfile) {
      score += 12;
      signals.push('Profile text names the specialty');
    }

    if (doctor.email?.includes('@')) {
      score += 4;
    }
    if (doctor.premium) {
      score += 6;
      signals.push('Premium network');
    }

    const hasSoftClinical = hits > 0 || deptAligned || namesSpecialtyInProfile;
    if (!hasSoftClinical) {
      score = Math.min(score, 52);
    }

    return { score: Math.min(100, Math.round(score)), signals };
  }

  private buildRecommendationReason(
    doctor: User,
    specialty: Specialty,
    matchScore: number,
    signals: string[]
  ): string {
    const tier =
      matchScore >= 95 ? `Strong fit for ${specialty.name}` : matchScore >= 80 ? `Good fit for ${specialty.name}` : `Possible fit for ${specialty.name}`;

    const doctorName = (doctor.fullName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()).trim();
    const parts = [tier, ...signals];
    if (doctorName) {
      parts.push(`Dr. ${doctorName}`);
    }
    return parts.join(' • ');
  }

  getPerformanceScore(doctor: User): number {
    let score = 70;
    if (doctor.premium) {
      score += 15;
    }
    return Math.min(score, 100);
  }
}
