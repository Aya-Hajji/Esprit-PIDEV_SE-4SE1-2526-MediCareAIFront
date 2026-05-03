import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';
import { WellBeingMetric } from '../../../../shared/models/health-tracking.model';

type CreateWellBeingMetricPayload = {
  userId: number;
  startDate: string;
  endDate?: string;
  frequency: string;
  level: string;
};

@Component({
  selector: 'app-metrics',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './metrics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetricsComponent {
  private readonly authService = inject(AuthService);
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly metrics = signal<WellBeingMetric[]>([]);
  readonly errorMessage = signal('');
  readonly editingMetricId = signal<number | null>(null);
  readonly currentUserId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    start_date: ['', [Validators.required]],
    end_date: [''],
    frequency: ['', [Validators.required, Validators.minLength(2)]],
    level: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]]
  });

  readonly hasMetrics = computed(() => this.metrics().length > 0);
  readonly isEditing = computed(() => this.editingMetricId() !== null);

  constructor() {
    this.bootstrapMetrics();
  }

  refreshMetrics(): void {
    this.loadMetrics();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const userId = this.currentUserId() ?? this.resolveUserIdFromSession();
    if (!userId) {
      this.errorMessage.set('User ID introuvable dans la session. Reconnecte-toi puis reessaie.');
      return;
    }
    const payload: CreateWellBeingMetricPayload = {
      userId,
      startDate: value.start_date,
      endDate: value.end_date || undefined,
      frequency: value.frequency.trim(),
      level: value.level.trim()
    }
    const editingId = this.editingMetricId();
    this.errorMessage.set('');
    this.submitting.set(true);

    const request$ =
      editingId !== null
        ? this.healthTrackerService.updateWellBeingMetric(editingId, payload)
        : this.healthTrackerService.createWellBeingMetric(payload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.resetFormState();
          this.loadMetrics();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to save metric. Please retry.'));
        }
      });
  }

  startEditMetric(metric: WellBeingMetric): void {
    if (!metric.id) {
      return;
    }

    this.editingMetricId.set(metric.id);
    this.errorMessage.set('');
    this.form.setValue({
      start_date: this.toDateInputValue(metric.start_date),
      end_date: this.toDateInputValue(metric.end_date),
      frequency: metric.frequency,
      level: metric.level
    });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteMetric(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deleteWellBeingMetric(id).subscribe({
      next: () => {
        this.metrics.update((items) => items.filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete metric. Please retry.');
      }
    });
  }

  trackByMetricId(index: number, item: WellBeingMetric): number {
    return item.id ?? index;
  }

  private loadMetrics(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const userId = this.currentUserId() ?? this.resolveUserIdFromSession();
    if (!userId) {
      this.loading.set(false);
      this.errorMessage.set('User ID introuvable dans la session. Reconnecte-toi puis reessaie.');
      return;
    }

    this.healthTrackerService
      .getWellBeingMetrics()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.metrics.set(this.toMetricList(items));
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to load metrics. Please retry.'));
        }
      });
  }

  private bootstrapMetrics(): void {
    const localUserId = this.resolveUserIdFromSession();
    if (localUserId) {
      this.currentUserId.set(localUserId);
      this.loadMetrics();
      return;
    }

    this.authService.getCurrentUserId().subscribe({
      next: (resolvedUserId) => {
        if (resolvedUserId) {
          this.currentUserId.set(resolvedUserId);
          this.loadMetrics();
          return;
        }

        this.loading.set(false);
        this.errorMessage.set('User ID introuvable dans la session. Reconnecte-toi puis reessaie.');
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('User ID introuvable dans la session. Reconnecte-toi puis reessaie.');
      }
    });
  }

  private toMetricList(items: WellBeingMetric[]): WellBeingMetric[] {
    return items.map((item: WellBeingMetric) => {
      const source = item as unknown as Record<string, unknown>;
      const fallbackId = source['wellBeingMetricId'] as number | undefined;
      return {
        id: item.id ?? fallbackId,
        start_date: (item.start_date ?? source['startDate'] ?? source['start_date'] ?? '').toString(),
        end_date: (item.end_date ?? source['endDate'] ?? source['end_date'] ?? '').toString(),
        frequency: (item.frequency ?? '').toString(),
        level: (item.level ?? '').toString(),
        createdAt: (item.createdAt as string | undefined) ?? undefined
      };
    });
  }

  private resolveUserIdFromSession(): number | null {
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
      const parsed = JSON.parse(decoded) as {
        userId?: number | string;
        user_id?: number | string;
        uid?: number | string;
        id?: number | string;
        sub?: number | string;
      };
      const candidate = Number(parsed.userId ?? parsed.user_id ?? parsed.uid ?? parsed.id ?? parsed.sub);

      return Number.isFinite(candidate) && candidate > 0 ? candidate : null;
    } catch {
      return null;
    }
  }

  private toDateInputValue(value: string): string {
    return value ? new Date(value).toISOString().slice(0, 10) : '';
  }

  private resetFormState(): void {
    this.editingMetricId.set(null);
    this.form.reset({
      start_date: '',
      end_date: '',
      frequency: '',
      level: ''
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
    return backendMessage || fallback;
  }
}
