import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';
import { Sleep } from '../../../../shared/models/health-tracking.model';

type SleepFormValue = {
  hours: number;
  quality: number;
  date: string;
};

@Component({
  selector: 'app-sleep',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sleep.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SleepComponent {
  private readonly authService = inject(AuthService);
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly sleeps = signal<Sleep[]>([]);
  readonly errorMessage = signal('');
  readonly editingSleepId = signal<number | null>(null);
  readonly currentUserId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    hours: [8, [Validators.required, Validators.min(0.5), Validators.max(24)]],
    quality: [7, [Validators.required, Validators.min(1), Validators.max(10)]],
    date: ['', [Validators.required]]
  });

  readonly hasSleeps = computed(() => this.sleeps().length > 0);
  readonly isEditing = computed(() => this.editingSleepId() !== null);

  constructor() {
    this.bootstrapSleeps();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: SleepFormValue = this.form.getRawValue();
    const editingId = this.editingSleepId();
    const requestUserId = this.currentUserId() ?? this.resolveUserId(editingId);
    if (!requestUserId) {
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    const payload: Sleep = {
      id: editingId ?? undefined,
      userId: requestUserId,
      hours: value.hours,
      quality: value.quality,
      date: value.date
    };

    this.errorMessage.set('');
    this.submitting.set(true);

    const request$ = editingId !== null ? this.healthTrackerService.updateSleep(payload) : this.healthTrackerService.logSleep(payload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.resetFormState();
          this.loadSleeps();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to save sleep entry. Please retry.'));
        }
      });
  }

  startEditSleep(entry: Sleep): void {
    if (!entry.id) {
      return;
    }

    this.editingSleepId.set(entry.id);
    this.errorMessage.set('');
    this.form.setValue({
      hours: entry.hours,
      quality: entry.quality,
      date: this.toDateInputValue(entry.date)
    });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteSleep(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deleteSleep(id).subscribe({
      next: () => {
        this.sleeps.update((items) => items.filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete sleep entry. Please retry.');
      }
    });
  }

  trackBySleepId(index: number, item: Sleep): number {
    return item.id ?? index;
  }

  private loadSleeps(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const userId = this.currentUserId() ?? this.resolveUserId();
    if (!userId) {
      this.loading.set(false);
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    this.healthTrackerService
      .getSleepHistory(userId, '30d')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.sleeps.set(this.toSleepList(items));
        },
        error: () => {
          this.errorMessage.set('Unable to load sleep entries. Please retry.');
        }
      });
  }

  private bootstrapSleeps(): void {
    const localUserId = this.resolveUserId();
    if (localUserId) {
      this.currentUserId.set(localUserId);
      this.loadSleeps();
      return;
    }

    this.authService.getCurrentUserId().subscribe({
      next: (resolvedUserId) => {
        if (resolvedUserId) {
          this.currentUserId.set(resolvedUserId);
          this.loadSleeps();
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

  private toSleepList(items: Array<{ [key: string]: unknown }>): Sleep[] {
    return items.map((item) => {
      const rawDate = ((item['date'] as string) || (item['timestamp'] as string) || new Date().toISOString()).toString();

      return {
        id: (item['id'] as number | undefined) ?? (item['sleepId'] as number | undefined),
        userId: Number(item['userId'] ?? 0),
        hours: Number(item['hours'] ?? item['duration'] ?? 0),
        quality: Number(item['quality'] ?? 0),
        date: this.toDateInputValue(rawDate),
        createdAt: item['createdAt'] as string | undefined
      };
    });
  }

  private resolveUserId(editingId?: number | null): number | null {
    if (editingId) {
      const editingEntry = this.sleeps().find((item) => item.id === editingId);
      if (editingEntry?.userId && editingEntry.userId > 0) {
        return editingEntry.userId;
      }
    }

    return this.authService.getStoredUserId();
  }

  private toDateInputValue(value: string): string {
    return value?.includes('T') ? new Date(value).toISOString().slice(0, 10) : value;
  }

  private resetFormState(): void {
    this.editingSleepId.set(null);
    this.form.reset({
      hours: 8,
      quality: 7,
      date: ''
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
    return backendMessage || fallback;
  }
}
