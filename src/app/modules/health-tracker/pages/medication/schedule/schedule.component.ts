import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HealthTrackerService } from '../../../../../shared/services/health-tracker.service';

type ScheduleFormValue = {
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  recordDate: string;
};

type ScheduleItem = {
  id?: number;
  medicineName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  recordDate: string;
  createdAt?: string;
};

@Component({
  selector: 'app-schedule',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './schedule.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScheduleComponent {
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly schedules = signal<ScheduleItem[]>([]);
  readonly errorMessage = signal('');
  readonly editingScheduleId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    medicineName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    dosage: ['', [Validators.required, Validators.minLength(1)]],
    frequency: ['daily', [Validators.required, Validators.maxLength(100)]],
    startDate: ['', [Validators.required]],
    endDate: [''],
    recordDate: ['', [Validators.required]]
  });

  readonly hasSchedules = computed(() => this.schedules().length > 0);
  readonly isEditing = computed(() => this.editingScheduleId() !== null);

  isScheduleActive(item: ScheduleItem): boolean {
    if (!item.endDate) return true;
    return new Date(item.endDate) >= new Date();
  }

  constructor() {
    this.loadSchedules();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: ScheduleFormValue = this.form.getRawValue();
    const editingId = this.editingScheduleId();
    const userId = this.resolveUserId();

    if (!userId) {
      this.errorMessage.set('User session not detected. Please login again.');
      return;
    }

    const payload = {
      id: editingId ?? undefined,
      medicineName: value.medicineName.trim(),
      dosage: value.dosage.trim(),
      frequency: value.frequency.trim(),
      startDate: value.startDate,
      endDate: value.endDate || undefined,
      recordDate: value.recordDate,
      userId
    };

    this.errorMessage.set('');
    this.submitting.set(true);

    const request$ =
      editingId !== null
        ? this.healthTrackerService.updateMedicationSchedule(payload)
        : this.healthTrackerService.createMedicationSchedule(payload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.resetFormState();
          this.loadSchedules();
        },
        error: (error: { error?: { message?: string; error?: string; details?: string } }) => {
          const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
          this.errorMessage.set(backendMessage || 'Unable to save schedule. Please retry.');
        }
      });
  }

  startEditSchedule(item: ScheduleItem): void {
    if (!item.id) {
      return;
    }

    this.editingScheduleId.set(item.id);
    this.errorMessage.set('');
    this.form.setValue({
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      startDate: this.toDateInputValue(item.startDate),
      endDate: item.endDate ? this.toDateInputValue(item.endDate) : '',
      recordDate: this.toDateInputValue(item.recordDate)
    });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteSchedule(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deleteMedicationSchedule(id).subscribe({
      next: () => {
        this.schedules.update((items) => items.filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete schedule. Please retry.');
      }
    });
  }

  trackByScheduleId(index: number, item: ScheduleItem): number {
    return item.id ?? index;
  }

  private loadSchedules(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.healthTrackerService
      .getMedicationSchedules()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.schedules.set(this.toScheduleList(items));
        },
        error: () => {
          this.errorMessage.set('Unable to load schedules. Please retry.');
        }
      });
  }

  private toScheduleList(items: Array<{ [key: string]: unknown }>): ScheduleItem[] {
    return items.map((item) => ({
      id: (item['id'] as number | undefined) ?? (item['scheduleId'] as number | undefined),
      medicineName: ((item['medicineName'] as string | undefined) ?? (item['medicationName'] as string | undefined) ?? (item['name'] as string | undefined) ?? '').toString(),
      dosage: ((item['dosage'] as string | undefined) ?? '').toString(),
      frequency: ((item['frequency'] as string | undefined) ?? '').toString(),
      startDate: ((item['startDate'] as string | undefined) ?? (item['date'] as string | undefined) ?? '').toString(),
      endDate: ((item['endDate'] as string | undefined) ?? '').toString() || undefined,
      recordDate: ((item['recordDate'] as string | undefined) ?? (item['startDate'] as string | undefined) ?? '').toString(),
      createdAt: item['createdAt'] as string | undefined
    }));
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

  private toDateInputValue(value: string): string {
    return new Date(value).toISOString().slice(0, 10);
  }

  private resetFormState(): void {
    this.editingScheduleId.set(null);
    const today = new Date().toISOString().slice(0, 10);
    this.form.reset({
      medicineName: '',
      dosage: '',
      frequency: 'daily',
      startDate: '',
      endDate: '',
      recordDate: today
    });
  }
}
