import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../shared/services/appointment.service';
import { AppointmentReminderDTO, ReminderChannel, ReminderProvider } from '../../../shared/models/appointment.model';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-patient-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-reminders.component.html',
  styleUrls: ['./patient-reminders.component.css']
})
export class PatientRemindersComponent implements OnInit {
  @Input() appointmentId?: number;

  reminders$: Observable<AppointmentReminderDTO[]> = of([]);
  newRemindAt = '';
  channel: ReminderChannel = 'EMAIL';
  sendError: string | null = null;

  constructor(private appointmentService: AppointmentService) {}

  /** Matches AppointmentService.defaultReminderProvider behaviour for explicit API calls. */
  private providerForChannel(): ReminderProvider {
    if (this.channel === 'SMS') {
      return 'TWILIO';
    }
    if (this.channel === 'EMAIL') {
      return 'LOCAL';
    }
    return 'LOCAL';
  }

  ngOnInit(): void {
    this.loadReminders();
  }

  loadReminders(): void {
    if (!this.appointmentId) {
      this.reminders$ = of([]);
      return;
    }

    this.reminders$ = this.appointmentService.getAppointmentReminders(this.appointmentId);
  }

  schedule(): void {
    if (!this.appointmentId || !this.newRemindAt) {
      return;
    }

    const remindIso = new Date(this.newRemindAt).toISOString();
    this.appointmentService
      .scheduleAppointmentReminder(this.appointmentId, remindIso, this.channel, this.providerForChannel())
      .subscribe({
      next: () => {
        this.newRemindAt = '';
        this.loadReminders();
      },
      error: (err: unknown) => console.error('Failed to schedule reminder', err)
    });
  }

  sendNow(): void {
    if (!this.appointmentId) {
      return;
    }

    this.sendError = null;
    this.appointmentService
      .sendAppointmentReminder(this.appointmentId, this.channel, this.providerForChannel())
      .subscribe({
      next: (result) => {
        if (result.success) {
          this.sendError = null;
          this.loadReminders();
        } else {
          this.sendError = result.message?.trim() || 'Reminder could not be sent.';
        }
      },
      error: (err: unknown) => {
        this.sendError = 'Failed to send reminder.';
        console.error('Failed to send reminder', err);
      }
    });
  }
}
