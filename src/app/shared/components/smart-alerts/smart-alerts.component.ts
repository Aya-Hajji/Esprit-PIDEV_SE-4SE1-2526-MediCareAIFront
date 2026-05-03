import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { HealthAlert, HealthAlertLevel } from '../../models/health-tracking.model';

@Component({
  selector: 'app-smart-alerts',
  imports: [CommonModule],
  templateUrl: './smart-alerts.component.html',
  styleUrl: './smart-alerts.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SmartAlertsComponent {
  readonly alerts = input<HealthAlert[]>([]);
  readonly ignoreAlert = output<number>();

  readonly visibleAlerts = computed(() => this.alerts().filter((alert) => !alert.ignored));

  trackByAlertId(_index: number, alert: HealthAlert): number {
    return alert.id;
  }

  getLevelLabel(level: HealthAlertLevel): string {
    return level;
  }

  getLevelIcon(level: HealthAlertLevel): string {
    switch (level) {
      case 'INFO':
        return 'ℹ️';
      case 'WARNING':
        return '⚠️';
      case 'URGENT':
        return '⛔';
    }
  }
}