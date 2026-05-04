import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, timeout } from 'rxjs/operators';
import { AppointmentDTO, AppointmentReminderDTO, ReminderChannel } from '../../../../shared/models/appointment.model';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { AppointmentReminderNotifyService } from '../../../../shared/services/appointment-reminder-notify.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { buildUserDisplayMap, displayNameForUserId } from '../../../../shared/utils/user-display';

@Component({
  selector: 'app-appointment-reminders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-reminders.component.html',
  styleUrls: ['./appointment-reminders.component.css']
})
export class AppointmentRemindersComponent implements OnInit {
  appointments: AppointmentDTO[] = [];
  remindersByAppointmentId: { [appointmentId: number]: AppointmentReminderDTO[] } = {};
  customRemindAtById: { [appointmentId: number]: string } = {};
  /** Channel for manual “other channel” actions; primary flow is NOTIFICATION (day before). */
  scheduleChannel: ReminderChannel = 'NOTIFICATION';

  loading = false;
  error: string | null = null;
  success: string | null = null;
  sendingReminderForId: number | null = null;
  schedulingForId: number | null = null;
  schedulingBulk = false;

  private userDisplayById = new Map<number, string>();

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private router: Router,
    private reminderNotify: AppointmentReminderNotifyService
  ) {}

  ngOnInit(): void {
    this.refreshAppointments();
  }

  refreshAppointments(): void {
    this.loading = true;
    this.error = null;

    this.appointmentService
      .getAllAppointments()
      .pipe(
        timeout(15000),
        catchError(() => {
          this.error = 'Unable to load scheduled appointments.';
          return of([] as AppointmentDTO[]);
        }),
        switchMap((appointments) => {
          const list = Array.isArray(appointments) ? appointments : [];
          return this.userService.getAllUsers().pipe(
            catchError(() => of([] as User[])),
            map((users) => {
              this.userDisplayById = buildUserDisplayMap(users);
              return list;
            })
          );
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (appointments) => {
          this.appointments = appointments
            .filter((a) => a.status === 'SCHEDULED')
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
          this.loadRemindersForAppointments();
        }
      });
  }

  doctorDisplayName(appointment: AppointmentDTO): string {
    return displayNameForUserId(this.userDisplayById, appointment.doctorId);
  }

  patientDisplayName(appointment: AppointmentDTO): string {
    return displayNameForUserId(this.userDisplayById, appointment.patientId);
  }


  private loadRemindersForAppointments(): void {
    const withIds = this.appointments.filter((a) => a.id != null);
    if (withIds.length === 0) {
      this.remindersByAppointmentId = {};
      return;
    }

    forkJoin(
      withIds.map((a) =>
        this.appointmentService.getAppointmentReminders(a.id!).pipe(catchError(() => of([] as AppointmentReminderDTO[])))
      )
    ).subscribe((rows) => {
      const map: { [id: number]: AppointmentReminderDTO[] } = {};
      withIds.forEach((a, i) => {
        if (a.id != null) {
          map[a.id] = rows[i] || [];
        }
      });
      this.remindersByAppointmentId = { ...map };
    });
  }

  remindersFor(appointment: AppointmentDTO): AppointmentReminderDTO[] {
    if (!appointment.id) {
      return [];
    }
    return this.remindersByAppointmentId[appointment.id] || [];
  }

  channelLabel(ch: ReminderChannel | undefined): string {
    switch (ch) {
      case 'NOTIFICATION':
        return 'Notification';
      case 'SMS':
        return 'SMS';
      case 'PUSH':
        return 'Push';
      default:
        return 'Email';
    }
  }

  reminderSummary(appointment: AppointmentDTO): string {
    const rows = this.remindersFor(appointment);
    if (rows.length === 0) {
      return 'No reminder scheduled';
    }
    return rows
      .map(
        (r) =>
          `${r.status || '—'} · ${this.channelLabel(r.channel)} · ${
            r.remindAt ? new Date(r.remindAt).toLocaleString() || r.remindAt : '—'
          }`
      )
      .join(' | ');
  }

  /** Notification reminder exactly 24 h before appointment start. */
  scheduleDayBeforeNotification(appointment: AppointmentDTO): void {
    void this.reminderNotify.requestNotificationPermission();
    this.scheduleHoursBefore(appointment, 24, 'NOTIFICATION');
  }

  scheduleHoursBefore(appointment: AppointmentDTO, hours: number, channel?: ReminderChannel): void {
    if (!appointment.id || !appointment.startTime) {
      return;
    }
    const start = new Date(appointment.startTime).getTime();
    const remindAt = new Date(start - hours * 60 * 60 * 1000).toISOString();
    this.scheduleAt(appointment, remindAt, channel ?? this.scheduleChannel);
  }

  scheduleCustom(appointment: AppointmentDTO): void {
    if (!appointment.id) {
      return;
    }
    const local = this.customRemindAtById[appointment.id];
    if (!local) {
      this.error = 'Pick a date and time for the reminder.';
      return;
    }
    const remindAt = new Date(local).toISOString();
    this.scheduleAt(appointment, remindAt, this.scheduleChannel);
  }

  private scheduleAt(appointment: AppointmentDTO, remindAt: string, channel: ReminderChannel): void {
    if (!appointment.id) {
      return;
    }
    this.success = null;
    this.error = null;
    this.schedulingForId = appointment.id;

    this.appointmentService.scheduleAppointmentReminder(appointment.id, remindAt, channel).subscribe({
      next: () => {
        this.success = `${this.channelLabel(channel)} reminder scheduled for appointment #${appointment.id}.`;
        this.schedulingForId = null;
        this.loadRemindersForAppointments();
      },
      error: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to schedule reminder.';
        this.error = msg;
        this.schedulingForId = null;
      }
    });
  }

  /** Schedule NOTIFICATION reminder 24 h before for each eligible appointment (no email/SMS). */
  scheduleNotificationJ1ForAll(): void {
    this.error = null;
    this.success = null;
    void this.reminderNotify.requestNotificationPermission().then(() => {
      const eligible = this.appointments.filter((a) => {
        if (!a.id || !a.startTime) {
          return false;
        }
        const startMs = new Date(a.startTime).getTime();
        const remindMs = startMs - 24 * 60 * 60 * 1000;
        return remindMs > Date.now();
      });
      if (eligible.length === 0) {
        this.error = 'No appointment is far enough in the future for a day-before reminder (reminder time must be in the future).';
        return;
      }
      this.schedulingBulk = true;
      forkJoin(
        eligible.map((a) =>
          this.appointmentService
            .scheduleAppointmentReminder(
              a.id!,
              new Date(new Date(a.startTime!).getTime() - 24 * 60 * 60 * 1000).toISOString(),
              'NOTIFICATION'
            )
            .pipe(catchError(() => of(null)))
        )
      )
        .pipe(finalize(() => (this.schedulingBulk = false)))
        .subscribe({
          next: () => {
            this.success = `Day-before notification reminders saved for ${eligible.length} appointment(s).`;
            this.loadRemindersForAppointments();
          },
          error: () => {
            this.error = 'Bulk scheduling failed partially or completely.';
          }
        });
    });
  }

  quickSendReminder(appointment: AppointmentDTO): void {
    if (!appointment.id) {
      return;
    }

    this.success = null;
    this.error = null;
    this.sendingReminderForId = appointment.id;

    this.appointmentService.sendAppointmentReminder(appointment.id, this.scheduleChannel).subscribe({
      next: (result) => {
        this.sendingReminderForId = null;
        if (result.success) {
          this.success =
            result.message?.trim() ||
            `Send action run (${this.channelLabel(this.scheduleChannel)}) for appointment #${appointment.id}.`;
          this.error = null;
          this.loadRemindersForAppointments();
        } else {
          this.error = result.message?.trim() || `Send failed for appointment #${appointment.id}.`;
          this.success = null;
        }
      },
      error: () => {
        this.error = `Send failed for appointment #${appointment.id}.`;
        this.sendingReminderForId = null;
      }
    });
  }

  openDetails(appointment: AppointmentDTO): void {
    if (!appointment.id) {
      return;
    }

    this.router.navigate(['/appointments/details', appointment.id]);
  }

  isTele(appointment: AppointmentDTO): boolean {
    return appointment.consultationType === 'VIDEO' || appointment.consultationType === 'PHONE';
  }

  onCustomRemindChange(appointmentId: number | null | undefined, value: string): void {
    if (appointmentId == null) {
      return;
    }
    this.customRemindAtById = { ...this.customRemindAtById, [appointmentId]: value };
  }

  customRemindAt(appointmentId: number | null | undefined): string {
    if (appointmentId == null) {
      return '';
    }
    return this.customRemindAtById[appointmentId] || '';
  }
}
