import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AppointmentDTO,
  AppointmentReminderDTO,
  ReminderChannel,
  ReminderProvider,
  TeleconsultationSessionDTO
} from '../../../../shared/models/appointment.model';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { UserService } from '../../../../shared/services/user.service';
import { buildUserDisplayMap, displayNameForUserId } from '../../../../shared/utils/user-display';
import { MedicalChatbotComponent } from '../medical/medical-chatbot.component';
import { PatientRemindersComponent } from '../../../appointments-scheduling/components/patient-reminders.component';

@Component({
  selector: 'app-appointment-details',
  standalone: true,
  imports: [CommonModule, FormsModule, MedicalChatbotComponent, PatientRemindersComponent],
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.css']
})
export class AppointmentDetailsComponent implements OnInit {
  appointmentId = 0;
  appointment: AppointmentDTO | null = null;
  doctorDisplayName = '';
  patientDisplayName = '';
  reminders: AppointmentReminderDTO[] = [];
  session: TeleconsultationSessionDTO | null = null;

  loading = false;
  error: string | null = null;
  success: string | null = null;

  rescheduleStartTime = '';
  rescheduleEndTime = '';
  reminderAt = '';
  reminderChannel: ReminderChannel = 'EMAIL';

  precheckCamera = false;
  precheckMicrophone = false;
  precheckMessage = '';

  activeDetailStep: 'summary' | 'ops' | 'reminders' | 'tele' | 'support' = 'summary';

  readonly detailWorkflowSteps: ReadonlyArray<{
    id: 'summary' | 'ops' | 'reminders' | 'tele' | 'support';
    short: string;
    label: string;
    hint: string;
  }> = [
    { id: 'summary', short: '1', label: 'Snapshot', hint: 'Who, when, status' },
    { id: 'ops', short: '2', label: 'Changes', hint: 'Reschedule or cancel' },
    { id: 'reminders', short: '3', label: 'Notify', hint: 'Reminder queue' },
    { id: 'tele', short: '4', label: 'Join', hint: 'Pre-check & room' },
    { id: 'support', short: '5', label: 'Assist', hint: 'Chat & patient tools' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appointmentService: AppointmentService,
    private userService: UserService
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
        if (appointment.startTime) {
          const visitStart = new Date(appointment.startTime);
          const now = new Date();
          const msDay = 24 * 60 * 60 * 1000;
          const latestValid = new Date(visitStart.getTime() - msDay);
          this.reminderAt =
            latestValid.getTime() > now.getTime() ? this.toDateTimeLocal(latestValid.toISOString()) : '';
        } else {
          this.reminderAt = '';
        }
        this.reminderChannel = 'EMAIL';
        this.resolveParticipantNames(appointment);
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

    const start = new Date(this.rescheduleStartTime);
    const end = new Date(this.rescheduleEndTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      this.error = 'End time must be after start time.';
      return;
    }

    this.appointmentService.updateAppointment(this.appointmentId, {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
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

  deleteAppointment(): void {
    if (!confirm('Delete this appointment permanently?')) {
      return;
    }

    this.appointmentService.deleteAppointment(this.appointmentId).subscribe({
      next: () => {
        this.success = 'Appointment deleted.';
        this.error = null;
        this.router.navigate(['/admin/appointments']);
      },
      error: () => {
        this.error = 'Failed to delete appointment.';
      }
    });
  }

  scheduleReminder(): void {
    if (!this.reminderAt) {
      this.error = 'Please choose reminder date/time.';
      return;
    }

    const reminderDate = new Date(this.reminderAt);
    if (Number.isNaN(reminderDate.getTime())) {
      this.error = 'Reminder date/time is invalid.';
      return;
    }

    this.appointmentService
      .scheduleAppointmentReminder(
        this.appointmentId,
        reminderDate.toISOString(),
        this.reminderChannel,
        this.providerForReminderChannel()
      )
      .subscribe({
        next: () => {
          this.success = 'Reminder scheduled.';
          this.error = null;
          this.loadReminders();
        },
        error: (err: unknown) => {
          this.error = err instanceof Error ? err.message : 'Failed to schedule reminder.';
        }
      });
  }

  sendReminderNow(): void {
    this.appointmentService
      .sendAppointmentReminder(this.appointmentId, this.reminderChannel, this.providerForReminderChannel())
      .subscribe({
      next: (result) => {
        if (result.success) {
          this.success = result.message?.trim() || 'Reminder sent now.';
          this.error = null;
        } else {
          this.error = result.message?.trim() || 'Reminder could not be sent.';
          this.success = null;
        }
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

  private providerForReminderChannel(): ReminderProvider {
    if (this.reminderChannel === 'SMS') {
      return 'TWILIO';
    }
    if (this.reminderChannel === 'EMAIL') {
      return 'LOCAL';
    }
    return 'LOCAL';
  }

  scrollToDetailSection(stepId: 'summary' | 'ops' | 'reminders' | 'tele' | 'support'): void {
    this.activeDetailStep = stepId;
    const el = document.getElementById(`detail-${stepId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private toDateTimeLocal(isoDate: string): string {
    if (!isoDate) {
      return '';
    }

    const date = new Date(isoDate);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  private resolveParticipantNames(appointment: AppointmentDTO): void {
    this.userService
      .getAllUsers()
      .pipe(catchError(() => of([])))
      .subscribe((users) => {
        const m = buildUserDisplayMap(users);
        this.doctorDisplayName = displayNameForUserId(m, appointment.doctorId);
        this.patientDisplayName = displayNameForUserId(m, appointment.patientId);
      });
  }

  get appointmentHeading(): string {
    if (!this.appointment?.startTime) {
      return 'Appointment details';
    }
    return `Visit · ${new Date(this.appointment.startTime).toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'short'
    })}`;
  }
}
