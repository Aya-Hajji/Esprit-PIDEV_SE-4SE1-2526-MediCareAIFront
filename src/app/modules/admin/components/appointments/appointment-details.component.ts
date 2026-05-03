import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AppointmentDTO,
  AppointmentReminderDTO,
  TeleconsultationSessionDTO
} from '../../../../shared/models/appointment.model';
import { AppointmentService } from '../../../../shared/services/appointment.service';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.css']
})
export class AppointmentDetailsComponent implements OnInit {
  appointmentId = 0;
  appointment: AppointmentDTO | null = null;
  reminders: AppointmentReminderDTO[] = [];
  session: TeleconsultationSessionDTO | null = null;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  rescheduleStartTime = '';
  rescheduleEndTime = '';
  reminderAt = '';
  reminderChannel: 'EMAIL' | 'SMS' | 'PUSH' = 'EMAIL';

  precheckCamera = false;
  precheckMicrophone = false;
  precheckMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.appointmentId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.appointmentId) {
      this.error = 'Invalid appointment ID.';
      return;
    }

    this.loadDetails();
  }

  loadDetails(): void {
    this.loading = true;
    this.error = null;

    this.appointmentService.getAppointmentById(this.appointmentId).subscribe({
      next: (appointment) => {
        this.appointment = appointment;
        this.rescheduleStartTime = this.toDateTimeLocal(appointment.startTime);
        this.rescheduleEndTime = this.toDateTimeLocal(appointment.endTime);
        this.loadReminders();
        this.loadTeleconsultation();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load appointment details.';
        this.loading = false;
      }
    });
  }

  loadReminders(): void {
    this.appointmentService.getAppointmentReminders(this.appointmentId).subscribe({
      next: (reminders) => (this.reminders = reminders),
      error: () => (this.reminders = [])
    });
  }

  loadTeleconsultation(): void {
    this.appointmentService.getTeleconsultationSession(this.appointmentId).subscribe({
      next: (session) => (this.session = session),
      error: () => (this.session = null)
    });
  }

  saveReschedule(): void {
    if (!this.rescheduleStartTime || !this.rescheduleEndTime) {
      this.error = 'Please select start and end times.';
      return;
    }

    this.appointmentService.updateAppointment(this.appointmentId, {
      startTime: new Date(this.rescheduleStartTime).toISOString(),
      endTime: new Date(this.rescheduleEndTime).toISOString(),
      status: 'SCHEDULED'
    }).subscribe({
      next: () => {
        this.success = 'Appointment rescheduled.';
        this.error = null;
        this.loadDetails();
      },
      error: () => {
        this.error = 'Failed to reschedule appointment.';
      }
    });
  }

  cancelAppointment(): void {
    this.appointmentService.cancelAppointment(this.appointmentId).subscribe({
      next: () => {
        this.success = 'Appointment cancelled.';
        this.error = null;
        this.loadDetails();
      },
      error: () => {
        this.error = 'Failed to cancel appointment.';
      }
    });
  }

  scheduleReminder(): void {
    if (!this.reminderAt) {
      this.error = 'Please choose reminder date/time.';
      return;
    }

    this.appointmentService
      .scheduleAppointmentReminder(this.appointmentId, new Date(this.reminderAt).toISOString(), this.reminderChannel)
      .subscribe({
        next: () => {
          this.success = 'Reminder scheduled.';
          this.error = null;
          this.loadReminders();
        },
        error: () => {
          this.error = 'Failed to schedule reminder.';
        }
      });
  }

  sendReminderNow(): void {
    this.appointmentService.sendAppointmentReminder(this.appointmentId, this.reminderChannel).subscribe({
      next: () => {
        this.success = 'Reminder sent now.';
        this.error = null;
      },
      error: () => {
        this.error = 'Failed to send reminder.';
      }
    });
  }

  async runPrecheck(): Promise<void> {
    this.precheckCamera = false;
    this.precheckMicrophone = false;
    this.precheckMessage = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      this.precheckCamera = stream.getVideoTracks().length > 0;
      this.precheckMicrophone = stream.getAudioTracks().length > 0;
      stream.getTracks().forEach((t) => t.stop());
      this.precheckMessage = 'Camera and microphone are available.';
    } catch {
      this.precheckMessage = 'Unable to access camera/microphone. Please check browser permissions.';
    }
  }

  joinTeleconsultation(): void {
    this.router.navigate(['/appointments/session', this.appointmentId]);
  }

  private toDateTimeLocal(isoDate: string): string {
    if (!isoDate) {
      return '';
    }

    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }
}
