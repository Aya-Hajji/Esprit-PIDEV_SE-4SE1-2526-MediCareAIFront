import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import { finalize } from 'rxjs/operators';
import { Mood, Sleep, Stress } from '../../../../shared/models/health-tracking.model';
import { Correlation } from '../../models/correlation.model';
import { CorrelationService } from '../../services/correlation.service';

@Component({
  selector: 'app-health-correlations',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './health-correlations.component.html',
  styleUrl: './health-correlations.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HealthCorrelationsComponent {
  readonly userId = input<number | null>(null);
  /** When the API returns no joined rows, we merge these logs by calendar date (same rule as the server). */
  readonly moods = input<Mood[]>([]);
  readonly sleeps = input<Sleep[]>([]);
  readonly stresses = input<Stress[]>([]);

  private readonly correlationService = inject(CorrelationService);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  private readonly apiCorrelations = signal<Correlation[]>([]);

  readonly correlations = computed<Correlation[]>(() => {
    const fromApi = this.apiCorrelations();
    if (fromApi.length > 0) {
      return fromApi;
    }
    return this.mergeAlignedLogs(this.moods(), this.sleeps(), this.stresses());
  });

  readonly hasData = computed(() => this.sortedCorrelations().length > 0);

  readonly sortedCorrelations = computed(() => [...this.correlations()].sort((left, right) => left.date.localeCompare(right.date)));

  readonly averageSleepHours = computed(() => this.averageOf('sleepHours'));
  readonly averageMoodLevel = computed(() => this.averageOf('moodLevel'));
  readonly averageStressLevel = computed(() => this.averageOf('stressLevel'));

  readonly sleepMoodCorrelation = computed(() => this.pearsonCorrelation('sleepHours', 'moodLevel'));
  readonly sleepStressCorrelation = computed(() => this.pearsonCorrelation('sleepHours', 'stressLevel'));
  readonly moodStressCorrelation = computed(() => this.pearsonCorrelation('moodLevel', 'stressLevel'));

  readonly chartData = computed<ChartData<'line', number[], string>>(() => {
    const items = this.sortedCorrelations();

    return {
      labels: items.map((item) => this.formatDateLabel(item.date)),
      datasets: [
        {
          label: 'Sleep',
          data: items.map((item) => item.sleepHours),
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.16)',
          pointBackgroundColor: '#bbf7d0',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.38,
          fill: false
        },
        {
          label: 'Mood',
          data: items.map((item) => item.moodLevel),
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96, 165, 250, 0.16)',
          pointBackgroundColor: '#dbeafe',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.38,
          fill: false
        },
        {
          label: 'Stress',
          data: items.map((item) => item.stressLevel),
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.16)',
          pointBackgroundColor: '#fed7aa',
          pointBorderColor: '#ffffff',
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 3,
          tension: 0.38,
          fill: false
        }
      ]
    };
  });

  readonly chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#dcfce7',
          boxWidth: 14,
          boxHeight: 14,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const suffix = context.dataset.label === 'Sleep' ? 'h' : '/10';
            return `${context.dataset.label}: ${context.parsed.y}${suffix}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#dcfce7'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        }
      },
      y: {
        beginAtZero: true,
        min: 0,
        suggestedMax: this.axisCeiling(),
        ticks: {
          color: '#dcfce7',
          stepSize: 2
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)'
        }
      }
    }
  }));

  readonly insightMessages = computed(() => this.buildInsights());

  constructor() {
    effect(() => {
      const userId = this.userId();
      if (!userId) {
        this.apiCorrelations.set([]);
        this.errorMessage.set('');
        return;
      }

      this.loadCorrelations(userId);
    });
  }

  private loadCorrelations(userId: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.correlationService
      .getCorrelations(userId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => {
          this.apiCorrelations.set(items);
        },
        error: () => {
          this.apiCorrelations.set([]);
          const fallback = this.mergeAlignedLogs(this.moods(), this.sleeps(), this.stresses());
          this.errorMessage.set(fallback.length > 0 ? '' : 'Unable to load personalized correlations right now.');
        }
      });
  }

  private mergeAlignedLogs(moods: Mood[], sleeps: Sleep[], stresses: Stress[]): Correlation[] {
    const toDay = (value: string | undefined): string => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return '';
      }
      return value.includes('T') ? new Date(value).toISOString().slice(0, 10) : value.trim().slice(0, 10);
    };

    const moodByDay = new Map<string, number>();
    for (const mood of moods) {
      const key = toDay(mood.date);
      if (key) {
        moodByDay.set(key, mood.level);
      }
    }

    const sleepByDay = new Map<string, number>();
    for (const sleep of sleeps) {
      const key = toDay(sleep.date);
      if (key) {
        sleepByDay.set(key, sleep.hours);
      }
    }

    const stressByDay = new Map<string, number>();
    for (const stress of stresses) {
      const key = toDay(stress.timestamp);
      if (key) {
        stressByDay.set(key, stress.level);
      }
    }

    const days = new Set<string>([...moodByDay.keys(), ...sleepByDay.keys(), ...stressByDay.keys()]);
    const merged: Correlation[] = [];

    for (const day of [...days].sort((left, right) => left.localeCompare(right))) {
      const moodLevel = moodByDay.get(day);
      const sleepHours = sleepByDay.get(day);
      const stressLevel = stressByDay.get(day);
      if (moodLevel != null && sleepHours != null && stressLevel != null) {
        merged.push({ date: day, sleepHours, moodLevel, stressLevel });
      }
    }

    return merged;
  }

  private buildInsights(): string[] {
    if (!this.hasData()) {
      return [
        'Log mood, sleep, and stress on the same calendar day for each day you want here. Three or more such days make the trend lines and tips more reliable.'
      ];
    }

    const messages: string[] = [];
    const sleepMood = this.sleepMoodCorrelation();
    const sleepStress = this.sleepStressCorrelation();
    const moodStress = this.moodStressCorrelation();

    if (sleepStress <= -0.25) {
      messages.push('Your stress increases when your sleep decreases. A steadier bedtime could help.');
    } else if (sleepStress >= 0.25) {
      messages.push('Your stress moves with your sleep. Focus on consistency across the full week.');
    }

    if (sleepMood >= 0.25) {
      messages.push('Your mood is better after a good sleep. Keep protecting the nights that leave you rested.');
    } else if (sleepMood <= -0.25) {
      messages.push('Your mood tends to drop after poor sleep. Improve sleep quality before adjusting anything else.');
    }

    if (messages.length === 0) {
      messages.push('Your sleep, mood, and stress signals are fairly balanced. Continue logging to reveal stronger trends.');
    }

    if (Math.abs(moodStress) >= 0.25 && messages.length < 3) {
      messages.push(moodStress > 0 ? 'Mood and stress are rising together, so routine stability matters.' : 'Mood and stress are moving in opposite directions, which is a good sign to monitor routine changes.');
    }

    return messages.slice(0, 3);
  }

  private averageOf(key: keyof Correlation): number {
    const items = this.sortedCorrelations();
    if (items.length === 0) {
      return 0;
    }

    const values = this.numericValues(key);
    const total = values.reduce((sum, value) => sum + value, 0);
    return total / items.length;
  }

  private pearsonCorrelation(xKey: keyof Correlation, yKey: keyof Correlation): number {
    const items = this.sortedCorrelations();
    if (items.length < 3) {
      return 0;
    }

    const xValues = this.numericValues(xKey);
    const yValues = this.numericValues(yKey);
    const meanX = this.mean(xValues);
    const meanY = this.mean(yValues);

    let numerator = 0;
    let xVariance = 0;
    let yVariance = 0;

    for (let index = 0; index < items.length; index += 1) {
      const xDelta = xValues[index] - meanX;
      const yDelta = yValues[index] - meanY;
      numerator += xDelta * yDelta;
      xVariance += xDelta * xDelta;
      yVariance += yDelta * yDelta;
    }

    const denominator = Math.sqrt(xVariance * yVariance);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private mean(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }

    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private numericValues(key: keyof Correlation): number[] {
    return this.sortedCorrelations().map((item) => item[key] as number);
  }

  private axisCeiling(): number {
    const items = this.sortedCorrelations();
    if (items.length === 0) {
      return 10;
    }

    const highestValue = Math.max(...items.flatMap((item) => [item.sleepHours, item.moodLevel, item.stressLevel]));
    return Math.max(10, Math.ceil(highestValue + 1));
  }

  private formatDateLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }
}
