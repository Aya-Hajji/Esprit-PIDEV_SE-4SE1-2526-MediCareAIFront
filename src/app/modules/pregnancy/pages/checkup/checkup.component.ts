import { ChangeDetectionStrategy, Component, computed, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { PregnancyCheckup, PregnancyTracking } from '../../../../shared/models/health-tracking.model';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';
import { AuthService } from '../../../../services/auth.service';
import { PregnancyAlertsComponent } from '../../../../shared/components/pregnancy-alerts/pregnancy-alerts.component';
import { PregnancyWeekViewerComponent } from '../../components/pregnancy-week-viewer/pregnancy-week-viewer.component';

type CheckupFormValue = {
  date: string | null;
  observation: string | null;
  weightKg: number | null;
  symptoms: string | null;
  fetalMovements: number | null;
  pregnancyTrackingId: number | null;
};

type TrackingOption = {
  id: number;
  label: string;
};

@Component({
  selector: 'app-pregnancy-checkup',
  imports: [CommonModule, ReactiveFormsModule, PregnancyAlertsComponent, PregnancyWeekViewerComponent],
  templateUrl: './checkup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckupComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly healthTrackerService = inject(HealthTrackerService);
  private readonly authService = inject(AuthService);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly checkups = signal<PregnancyCheckup[]>([]);
  readonly trackingOptions = signal<TrackingOption[]>([]);
  readonly errorMessage = signal('');
  readonly currentUserId = signal<number | null>(null);
  readonly selectedTrackingId = signal<number | null>(null);
  readonly showAnomalyAnalysis = signal(false);

  readonly form = this.formBuilder.group({
    date: ['', [Validators.required]],
    observation: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(1000)]],
    weightKg: [null as number | null, [Validators.min(30), Validators.max(300)]],
    symptoms: ['', [Validators.maxLength(500)]],
    fetalMovements: [null as number | null, [Validators.min(0), Validators.max(200)]],
    pregnancyTrackingId: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  readonly hasCheckups = computed(() => this.checkups().length > 0);

  constructor() {
    this.bootstrapComponent();
  }

  private bootstrapComponent(): void {
    const localUserId = this.resolveUserId();
    if (localUserId) {
      this.currentUserId.set(localUserId);
      this.loadTrackingOptions();
      this.loadCheckups();
      return;
    }

    this.authService.getCurrentUserId().subscribe({
      next: (resolvedUserId) => {
        if (resolvedUserId) {
          this.currentUserId.set(resolvedUserId);
          this.loadTrackingOptions();
          this.loadCheckups();
        }
      },
      error: () => {
        // Continue without userId
        this.loadTrackingOptions();
        this.loadCheckups();
      }
    });
  }

  private resolveUserId(): number | null {
    const stored = localStorage.getItem('userId');
    if (stored) {
      const parsed = Number(stored);
      return parsed > 0 ? parsed : null;
    }
    return null;
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value: CheckupFormValue = this.form.getRawValue();
    if (!value.date || !value.observation || !value.pregnancyTrackingId) {
      this.errorMessage.set('Please fill required fields.');
      return;
    }

    const payload: Partial<PregnancyCheckup> = {
      date: value.date,
      observation: value.observation.trim(),
      weightKg: value.weightKg ?? undefined,
      symptoms: value.symptoms?.trim() || undefined,
      fetalMovements: value.fetalMovements ?? undefined,
      pregnancyTrackingId: value.pregnancyTrackingId
    };

    this.errorMessage.set('');
    this.submitting.set(true);

    this.healthTrackerService
      .addPregnancyCheckup(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const defaultTrackingId = this.trackingOptions()[0]?.id ?? null;
          this.form.reset({
            date: '',
            observation: '',
            weightKg: null,
            symptoms: '',
            fetalMovements: null,
            pregnancyTrackingId: defaultTrackingId
          });

          // Track the current pregnancy tracking ID for anomaly analysis
          const currentTrackingId = value.pregnancyTrackingId;
          if (currentTrackingId) {
            this.selectedTrackingId.set(currentTrackingId);
            this.showAnomalyAnalysis.set(true);
          }

          this.loadCheckups();
        },
        error: (error: { error?: { message?: string; error?: string; details?: string } }) => {
          const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
          this.errorMessage.set(backendMessage || 'Unable to save checkup. Please retry.');
        }
      });
  }

  deleteCheckup(id?: number): void {
    if (!id) {
      return;
    }

    this.errorMessage.set('');
    this.healthTrackerService.deletePregnancyCheckup(id).subscribe({
      next: () => {
        this.checkups.update((entries) => entries.filter((entry) => entry.id !== id));
      },
      error: () => {
        this.errorMessage.set('Unable to delete checkup. Please retry.');
      }
    });
  }

  trackByCheckupId(index: number, item: PregnancyCheckup): number {
    return item.id ?? index;
  }

  private loadCheckups(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.healthTrackerService
      .getPregnancyCheckups()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (entries) => {
          this.checkups.set((entries || []).map((entry) => this.normalizeCheckup(entry)));
        },
        error: () => {
          this.errorMessage.set('Unable to load checkups. Please retry.');
        }
      });
  }

  private loadTrackingOptions(): void {
    this.healthTrackerService.getPregnancyTracking().subscribe({
      next: (entries: PregnancyTracking[]) => {
        const options = (entries || [])
          .map((entry) => {
            if (!entry.id) {
              return null;
            }

            const week = Number(entry.currentWeek || 0);
            const label = week > 0 ? `${entry.id} - Week ${week}` : `${entry.id}`;
            return { id: entry.id, label } as TrackingOption;
          })
          .filter((item): item is TrackingOption => item !== null);

        this.trackingOptions.set(options);

        const current = this.form.controls.pregnancyTrackingId.value;
        if ((!current || current <= 0) && options.length > 0) {
          this.form.controls.pregnancyTrackingId.setValue(options[0].id);
        }
      },
      error: () => {
        this.trackingOptions.set([]);
      }
    });
  }

  private normalizeCheckup(entry: PregnancyCheckup): PregnancyCheckup {
    const raw = entry as unknown as Record<string, unknown>;

    return {
      id: entry.id ?? (raw['checkupId'] as number | undefined),
      date: (entry.date ?? raw['date'] ?? raw['checkupDate'] ?? '').toString(),
      observation: (entry.observation ?? raw['observation'] ?? raw['notes'] ?? '').toString(),
      weightKg: Number(entry.weightKg ?? raw['weightKg'] ?? raw['weight'] ?? 0) || undefined,
      symptoms: (entry.symptoms ?? raw['symptoms'] ?? '').toString() || undefined,
      fetalMovements: Number(entry.fetalMovements ?? raw['fetalMovements'] ?? 0) || undefined,
      pregnancyTrackingId: Number(entry.pregnancyTrackingId ?? raw['pregnancyTrackingId'] ?? raw['trackingId'] ?? 0),
      createdAt: (entry.createdAt ?? raw['createdAt']) as string | undefined
    };
  }
}
