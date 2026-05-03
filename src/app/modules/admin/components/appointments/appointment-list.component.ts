import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { Appointment } from '../../../../shared/models/appointment.model';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit {
  appointments: Appointment[] = [];
  loading = false;
  error: string | null = null;
  selectedStatus: string = 'ALL';
  actionSuccess: string | null = null;
  actionError: string | null = null;

  rescheduleAppointmentId: number | null = null;
  rescheduleStartTime = '';
  rescheduleEndTime = '';

  reminderAppointmentId: number | null = null;
  reminderAt = '';
  reminderChannel: 'EMAIL' | 'SMS' | 'PUSH' = 'EMAIL';

  constructor(
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
    this.loading = true;
    this.error = null;
    // Note: You may need to create an admin endpoint for all appointments
    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments) => {
        this.appointments = appointments;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load appointments';
        this.loading = false;
        console.error('Error loading appointments:', error);
      }
    });
  }

  get filteredAppointments(): Appointment[] {
    if (this.selectedStatus === 'ALL') {
      return this.appointments;
    }
    return this.appointments.filter(app => app.status === this.selectedStatus);
  }

  markAsNoShow(id: number): void {
    this.clearActionMessages();
    this.appointmentService.markAsNoShow(id).subscribe({
      next: () => {
        this.actionSuccess = 'Appointment updated to NO_SHOW.';
        this.loadAppointments();
      },
      error: (error) => {
        this.actionError = 'Failed to mark appointment as no-show.';
        console.error('Error marking as no-show:', error);
      }
    });
  }

  cancelAppointment(id: number): void {
    if (confirm('Cancel this appointment?')) {
      this.clearActionMessages();
      this.appointmentService.cancelAppointment(id).subscribe({
        next: () => {
          this.actionSuccess = 'Appointment cancelled successfully.';
          this.loadAppointments();
        },
        error: (error) => {
          this.actionError = 'Failed to cancel appointment.';
          console.error('Error canceling appointment:', error);
        }
      });
    }
  }

  scheduleAppointment(): void {
    this.router.navigate(['/admin/appointments/create']);
  }

  openAvailabilityExplorer(): void {
    this.router.navigate(['/appointments/availability']);
  }

  openReminderCenter(): void {
    this.router.navigate(['/appointments/reminders']);
  }

  openDetails(id: number): void {
    this.router.navigate(['/appointments/details', id]);
  }

  openTeleconsultation(id: number): void {
    this.router.navigate(['/appointments/session', id]);
  }

  openReschedule(appointment: Appointment): void {
    if (!appointment.id) {
      return;
    }

    this.clearActionMessages();
    this.reminderAppointmentId = null;
    this.rescheduleAppointmentId = appointment.id;
    this.rescheduleStartTime = this.toDateTimeLocal(appointment.startTime);
    this.rescheduleEndTime = this.toDateTimeLocal(appointment.endTime);
  }

  closeReschedule(): void {
    this.rescheduleAppointmentId = null;
    this.rescheduleStartTime = '';
    this.rescheduleEndTime = '';
  }

  submitReschedule(): void {
    if (!this.rescheduleAppointmentId || !this.rescheduleStartTime || !this.rescheduleEndTime) {
      this.actionError = 'Please select both start and end time.';
      return;
    }

    const payload = {
      startTime: new Date(this.rescheduleStartTime).toISOString(),
      endTime: new Date(this.rescheduleEndTime).toISOString(),
      status: 'SCHEDULED' as const
    };

    this.clearActionMessages();
    this.appointmentService.updateAppointment(this.rescheduleAppointmentId, payload).subscribe({
      next: () => {
        this.actionSuccess = 'Appointment rescheduled successfully.';
        this.closeReschedule();
        this.loadAppointments();
      },
      error: (error) => {
        this.actionError = 'Failed to reschedule appointment.';
        console.error('Error rescheduling appointment:', error);
      }
    });
  }

  openReminderScheduler(appointment: Appointment): void {
    if (!appointment.id) {
      return;
    }

    this.clearActionMessages();
    this.rescheduleAppointmentId = null;
    this.reminderAppointmentId = appointment.id;

    const referenceDate = appointment.startTime ? new Date(appointment.startTime) : new Date();
    const suggestedDate = new Date(referenceDate.getTime() - 30 * 60 * 1000);
    this.reminderAt = this.toDateTimeLocal(suggestedDate.toISOString());
  }

  closeReminderScheduler(): void {
    this.reminderAppointmentId = null;
    this.reminderAt = '';
    this.reminderChannel = 'EMAIL';
  }

  scheduleReminder(): void {
    if (!this.reminderAppointmentId || !this.reminderAt) {
      this.actionError = 'Please select reminder date and time.';
      return;
    }

    this.clearActionMessages();
    this.appointmentService
      .scheduleAppointmentReminder(this.reminderAppointmentId, new Date(this.reminderAt).toISOString(), this.reminderChannel)
      .subscribe({
        next: () => {
          this.actionSuccess = 'Reminder scheduled successfully.';
          this.closeReminderScheduler();
        },
        error: (error) => {
          this.actionError = 'Failed to schedule reminder.';
          console.error('Error scheduling reminder:', error);
        }
      });
  }

  sendReminderNow(id: number): void {
    this.clearActionMessages();
    this.appointmentService.sendAppointmentReminder(id, this.reminderChannel).subscribe({
      next: () => {
        this.actionSuccess = 'Reminder sent successfully.';
      },
      error: (error) => {
        this.actionError = 'Failed to send reminder.';
        console.error('Error sending reminder:', error);
      }
    });
  }

  private toDateTimeLocal(isoDate: string): string {
    if (!isoDate) {
      return '';
    }

    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  private clearActionMessages(): void {
    this.actionSuccess = null;
    this.actionError = null;
  }
}
