import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HealthTrackerService } from '../../../../../shared/services/health-tracker.service';

type ReminderFormValue = {
  medicationScheduleId: number;
  time: string;
  message: string;
};

type ReminderItem = {
  id?: number;
  medicationScheduleId: number;
  time: string;
  message: string;
  createdAt?: string;
};

type ScheduleOption = {
  id: number;
  label: string;
};

@Component({
  selector: 'app-reminder',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reminder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReminderComponent {
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly formBuilder = inject(FormBuilder);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly reminders = signal<ReminderItem[]>([]);
  readonly scheduleOptions = signal<ScheduleOption[]>([]);
  readonly errorMessage = signal('');
  readonly editingReminderId = signal<number | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    medicationScheduleId: [0, [Validators.required, Validators.min(1)]],
    time: ['', [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(500)]]
  });

  readonly hasReminders = computed(() => this.reminders().length > 0);
  readonly isEditing = computed(() => this.editingReminderId() !== null);

  constructor() {
    this.loadSchedules();
    this.loadReminders();
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: ReminderFormValue = this.form.getRawValue();
    const editingId = this.editingReminderId();

    const payload = {
      id: editingId ?? undefined,
      medicationScheduleId: value.medicationScheduleId,
      time: value.time,
      message: value.message.trim()
    };

    this.errorMessage.set('');
    this.submitting.set(true);

    const request$ =
      editingId !== null
        ? this.healthTrackerService.updateMedicationReminder(payload)
        : this.healthTrackerService.createMedicationReminder(payload);

    request$
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.resetFormState();
          this.loadReminders();
        },
        error: (error: { error?: { message?: string; error?: string; details?: string } }) => {
          const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
          this.errorMessage.set(backendMessage || 'Unable to save reminder. Please retry.');
        }
      });
  }

  startEditReminder(item: ReminderItem): void {
    if (!item.id) {
      return;
    }

    this.editingReminderId.set(item.id);
    this.errorMessage.set('');
    this.form.setValue({
      medicationScheduleId: item.medicationScheduleId,
      time: this.toTimeInputValue(item.time),
      message: item.message
    });
  }

  cancelEdit(): void {
    this.resetFormState();
  }

  deleteReminder(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deleteMedicationReminder(id).subscribe({
      next: () => {
        this.reminders.update((items) => items.filter((item) => item.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete reminder. Please retry.');
      }
    });
  }

  trackByReminderId(index: number, item: ReminderItem): number {
    return item.id ?? index;
  }

  private loadReminders(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.healthTrackerService
      .getMedicationReminders()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.reminders.set(this.toReminderList(items));
        },
        error: () => {
          this.errorMessage.set('Unable to load reminders. Please retry.');
        }
      });
  }

  private toReminderList(items: Array<{ [key: string]: unknown }>): ReminderItem[] {
    return items.map((item) => ({
      id: (item['id'] as number | undefined) ?? (item['reminderId'] as number | undefined),
      medicationScheduleId: Number(item['medicationScheduleId'] ?? item['scheduleId'] ?? 0),
      time: ((item['time'] as string | undefined) ?? (item['reminderTime'] as string | undefined) ?? '').toString(),
      message: ((item['message'] as string | undefined) ?? '').toString(),
      createdAt: item['createdAt'] as string | undefined
    }));
  }

  private loadSchedules(): void {
    this.healthTrackerService.getMedicationSchedules().subscribe({
      next: (items) => {
        const options = items
          .map((item) => {
            const scheduleId = Number(item['id'] ?? item['scheduleId'] ?? 0);
            const medicationName = ((item['medicationName'] as string | undefined) ?? (item['name'] as string | undefined) ?? '').trim();

            if (!Number.isFinite(scheduleId) || scheduleId <= 0) {
              return null;
            }

            const label = medicationName ? `${scheduleId} - ${medicationName}` : `${scheduleId}`;
            return { id: scheduleId, label } as ScheduleOption;
          })
          .filter((option): option is ScheduleOption => option !== null);

        this.scheduleOptions.set(options);

        const currentValue = this.form.controls.medicationScheduleId.value;
        const currentExists = options.some((option) => option.id === currentValue);
        if (!currentExists) {
          this.form.controls.medicationScheduleId.setValue(options[0]?.id ?? 0);
        }
      },
      error: () => {
        this.scheduleOptions.set([]);
      }
    });
  }

  private resetFormState(): void {
    this.editingReminderId.set(null);
    this.form.reset({
      medicationScheduleId: this.scheduleOptions()[0]?.id ?? 0,
      time: '',
      message: ''
    });
  }

  private toTimeInputValue(value: string): string {
    if (!value) {
      return '';
    }

    if (value.includes(':')) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
