import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PregnancyService, PregnancyWeek } from '../../../../shared/services/pregnancy.service';
import { HealthTrackerService } from '../../../../shared/services/health-tracker.service';

@Component({
  selector: 'app-pregnancy-week-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pregnancy-week-viewer.component.html',
  styleUrls: ['./pregnancy-week-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PregnancyWeekViewerComponent {
  private readonly service = inject(PregnancyService);
  private readonly healthTracker = inject(HealthTrackerService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly weeks = signal<Record<string, PregnancyWeek> | null>(null);
  readonly currentWeek = signal(1);
  readonly selectedWeek = signal(1);

  constructor() {
    this.bootstrap();
  }

  private bootstrap(): void {
    this.loading.set(true);
    this.error.set('');

    this.service.getLocalWeeksData().subscribe({
      next: (data) => {
        this.weeks.set(data || null);

        // Try to prefer a user-created PregnancyTracking entry (most recent)
        this.healthTracker.getPregnancyTracking().subscribe({
          next: (entries) => {
            const list = entries || [];
            if (list.length > 0) {
              const sorted = list.slice().sort((a, b) => {
                const ta = a.createdAt ? Date.parse(String(a.createdAt)) : 0;
                const tb = b.createdAt ? Date.parse(String(b.createdAt)) : 0;
                if (ta || tb) return tb - ta;
                return (b.id ?? 0) - (a.id ?? 0);
              });
              const recent = sorted[0];
              const weekFromTracking = Number(recent.currentWeek ?? 0) || 1;
              const clamped = Math.max(1, Math.min(40, weekFromTracking));
              this.currentWeek.set(clamped);
              this.selectedWeek.set(clamped);
              this.loading.set(false);
              return;
            }

            // No tracking entries — fallback to backend endpoint
            this.service.getCurrentWeek().subscribe({
              next: (wk) => {
                const clamped = Math.max(1, Math.min(40, wk ?? 1));
                this.currentWeek.set(clamped);
                this.selectedWeek.set(clamped);
                this.loading.set(false);
              },
              error: () => {
                this.currentWeek.set(1);
                this.selectedWeek.set(1);
                this.loading.set(false);
              }
            });
          },
          error: () => {
            // Tracking call failed — use backend
            this.service.getCurrentWeek().subscribe({
              next: (wk) => {
                const clamped = Math.max(1, Math.min(40, wk ?? 1));
                this.currentWeek.set(clamped);
                this.selectedWeek.set(clamped);
                this.loading.set(false);
              },
              error: () => {
                this.currentWeek.set(1);
                this.selectedWeek.set(1);
                this.loading.set(false);
              }
            });
          }
        });
      },
      error: () => {
        this.error.set('Unable to load pregnancy data.');
        this.loading.set(false);
      }
    });
  }

  showPrev(): void {
    const next = Math.max(1, this.selectedWeek() - 1);
    this.selectedWeek.set(next);
  }

  showNext(): void {
    const next = Math.min(40, this.selectedWeek() + 1);
    this.selectedWeek.set(next);
  }

  selectWeek(n: number): void {
    const val = Math.max(1, Math.min(40, n));
    this.selectedWeek.set(val);
  }

  pct(): number {
    return Math.round((this.selectedWeek() / 40) * 100);
  }

  selectedWeekData(): PregnancyWeek | null {
    const w = this.weeks();
    if (!w) return null;
    return (w[String(this.selectedWeek())] as PregnancyWeek) ?? null;
  }
}
