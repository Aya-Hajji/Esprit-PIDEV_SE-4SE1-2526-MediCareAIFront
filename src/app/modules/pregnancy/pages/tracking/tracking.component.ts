import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PregnancyWeekViewerComponent } from '../../components/pregnancy-week-viewer/pregnancy-week-viewer.component';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { PregnancyTracking } from '../../../../shared/models/health-tracking.model';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';

type TrackingFormValue = {
  startDate: string | null;
  currentWeek: number | null;
  notes: string | null;
  dueDate: string | null;
};

@Component({
  selector: 'app-pregnancy-tracking',
  imports: [CommonModule, ReactiveFormsModule, PregnancyWeekViewerComponent],
  templateUrl: './tracking.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackingComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly healthTrackerService = inject(HealthTrackerService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly trackingEntries = signal<PregnancyTracking[]>([]);
  readonly errorMessage = signal('');
  readonly currentUserId = signal<number | null>(null);

  readonly form = this.formBuilder.group({
    startDate: ['', [Validators.required]],
    currentWeek: [1, [Validators.required, Validators.min(1), Validators.max(42)]],
    notes: ['', [Validators.maxLength(1000)]],
    dueDate: ['', [Validators.required]]
  });

  readonly hasEntries = computed(() => this.trackingEntries().length > 0);

  constructor() {
    this.bootstrapTracking();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: TrackingFormValue = this.form.getRawValue();
    const userId = this.currentUserId() ?? this.resolveUserId();
    if (!userId) {
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    if (!value.startDate || !value.currentWeek || !value.dueDate) {
      this.errorMessage.set('Please fill all required fields.');
      return;
    }

    const payload: Partial<PregnancyTracking> = {
      userId,
      startDate: value.startDate,
      currentWeek: value.currentWeek,
      notes: value.notes?.trim() || undefined,
      dueDate: value.dueDate
    };

    this.errorMessage.set('');
    this.submitting.set(true);

    this.healthTrackerService
      .addPregnancyTracking(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const today = new Date().toISOString().slice(0, 10);
          this.form.reset({
            startDate: today,
            currentWeek: 1,
            notes: '',
            dueDate: ''
          });
          this.loadEntries();
        },
        error: (error: { error?: { message?: string; error?: string; details?: string } }) => {
          const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
          this.errorMessage.set(backendMessage || 'Unable to save tracking entry. Please retry.');
        }
      });
  }

  deleteEntry(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deletePregnancyTracking(id).subscribe({
      next: () => {
        this.trackingEntries.update((entries) => entries.filter((entry) => entry.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete tracking entry. Please retry.');
      }
    });
  }

  trackByEntryId(index: number, item: PregnancyTracking): number {
    return item.id ?? index;
  }

  private loadEntries(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.healthTrackerService
      .getPregnancyTracking()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entries) => {
          this.trackingEntries.set((entries || []).map((entry) => this.normalizeTracking(entry)));
        },
        error: () => {
          this.errorMessage.set('Unable to load tracking entries. Please retry.');
        }
      });
  }

  private bootstrapTracking(): void {
    const localUserId = this.resolveUserId();
    if (localUserId) {
      this.currentUserId.set(localUserId);
      this.loadEntries();
      return;
    }

    this.authService.getCurrentUserId().subscribe({
      next: (resolvedUserId) => {
        if (resolvedUserId) {
          this.currentUserId.set(resolvedUserId);
          this.loadEntries();
          return;
        }

        this.loading.set(false);
        this.errorMessage.set('User session not detected. Please login again.');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('User session not detected. Please login again.');
      }
    });
  }

  private normalizeTracking(entry: PregnancyTracking): PregnancyTracking {
    const raw = entry as unknown as Record<string, unknown>;
    return {
      id: entry.id ?? (raw['trackingId'] as number | undefined),
      userId: Number(entry.userId ?? raw['userId'] ?? 0),
      startDate: (entry.startDate ?? raw['startDate'] ?? '').toString(),
      currentWeek: Number(entry.currentWeek ?? raw['currentWeek'] ?? 0),
      notes: (entry.notes ?? raw['notes'] ?? '').toString() || undefined,
      dueDate: (entry.dueDate ?? raw['dueDate'] ?? '').toString(),
      createdAt: (entry.createdAt ?? raw['createdAt']) as string | undefined
    };
  }

  private resolveUserId(): number | null {
    const authUserRaw = localStorage.getItem('authUser');
    if (authUserRaw) {
      try {
        const authUser = JSON.parse(authUserRaw) as { id?: number | string };
        const authUserId = Number(authUser?.id);
        if (Number.isFinite(authUserId) && authUserId > 0) {
          return authUserId;
        }
      } catch {
        // ignore invalid authUser JSON and fall back to other sources
      }
    }

    const raw = localStorage.getItem('userId');
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    const token = localStorage.getItem('authToken');
    return this.extractNumericUserIdFromToken(token);
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
      const parsed = JSON.parse(decoded) as { userId?: number | string; id?: number | string; sub?: number | string };
      const candidate = Number(parsed.userId ?? parsed.id ?? parsed.sub);

      return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
    } catch {
      return null;
    }
  }
}
