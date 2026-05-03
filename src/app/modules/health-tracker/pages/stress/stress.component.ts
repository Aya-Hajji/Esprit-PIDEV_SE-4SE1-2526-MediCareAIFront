import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';
import { Stress } from '../../../../shared/models/health-tracking.model';

type StressFormValue = {
  level: number;
  note: string;
  date: string;
};

@Component({
  selector: 'app-stress',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stress.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StressComponent {
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly stresses = signal<Stress[]>([]);
  readonly errorMessage = signal('');
  readonly editingStressId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    level: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    note: [''],
    date: ['', [Validators.required]]
  });

  readonly hasStressEntries = computed(() => this.stresses().length > 0);
  readonly isEditing = computed(() => this.editingStressId() !== null);

  constructor() {
    this.form.patchValue({ date: this.toBackendDate(new Date()) });
    this.loadStressEntries();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: StressFormValue = this.form.getRawValue();
    const editingId = this.editingStressId();
    const requestUserId = this.resolveUserId(editingId);
    if (!requestUserId) {
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    const trimmedNote = value.note.trim();
    const payload: {
      id?: number;
      userId: number;
      level: number;
      date: string;
      message?: string;
    } = {
      userId: requestUserId,
      level: value.level,
      date: value.date
    };

    if (trimmedNote) {
      payload.message = trimmedNote;
    }
    if (editingId !== null) {
      payload.id = editingId;
    }

    this.errorMessage.set('');
    this.submitting.set(true);

    const request$ = editingId !== null ? this.healthTrackerService.updateStress(payload) : this.healthTrackerService.logStress(payload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.resetFormState();
          this.loadStressEntries();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to save stress entry. Please retry.'));
        }
      });
  }

  startEditStress(entry: Stress): void {
    if (!entry.id) {
      return;
    }

    this.editingStressId.set(entry.id);
    this.errorMessage.set('');
    this.form.setValue({
      level: entry.level,
      note: entry.notes ?? '',
      date: this.toDateInputValue(entry.timestamp)
    });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteStress(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deleteStress(id).subscribe({
      next: () => {
        this.stresses.update((items) => items.filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete stress entry. Please retry.');
      }
    });
  }

  trackByStressId(index: number, item: Stress): number {
    return item.id ?? index;
  }

  private loadStressEntries(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const userId = this.resolveUserId();
    if (!userId) {
      this.loading.set(false);
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    this.healthTrackerService
      .getStressHistory(userId, '30d')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.stresses.set(this.toStressList(items));
        },
        error: () => {
          this.errorMessage.set('Unable to load stress entries. Please retry.');
        }
      });
  }

  private toStressList(items: Array<{ [key: string]: unknown }>): Stress[] {
    return items.map((item) => ({
      id: (item['id'] as number | undefined) ?? (item['stressId'] as number | undefined),
      userId: Number(item['userId'] ?? 0),
      level: Number(item['level'] ?? 0),
      trigger: (item['trigger'] as string | undefined) ?? undefined,
      notes: (item['notes'] as string | undefined) ?? (item['note'] as string | undefined) ?? undefined,
      timestamp: ((item['timestamp'] as string | undefined) ?? (item['date'] as string | undefined) ?? new Date().toISOString()).toString(),
      createdAt: item['createdAt'] as string | undefined
    }));
  }

  private resolveUserId(editingId?: number | null): number | null {
    if (editingId) {
      const editingEntry = this.stresses().find((item) => item.id === editingId);
      if (editingEntry?.userId && editingEntry.userId > 0) {
        return editingEntry.userId;
      }
    }

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
    const tokenUserId = this.extractNumericUserIdFromToken(token);
    return tokenUserId;
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

  private toBackendDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateInputValue(value: string): string {
    if (!value?.trim()) {
      return this.toBackendDate(new Date());
    }
    return value.includes('T') ? new Date(value).toISOString().slice(0, 10) : value.slice(0, 10);
  }

  private resetFormState(): void {
    this.editingStressId.set(null);
    this.form.reset({
      level: 5,
      note: '',
      date: this.toBackendDate(new Date())
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
    return backendMessage || fallback;
  }
}
