import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-notification.component.html',
  styleUrl: './dashboard-notification.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardNotificationComponent {
  readonly notificationService = inject(NotificationService);

  togglePanel(): void {
    this.notificationService.togglePanel();
  }

  closePanel(): void {
    this.notificationService.closePanel();
  }

  dismissNotification(notificationId: string): void {
    this.notificationService.dismissNotification(notificationId);
  }

  focusNotification(notificationId: string): void {
    this.notificationService.focusNotification(notificationId);
  }
}