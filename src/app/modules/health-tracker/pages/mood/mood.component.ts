import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../../services/auth.service';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';
import { Mood } from '../../../../shared/models/health-tracking.model';

type MoodFormValue = {
  level: number;
  note: string;
  date: string;
};

@Component({
  selector: 'app-mood',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mood.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoodComponent {
  private readonly authService = inject(AuthService);
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly moods = signal<Mood[]>([]);
  readonly errorMessage = signal('');
  readonly editingMoodId = signal<number | null>(null);
  readonly currentUserId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    level: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    note: [''],
    date: ['', [Validators.required]]
  });

  readonly hasMoods = computed(() => this.moods().length > 0);
  readonly isEditing = computed(() => this.editingMoodId() !== null);

  constructor() {
    this.bootstrapMoods();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: MoodFormValue = this.form.getRawValue();
    const editingId = this.editingMoodId();
    const requestUserId = this.currentUserId() ?? this.resolveUserIdFromSession(editingId);
    if (!requestUserId) {
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }
    const moodPayload: Mood = {
      userId: requestUserId,
      id: editingId ?? undefined,
      level: value.level,
      note: value.note?.trim() || undefined,
      date: value.date
    };

    this.errorMessage.set('');
    this.submitting.set(true);

    const request$ = editingId !== null ? this.healthTrackerService.updateMood(moodPayload) : this.healthTrackerService.logMood(moodPayload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.resetFormState();
          this.loadMoods();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(error, 'Unable to save mood entry. Please retry.'));
        }
      });
  }

  startEditMood(entry: Mood): void {
    if (!entry.id) {
      return;
    }

    this.editingMoodId.set(entry.id);
    this.errorMessage.set('');
    this.form.setValue({
      level: entry.level,
      note: entry.note ?? '',
      date: this.toDateInputValue(entry.date)
    });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteMood(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deleteMood(id).subscribe({
      next: () => {
        this.moods.update((items) => items.filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete mood entry. Please retry.');
      }
    });
  }

  trackByMoodId(index: number, item: Mood): number {
    return item.id ?? index;
  }

  private loadMoods(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    const userId = this.currentUserId() ?? this.resolveUserIdFromSession();
    if (!userId) {
      this.loading.set(false);
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    this.healthTrackerService
      .getMoodHistory(userId, '30d')
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.moods.set(this.toMoodList(items));
        },
        error: () => {
          this.errorMessage.set('Unable to load mood entries. Please retry.');
        }
      });
  }

  private bootstrapMoods(): void {
    const localUserId = this.resolveUserIdFromSession();
    if (localUserId) {
      this.currentUserId.set(localUserId);
      this.loadMoods();
      return;
    }

    this.authService.getCurrentUserId().subscribe({
      next: (resolvedUserId) => {
        if (resolvedUserId) {
          this.currentUserId.set(resolvedUserId);
          this.loadMoods();
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

  private toMoodList(items: Array<{ [key: string]: unknown }>): Mood[] {
    return items.map((item) => {
      const rawDate = (item['date'] as string) || (item['timestamp'] as string) || new Date().toISOString().slice(0, 10);
      const rawNote = (item['note'] as string | undefined) ?? (item['notes'] as string | undefined);
      const fallbackId = item['moodId'] as number | undefined;

      return {
        id: (item['id'] as number | undefined) ?? fallbackId,
        userId: Number(item['userId'] ?? 0),
        level: Number(item['level'] ?? item['intensity'] ?? 5),
        note: rawNote,
        date: rawDate
      };
    });
  }

  private resolveUserIdFromSession(editingId?: number | null): number | null {
    if (editingId) {
      const editingEntry = this.moods().find((item) => item.id === editingId);
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

  private toDateInputValue(value: string): string {
    return value?.includes('T') ? new Date(value).toISOString().slice(0, 10) : value;
  }

  private resetFormState(): void {
    this.editingMoodId.set(null);
    this.form.reset({
      level: 5,
      note: '',
      date: ''
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
    return backendMessage || fallback;
  }
}
