import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, filter, takeUntil } from 'rxjs/operators';
import { AppointmentService } from '../../../../shared/services/appointment.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { Appointment, CalendarProvider, ReminderChannel, ReminderProvider } from '../../../../shared/models/appointment.model';
import { buildUserDisplayMap, displayNameForUserId, getUserDisplayName } from '../../../../shared/utils/user-display';

@Component({
  selector: 'app-appointment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent implements OnInit, OnDestroy {
  appointments: Appointment[] = [];
  apiFilterMode: 'all' | 'search' | 'upcoming' = 'all';
  loading = false;
  error: string | null = null;
  /** True after a successful list/search/upcoming fetch (for intake checklist). */
  agendaFetchSucceeded = false;
  /** Step highlight for scroll nav: stats | actions | agenda */
  activeSchedulingStep: 'stats' | 'actions' | 'agenda' = 'stats';

  readonly schedulingWorkflowSteps: ReadonlyArray<{
    id: 'stats' | 'actions' | 'agenda';
    short: string;
    label: string;
    hint: string;
  }> = [
    { id: 'stats', short: '1', label: 'Pulse', hint: 'Scheduled vs tele volume' },
    { id: 'actions', short: '2', label: 'Act', hint: 'Filter, search, book, reminders' },
    { id: 'agenda', short: '3', label: 'Agenda', hint: 'Row actions: details, tele, reschedule' }
  ];
  selectedStatus: string = 'ALL';
  actionSuccess: string | null = null;
  actionError: string | null = null;

  upcomingDoctorKeyword = '';
  upcomingWindowMinutes = 30;

  searchDoctorId: number | null = null;
  searchPatientKeyword = '';
  searchReasonKeyword = '';

  rescheduleAppointmentId: number | null = null;
  rescheduleStartTime = '';
  rescheduleEndTime = '';

  reminderAppointmentId: number | null = null;
  reminderAt = '';
  /** True when the visit is too soon to allow any "24h before" scheduled reminder (use Send now). */
  reminderLeadUnavailable = false;
  reminderChannel: ReminderChannel = 'EMAIL';
  reminderProvider: ReminderProvider = 'LOCAL';
  calendarProvider: CalendarProvider = 'GOOGLE';
  showAdvancedFilters = false;

  /** Resolved labels for doctor/patient columns (ids stay internal only). */
  private userDisplayById = new Map<number, string>();
  /** Doctors for advanced search filter (no raw id entry in UI). */
  filterDoctors: User[] = [];

  /** Ignores stale HTTP responses when the user triggers a newer load (race guard). */
  private appointmentLoadGeneration = 0;

  /** Fixed toast for reminder email UX (non-blocking). */
  agendaToast: { kind: 'success' | 'error'; title: string; body: string } | null = null;
  private agendaToastTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private appointmentService: AppointmentService,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeTestDataIfNeeded();
    this.showCreatedBannerIfNeeded();
    this.userService.getDoctors().subscribe({
      next: (doctors) => {
        this.filterDoctors = doctors;
      },
      error: () => {
        this.filterDoctors = [];
      }
    });
    this.loadAppointments();
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        if (this.isAppointmentAgendaUrl(e.urlAfterRedirects)) {
          this.loadAppointments();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.dismissAgendaToast();
  }

  /** Main agenda list: `/appointments`, `/appointments/dashboard`, `/admin/appointments` — not create/details/etc. */
  private isAppointmentAgendaUrl(fullUrl: string): boolean {
    const path = fullUrl.split('?')[0].replace(/\/+$/, '');
    const seg = path.split('/').filter(Boolean);
    const idx = seg.indexOf('appointments');
    if (idx === -1) {
      return false;
    }
    const tail = seg.slice(idx + 1);
    if (tail.length === 0) {
      return true;
    }
    if (tail.length === 1 && tail[0] === 'dashboard') {
      return true;
    }
    return false;
  }

  dismissAgendaToast(): void {
    if (this.agendaToastTimer) {
      clearTimeout(this.agendaToastTimer);
      this.agendaToastTimer = null;
    }
    this.agendaToast = null;
  }

  private showAgendaToast(kind: 'success' | 'error', title: string, body: string, durationMs = 5600): void {
    if (this.agendaToastTimer) {
      clearTimeout(this.agendaToastTimer);
    }
    this.agendaToast = { kind, title, body };
    this.agendaToastTimer = setTimeout(() => this.dismissAgendaToast(), durationMs);
  }

  private showCreatedBannerIfNeeded(): void {
    const created = this.findQueryParam('created');
    if (!created) {
      return;
    }
    this.actionSuccess = 'The new appointment was created successfully.';
    void this.router.navigate(this.appointmentsBasePath(), { replaceUrl: true, queryParams: {} });
  }

  private appointmentsBasePath(): string[] {
    return this.router.url.startsWith('/admin') ? ['/admin', 'appointments'] : ['/appointments'];
  }

  private findQueryParam(key: string): string | null {
    let current: ActivatedRoute | null = this.route;
    while (current) {
      const value = current.snapshot.queryParamMap.get(key);
      if (value) {
        return value;
      }
      current = current.parent;
    }
    return null;
  }

  loadAppointments(): void {
    const generation = ++this.appointmentLoadGeneration;
    this.loading = true;
    this.error = null;
    forkJoin({
      appointments: this.appointmentService.getAllAppointments(),
      users: this.userService.getAllUsers().pipe(catchError(() => of([] as User[])))
    }).subscribe({
      next: ({ appointments, users }) => {
        if (generation !== this.appointmentLoadGeneration) {
          return;
        }
        this.apiFilterMode = 'all';
        this.userDisplayById = buildUserDisplayMap(users);
        this.setAppointments(appointments);
        this.agendaFetchSucceeded = true;
        this.loading = false;
      },
      error: (error) => {
        if (generation !== this.appointmentLoadGeneration) {
          return;
        }
        this.agendaFetchSucceeded = false;
        this.error = 'Failed to load appointments';
        this.loading = false;
        console.error('Error loading appointments:', error);
      }
    });
  }

  applyUpcomingFilter(): void {
    const generation = ++this.appointmentLoadGeneration;
    this.loading = true;
    this.error = null;
    this.apiFilterMode = 'upcoming';

    forkJoin({
      appointments: this.appointmentService.getUpcomingAppointments(
        this.upcomingDoctorKeyword.trim() || undefined,
        this.upcomingWindowMinutes
      ),
      users: this.userService.getAllUsers().pipe(catchError(() => of([] as User[])))
    }).subscribe({
      next: ({ appointments, users }) => {
        if (generation !== this.appointmentLoadGeneration) {
          return;
        }
        this.userDisplayById = buildUserDisplayMap(users);
        this.setAppointments(appointments);
        this.agendaFetchSucceeded = true;
        this.loading = false;
      },
      error: (error) => {
        if (generation !== this.appointmentLoadGeneration) {
          return;
        }
        this.agendaFetchSucceeded = false;
        this.error = 'Failed to load upcoming appointments.';
        this.loading = false;
        console.error('Error loading upcoming appointments:', error);
      }
    });
  }

  applyAdvancedSearch(): void {
    const generation = ++this.appointmentLoadGeneration;
    this.loading = true;
    this.error = null;
    this.apiFilterMode = 'search';

    forkJoin({
      appointments: this.appointmentService.searchAppointments({
        doctorId: this.searchDoctorId || undefined,
        patientKeyword: this.searchPatientKeyword.trim() || undefined,
        reasonKeyword: this.searchReasonKeyword.trim() || undefined
      }),
      users: this.userService.getAllUsers().pipe(catchError(() => of([] as User[])))
    }).subscribe({
      next: ({ appointments, users }) => {
        if (generation !== this.appointmentLoadGeneration) {
          return;
        }
        this.userDisplayById = buildUserDisplayMap(users);
        this.setAppointments(appointments);
        this.agendaFetchSucceeded = true;
        this.loading = false;
      },
      error: (error) => {
        if (generation !== this.appointmentLoadGeneration) {
          return;
        }
        this.agendaFetchSucceeded = false;
        this.error = 'Failed to search appointments.';
        this.loading = false;
        console.error('Error searching appointments:', error);
      }
    });
  }

  clearApiFilters(): void {
    this.upcomingDoctorKeyword = '';
    this.upcomingWindowMinutes = 30;
    this.searchDoctorId = null;
    this.searchPatientKeyword = '';
    this.searchReasonKeyword = '';
    this.loadAppointments();
  }

  private initializeTestDataIfNeeded(): void {
    try {
      const stored = localStorage.getItem('localAppointmentsFallback');
      if (stored && JSON.parse(stored).length > 0) {
        return;
      }
    } catch {
      // Ignore parse errors
    }

    const testAppointments = this.generateTestAppointments();
    if (testAppointments.length > 0) {
      localStorage.setItem('localAppointmentsFallback', JSON.stringify(testAppointments));
    }
  }

  private generateTestAppointments(): Appointment[] {
    const now = new Date();
    const appointments: Appointment[] = [];

    const statuses: Array<'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'> = ['SCHEDULED', 'COMPLETED', 'SCHEDULED', 'NO_SHOW'];
    const types: Array<'IN_PERSON' | 'VIDEO' | 'PHONE'> = ['VIDEO', 'IN_PERSON', 'PHONE', 'VIDEO'];

    for (let i = 0; i < 8; i++) {
      const daysOffset = i - 3;
      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() + daysOffset);
      startTime.setHours(9 + (i % 6), i % 60, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(endTime.getHours() + 1);

      appointments.push({
        id: i + 1,
        doctorId: (i % 3) + 1,
        patientId: (i % 4) + 1,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        consultationType: types[i % types.length],
        reasonForVisit: `Test appointment ${i + 1}`,
        status: statuses[i % statuses.length],
        urgent: i % 5 === 0
      });
    }

    return appointments;
  }

  get journeyAgendaLoaded(): boolean {
    return this.agendaFetchSucceeded;
  }

  get journeyHasVisits(): boolean {
    return this.appointments.length > 0;
  }

  scrollToSchedulingSection(stepId: 'stats' | 'actions' | 'agenda'): void {
    this.activeSchedulingStep = stepId;
    const el = document.getElementById(`appt-${stepId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get filteredAppointments(): Appointment[] {
    if (this.selectedStatus === 'ALL') {
      return this.appointments;
    }
    return this.appointments.filter(app => app.status === this.selectedStatus);
  }

  get appointmentStats(): { total: number; scheduled: number; teleUpcoming: number } {
    const now = Date.now();
    const teleUpcoming = this.appointments.filter(
      (a) =>
        a.status === 'SCHEDULED' &&
        this.isTeleconsultation(a) &&
        a.startTime &&
        new Date(a.startTime).getTime() > now
    ).length;
    return {
      total: this.appointments.length,
      scheduled: this.appointments.filter((a) => a.status === 'SCHEDULED').length,
      teleUpcoming
    };
  }

  getStatusBadgeClass(status: string | undefined): string {
    switch (status) {
      case 'SCHEDULED':
        return 'badge-info';
      case 'COMPLETED':
        return 'badge-success';
      case 'CANCELLED':
        return 'badge-danger';
      case 'NO_SHOW':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  }

  formatDateTime(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatConsultationType(type: string | undefined): string {
    switch (type) {
      case 'VIDEO':
        return 'Video';
      case 'PHONE':
        return 'Phone';
      case 'IN_PERSON':
        return 'In person';
      default:
        return type || '—';
    }
  }

  truncateText(value: string | undefined, max = 48): string {
    const t = (value || '').trim();
    if (!t) {
      return '—';
    }
    return t.length > max ? `${t.slice(0, max)}…` : t;
  }

  /** Template helper for doctor dropdown labels. */
  doctorOptionLabel(doctor: User): string {
    return getUserDisplayName(doctor);
  }

  doctorDisplayName(appointment: Appointment): string {
    return displayNameForUserId(this.userDisplayById, appointment.doctorId);
  }

  patientDisplayName(appointment: Appointment): string {
    return displayNameForUserId(this.userDisplayById, appointment.patientId);
  }

  get rescheduleModalTitle(): string {
    const a = this.appointments.find((x) => x.id === this.rescheduleAppointmentId);
    if (!a?.startTime) {
      return 'Reschedule appointment';
    }
    return `Reschedule · ${this.formatDateTime(a.startTime)}`;
  }

  get reminderModalTitle(): string {
    const a = this.appointments.find((x) => x.id === this.reminderAppointmentId);
    if (!a?.startTime) {
      return 'Schedule reminder';
    }
    return `Reminder · ${this.formatDateTime(a.startTime)}`;
  }

  isTeleconsultation(appointment: Appointment): boolean {
    return appointment.consultationType === 'VIDEO' || appointment.consultationType === 'PHONE';
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

  deleteAppointment(id: number): void {
    if (!confirm('Delete this appointment permanently?')) {
      return;
    }

    this.clearActionMessages();
    this.appointmentService.deleteAppointment(id).subscribe({
      next: () => {
        this.actionSuccess = 'Appointment deleted successfully.';
        this.loadAppointments();
      },
      error: (error) => {
        this.actionError = 'Failed to delete appointment.';
        console.error('Error deleting appointment:', error);
      }
    });
  }

  scheduleAppointment(): void {
    const isAdminRoute = this.router.url.startsWith('/admin');
    this.router.navigate([isAdminRoute ? '/admin/appointments/create' : '/appointments/create']);
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

    const start = new Date(this.rescheduleStartTime);
    const end = new Date(this.rescheduleEndTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      this.actionError = 'End time must be after start time.';
      return;
    }

    const payload = {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      status: 'SCHEDULED' as const
    };

    const appointment = this.appointments.find((item) => item.id === this.rescheduleAppointmentId);
    if (!appointment) {
      this.actionError = 'Appointment not found.';
      return;
    }

    this.clearActionMessages();
    this.appointmentService.detectAvailabilityConflicts(
      {
        ...appointment,
        startTime: start.toISOString(),
        endTime: end.toISOString()
      },
      this.rescheduleAppointmentId
    ).subscribe({
      next: (conflicts) => {
        const blocker = conflicts.find((conflict) => conflict.severity === 'BLOCKER');
        if (blocker) {
          this.actionError = blocker.message;
          return;
        }

        this.persistReschedule(payload);
      },
      error: () => {
        this.actionError = 'Failed to validate availability conflicts.';
      }
    });
  }

  private persistReschedule(payload: { startTime: string; endTime: string; status: 'SCHEDULED' }): void {
    if (!this.rescheduleAppointmentId) {
      return;
    }

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

  /** Hours between reminder send time and visit start (product rule). */
  private readonly reminderHoursBeforeVisit = 24;

  openReminderScheduler(appointment: Appointment): void {
    if (!appointment.id) {
      return;
    }

    this.clearActionMessages();
    this.rescheduleAppointmentId = null;
    this.reminderAppointmentId = appointment.id;

    const msLead = this.reminderHoursBeforeVisit * 60 * 60 * 1000;
    const visitStart = appointment.startTime ? new Date(appointment.startTime) : null;
    const now = new Date();

    this.reminderLeadUnavailable = false;
    if (!visitStart || Number.isNaN(visitStart.getTime())) {
      this.reminderAt = '';
      this.reminderLeadUnavailable = true;
    } else {
      const latestValidReminder = new Date(visitStart.getTime() - msLead);
      if (latestValidReminder.getTime() <= now.getTime()) {
        this.reminderAt = '';
        this.reminderLeadUnavailable = true;
      } else {
        this.reminderAt = this.toDateTimeLocal(latestValidReminder.toISOString());
      }
    }
    this.reminderChannel = 'EMAIL';
    this.reminderProvider = 'LOCAL';
    this.syncReminderProviderForChannel();
  }

  closeReminderScheduler(): void {
    this.reminderAppointmentId = null;
    this.reminderAt = '';
    this.reminderLeadUnavailable = false;
    this.reminderChannel = 'EMAIL';
    this.reminderProvider = 'LOCAL';
  }

  /** Email → Gmail/SMTP via Spring (`LOCAL`); SMS → Twilio. */
  syncReminderProviderForChannel(): void {
    if (this.reminderChannel === 'EMAIL') {
      this.reminderProvider = 'LOCAL';
    } else if (this.reminderChannel === 'SMS') {
      this.reminderProvider = 'TWILIO';
    } else {
      this.reminderProvider = 'LOCAL';
    }
  }

  scheduleReminder(): void {
    if (!this.reminderAppointmentId || !this.reminderAt) {
      this.actionError = this.reminderLeadUnavailable
        ? 'This visit is too soon for a 24-hour advance reminder. Use “Send now” for an immediate reminder, or pick an earlier visit.'
        : 'Please select reminder date and time.';
      return;
    }

    const reminderDate = new Date(this.reminderAt);
    if (Number.isNaN(reminderDate.getTime())) {
      this.actionError = 'Reminder date is invalid.';
      return;
    }

    this.clearActionMessages();
    this.appointmentService
      .scheduleAppointmentReminder(this.reminderAppointmentId, reminderDate.toISOString(), this.reminderChannel, this.reminderProvider)
      .subscribe({
        next: () => {
          this.actionSuccess = 'Reminder scheduled successfully.';
          this.closeReminderScheduler();
        },
        error: (error: Error) => {
          this.actionError = error?.message?.trim() || 'Failed to schedule reminder.';
          console.error('Error scheduling reminder:', error);
        }
      });
  }

  sendReminderNow(id: number): void {
    this.clearActionMessages();
    this.appointmentService.sendAppointmentReminder(id, this.reminderChannel, this.reminderProvider).subscribe({
      next: (result) => {
        if (result.success) {
          this.actionError = null;
          if (this.reminderChannel === 'EMAIL') {
            this.showAgendaToast(
              'success',
              'Reminder delivered',
              'Your email is on its way — the patient should receive it at their registered address within a few minutes.'
            );
          } else {
            this.actionSuccess = result.message?.trim() || `Reminder sent via ${result.provider}.`;
          }
        } else {
          this.actionSuccess = null;
          this.actionError = null;
          this.showAgendaToast(
            'error',
            'Could not send reminder',
            result.message?.trim() || 'Check SMTP settings and patient email, then try again.'
          );
        }
      },
      error: (error) => {
        this.clearActionMessages();
        this.showAgendaToast(
          'error',
          'Send request failed',
          'The server did not accept the request. Check that the API is running, then try again.'
        );
        console.error('Error sending reminder:', error);
      }
    });
  }

  syncCalendar(id: number): void {
    this.clearActionMessages();
    this.appointmentService.syncAppointmentCalendar(id, this.calendarProvider).subscribe({
      next: (result) => {
        this.actionSuccess = result.synced
          ? `Appointment synced with ${result.provider}.`
          : result.message || 'Calendar sync could not be completed.';
      },
      error: (error) => {
        this.actionError = 'Failed to sync calendar.';
        console.error('Error syncing calendar:', error);
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

  private setAppointments(appointments: Appointment[]): void {
    this.appointments = appointments.sort((a, b) => {
      const dateA = new Date(a.startTime || 0).getTime();
      const dateB = new Date(b.startTime || 0).getTime();
      return dateB - dateA;
    });
  }

  resetTestData(): void {
    if (confirm('Reset to generate new test data?')) {
      localStorage.removeItem('localAppointmentsFallback');
      this.appointments = [];
      this.initializeTestDataIfNeeded();
      this.loadAppointments();
    }
  }
}
