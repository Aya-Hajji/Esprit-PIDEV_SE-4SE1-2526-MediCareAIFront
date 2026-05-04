import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  Appointment,
  AppointmentDTO,
  AppointmentMatchCandidate,
  AppointmentMatchRequest,
  AppointmentReminderDTO,
  AvailabilityConflict,
  AvailabilityDTO,
  CalendarProvider,
  CalendarSyncRequest,
  CalendarSyncResult,
  ReminderChannel,
  ReminderDeliveryRequest,
  ReminderDeliveryResult,
  ReminderProvider,
  VideoProvider,
  TeleconsultationSessionDTO
} from '../models/appointment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  /**
   * When `true`, appointments/reminders use localStorage and no real email is sent.
   * When `false` (see `environment.useLiveAppointmentApi`), the app calls Spring so Gmail/SMTP on the server can deliver mail.
   */
  private readonly forceLocalCrud = !environment.useLiveAppointmentApi;
  /** Minimum delay before start for standard bookings (minutes). */
  private readonly minLeadMinutesStandard = 120;
  /** Shorter lead time when visit is flagged urgent. */
  private readonly minLeadMinutesUrgent = 20;
  /** Gap required between consecutive consultations for the same practitioner (minutes). */
  private readonly turnaroundBufferMinutes = 10;
  private readonly minConsultationMinutes = 15;
  private readonly maxConsultationMinutes = 240;
  private readonly localAppointmentsKey = 'localAppointmentsFallback';
  private readonly localAvailabilitiesKey = 'localAvailabilitiesFallback';
  private readonly localRemindersKey = 'localAppointmentRemindersFallback';
  private readonly localCalendarSyncKey = 'localAppointmentCalendarSyncFallback';
  private readonly localTeleconsultationKey = 'localTeleconsultationSessionsFallback';
  private baseUrl = environment.apiBaseUrl.replace(/\/+$/, '');
  private appointmentUrl = `${this.baseUrl}/appointments`;
  private availabilityUrl = `${this.baseUrl}/availabilities`;
  private integrationsUrl = `${this.baseUrl}/integrations`;

  constructor(private http: HttpClient) {}

  // Appointments
  getAllAppointments(): Observable<AppointmentDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalAppointments());
    }

    return this.http.get<unknown>(this.appointmentUrl).pipe(
      map((response) => this.normalizeAppointmentList(response)),
      tap((rows) => this.setLocalAppointments(rows)),
      catchError(() => of(this.getLocalAppointments()))
    );
  }

  getAppointmentById(id: number): Observable<AppointmentDTO> {
    if (this.forceLocalCrud) {
      return of(this.getLocalAppointments().find((item) => item.id === id) || this.normalizeAppointment({ id }));
    }

    return this.http.get<unknown>(`${this.appointmentUrl}/${id}`).pipe(
      map((response) => this.normalizeAppointment(response)),
      catchError(() => of(this.getLocalAppointments().find((item) => item.id === id) || this.normalizeAppointment({ id })))
    );
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.getAllAppointments().pipe(map((appointments) => appointments as Appointment[]));
  }

  getPatientAppointments(patientId: number): Observable<AppointmentDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalAppointments().filter((item) => item.patientId === patientId));
    }

    return this.http.get<unknown>(`${this.appointmentUrl}/patient/${patientId}`).pipe(
      map((response) => this.normalizeAppointmentList(response)),
      catchError(() => of(this.getLocalAppointments().filter((item) => item.patientId === patientId)))
    );
  }

  getDoctorAppointments(doctorId: number): Observable<AppointmentDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalAppointments().filter((item) => item.doctorId === doctorId));
    }

    return this.http.get<unknown>(`${this.appointmentUrl}/doctor/${doctorId}`).pipe(
      map((response) => this.normalizeAppointmentList(response)),
      catchError(() => of(this.getLocalAppointments().filter((item) => item.doctorId === doctorId)))
    );
  }

  getUpcomingAppointments(doctorKeyword?: string, windowMinutes?: number): Observable<AppointmentDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.filterLocalUpcoming(doctorKeyword, windowMinutes));
    }

    const params = this.buildSearchParams({
      doctorKeyword,
      windowMinutes
    });

    return this.http.get<unknown>(`${this.appointmentUrl}/upcoming`, { params }).pipe(
      map((response) => this.normalizeAppointmentList(response)),
      catchError(() => of(this.filterLocalUpcoming(doctorKeyword, windowMinutes)))
    );
  }

  searchAppointments(filters: {
    doctorId?: number;
    patientKeyword?: string;
    reasonKeyword?: string;
  }): Observable<AppointmentDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.filterLocalSearch(filters));
    }

    const params = this.buildSearchParams(filters);

    return this.http.get<unknown>(`${this.appointmentUrl}/search`, { params }).pipe(
      map((response) => this.normalizeAppointmentList(response)),
      catchError(() => of(this.filterLocalSearch(filters)))
    );
  }

  createAppointment(appointment: AppointmentDTO): Observable<AppointmentDTO> {
    if (this.forceLocalCrud) {
      const created = this.createLocalAppointment(appointment);
      const merged = this.mergeAppointment(this.getLocalAppointments(), created);
      this.setLocalAppointments(merged);
      return of(created);
    }

    return this.http.post<unknown>(this.appointmentUrl, this.toBackendAppointmentBody(appointment)).pipe(
      map((response) => this.normalizeAppointment(response)),
      tap((created) => {
        const merged = this.mergeAppointment(this.getLocalAppointments(), created);
        this.setLocalAppointments(merged);
      })
    );
  }

  updateAppointment(id: number, appointment: Partial<AppointmentDTO>): Observable<AppointmentDTO> {
    if (this.forceLocalCrud) {
      const current = this.getLocalAppointments().find((item) => item.id === id)
        || this.createLocalAppointment({ doctorId: 0, patientId: 0, startTime: new Date().toISOString(), endTime: new Date().toISOString(), consultationType: 'IN_PERSON' });
      const updated: AppointmentDTO = { ...current, ...appointment, id };
      const rows = this.getLocalAppointments().map((item) => (item.id === id ? updated : item));
      this.setLocalAppointments(rows);
      return of(updated);
    }

    return this.http.put<unknown>(`${this.appointmentUrl}/${id}`, this.toBackendAppointmentBody(appointment)).pipe(
      map((response) => this.normalizeAppointment(response)),
      tap((updated) => {
        const rows = this.getLocalAppointments().map((item) => (item.id === id ? { ...item, ...updated, id } : item));
        this.setLocalAppointments(rows);
      })
    );
  }

  deleteAppointment(id: number): Observable<void> {
    if (this.forceLocalCrud) {
      this.setLocalAppointments(this.getLocalAppointments().filter((item) => item.id !== id));
      return of(void 0);
    }

    return this.http.delete<void>(`${this.appointmentUrl}/${id}`).pipe(
      tap(() => this.setLocalAppointments(this.getLocalAppointments().filter((item) => item.id !== id)))
    );
  }

  private getLocalAppointments(): AppointmentDTO[] {
    try {
      const raw = localStorage.getItem(this.localAppointmentsKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeAppointment(item)) : [];
    } catch {
      return [];
    }
  }

  private setLocalAppointments(rows: AppointmentDTO[]): void {
    try {
      localStorage.setItem(this.localAppointmentsKey, JSON.stringify(rows));
    } catch {
      // Ignore storage errors.
    }
  }

  private mergeAppointment(existing: AppointmentDTO[], row: AppointmentDTO): AppointmentDTO[] {
    if (!row.id) {
      return existing;
    }

    const has = existing.some((item) => item.id === row.id);
    if (!has) {
      return [row, ...existing];
    }

    return existing.map((item) => (item.id === row.id ? row : item));
  }

  private createLocalAppointment(input: Partial<AppointmentDTO>): AppointmentDTO {
    const nextId = this.getLocalAppointments().reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
    const startTime = this.readString(input.startTime) || new Date().toISOString();

    return {
      id: nextId,
      doctorId: this.readNumber(input.doctorId) || 0,
      patientId: this.readNumber(input.patientId) || 0,
      startTime,
      endTime: this.readString(input.endTime) || this.estimateEndTime(startTime),
      consultationType: this.readConsultationType(input.consultationType),
      reasonForVisit: this.readString(input.reasonForVisit) || undefined,
      timeZone: this.readString(input.timeZone) || undefined,
      urgent: input.urgent === true,
      status: this.readStatus(input.status) || 'SCHEDULED'
    };
  }

  private getLocalAvailabilities(): AvailabilityDTO[] {
    try {
      const raw = localStorage.getItem(this.localAvailabilitiesKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeAvailability(item)) : [];
    } catch {
      return [];
    }
  }

  private buildSearchParams(filters: {
    doctorId?: number;
    doctorKeyword?: string;
    patientKeyword?: string;
    reasonKeyword?: string;
    windowMinutes?: number;
  }): HttpParams {
    let params = new HttpParams();

    if (filters.doctorId !== undefined && filters.doctorId !== null) {
      params = params.set('doctorId', String(filters.doctorId));
    }

    if (filters.doctorKeyword && filters.doctorKeyword.trim()) {
      params = params.set('doctorKeyword', filters.doctorKeyword.trim());
    }

    if (filters.patientKeyword && filters.patientKeyword.trim()) {
      params = params.set('patientKeyword', filters.patientKeyword.trim());
    }

    if (filters.reasonKeyword && filters.reasonKeyword.trim()) {
      params = params.set('reasonKeyword', filters.reasonKeyword.trim());
    }

    if (filters.windowMinutes !== undefined && filters.windowMinutes !== null) {
      params = params.set('windowMinutes', String(filters.windowMinutes));
    }

    return params;
  }

  private setLocalAvailabilities(rows: AvailabilityDTO[]): void {
    try {
      localStorage.setItem(this.localAvailabilitiesKey, JSON.stringify(rows));
    } catch {
      // Ignore storage errors.
    }
  }

  private mergeAvailability(existing: AvailabilityDTO[], row: AvailabilityDTO): AvailabilityDTO[] {
    if (!row.id) {
      return existing;
    }

    const has = existing.some((item) => item.id === row.id);
    if (!has) {
      return [row, ...existing];
    }

    return existing.map((item) => (item.id === row.id ? row : item));
  }

  private createLocalAvailability(input: Partial<AvailabilityDTO>): AvailabilityDTO {
    const nextId = this.getLocalAvailabilities().reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;

    return {
      id: nextId,
      doctorId: this.readNumber(input.doctorId) || 0,
      startTime: this.readString(input.startTime) || '',
      endTime: this.readString(input.endTime) || '',
      maxAppointments: this.readNumber(input.maxAppointments) || 1,
      blocked: input.blocked === true
    };
  }

  private normalizeAvailability(response: unknown): AvailabilityDTO {
    if (!response || typeof response !== 'object') {
      return {
        doctorId: 0,
        startTime: '',
        endTime: '',
        maxAppointments: 1,
        blocked: false
      };
    }

    const source = response as Record<string, unknown>;
    const dateValue = this.readString(source['date']);
    const startValue = this.readString(source['startTime']);
    const endValue = this.readString(source['endTime']);

    const normalizedStart = this.combineDateTime(dateValue, startValue);
    const normalizedEnd = this.combineDateTime(dateValue, endValue);
    const available = source['available'];

    return {
      id: this.readNumber(source['id']),
      doctorId: this.readNumber(source['doctorId']) || 0,
      startTime: normalizedStart,
      endTime: normalizedEnd,
      blocked: available === false ? true : source['blocked'] === true,
      maxAppointments: this.readNumber(source['maxAppointments']) || 1
    } as AvailabilityDTO;
  }

  cancelAppointment(id: number): Observable<void> {
    return this.updateAppointment(id, { status: 'CANCELLED' }).pipe(map(() => void 0));
  }

  markAsNoShow(id: number): Observable<Appointment> {
    return this.updateAppointment(id, { status: 'NO_SHOW' }).pipe(map((appointment) => appointment as Appointment));
  }

  // Doctor Availability
  getDoctorAvailability(doctorId: number): Observable<AvailabilityDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalAvailabilities().filter((item) => item.doctorId === doctorId));
    }

    return this.http.get<unknown>(`${this.availabilityUrl}/doctor/${doctorId}`).pipe(
      map((response) => this.normalizeAvailabilityList(response)),
      tap((rows) => this.setLocalAvailabilities(rows)),
      catchError(() => of(this.getLocalAvailabilities().filter((item) => item.doctorId === doctorId)))
    );
  }

  getAvailableDoctorAvailability(doctorId: number): Observable<AvailabilityDTO[]> {
    if (this.forceLocalCrud) {
      return of(
        this.getLocalAvailabilities().filter(
          (item) => item.doctorId === doctorId && !item.blocked
        )
      );
    }

    return this.http.get<unknown>(`${this.availabilityUrl}/doctor/${doctorId}/available`).pipe(
      map((response) => this.normalizeAvailabilityList(response)),
      tap((rows) => this.setLocalAvailabilities(rows)),
      catchError(() =>
        of(
          this.getLocalAvailabilities().filter(
            (item) => item.doctorId === doctorId && !item.blocked
          )
        )
      )
    );
  }

  createAvailability(availability: AvailabilityDTO): Observable<AvailabilityDTO> {
    if (this.forceLocalCrud) {
      const created = this.createLocalAvailability(availability);
      const merged = this.mergeAvailability(this.getLocalAvailabilities(), created);
      this.setLocalAvailabilities(merged);
      return of(created);
    }

    return this.http.post<AvailabilityDTO>(this.availabilityUrl, this.toAvailabilityRequestBody(availability)).pipe(
      tap((created) => {
        const merged = this.mergeAvailability(this.getLocalAvailabilities(), created);
        this.setLocalAvailabilities(merged);
      }),
      catchError(() => {
        const created = this.createLocalAvailability(availability);
        const merged = this.mergeAvailability(this.getLocalAvailabilities(), created);
        this.setLocalAvailabilities(merged);
        return of(created);
      })
    );
  }

  updateAvailability(id: number, availability: Partial<AvailabilityDTO>): Observable<AvailabilityDTO> {
    if (this.forceLocalCrud) {
      const existing = this.getLocalAvailabilities().find((item) => item.id === id);
      if (!existing) {
        return of(this.normalizeAvailability({}));
      }

      const updated = { ...existing, ...availability, id };
      const merged = this.mergeAvailability(this.getLocalAvailabilities(), updated);
      this.setLocalAvailabilities(merged);
      return of(updated);
    }

    return this.http.put<AvailabilityDTO>(`${this.availabilityUrl}/${id}`, this.toAvailabilityRequestBody(availability)).pipe(
      tap((updated) => {
        const merged = this.mergeAvailability(this.getLocalAvailabilities(), updated);
        this.setLocalAvailabilities(merged);
      }),
      catchError(() => {
        const existing = this.getLocalAvailabilities().find((item) => item.id === id);
        if (!existing) {
          return of(this.normalizeAvailability({}));
        }

        const updated = { ...existing, ...availability, id };
        const merged = this.mergeAvailability(this.getLocalAvailabilities(), updated);
        this.setLocalAvailabilities(merged);
        return of(updated);
      })
    );
  }

  deleteAvailability(id: number): Observable<void> {
    if (this.forceLocalCrud) {
      const filtered = this.getLocalAvailabilities().filter((item) => item.id !== id);
      this.setLocalAvailabilities(filtered);
      return of(void 0);
    }

    return this.http.delete<void>(`${this.availabilityUrl}/${id}`).pipe(
      tap(() => {
        const filtered = this.getLocalAvailabilities().filter((item) => item.id !== id);
        this.setLocalAvailabilities(filtered);
      }),
      catchError(() => {
        const filtered = this.getLocalAvailabilities().filter((item) => item.id !== id);
        this.setLocalAvailabilities(filtered);
        return of(void 0);
      })
    );
  }

  // Reminders
  getAppointmentReminders(appointmentId: number): Observable<AppointmentReminderDTO[]> {
    if (this.forceLocalCrud) {
      return of(this.getLocalReminders().filter((r) => r.appointmentId === appointmentId));
    }

    return this.http.get<AppointmentReminderDTO[]>(`${this.appointmentUrl}/${appointmentId}/reminders`);
  }

  scheduleAppointmentReminder(
    appointmentId: number,
    remindAt: string,
    channel: ReminderChannel = 'EMAIL',
    provider: ReminderProvider = this.defaultReminderProvider(channel)
  ): Observable<AppointmentReminderDTO> {
    const providerResolved = this.resolveReminderProviderForSend(channel, provider);
    if (this.forceLocalCrud) {
      const validation = this.validateReminderAgainstAppointment(appointmentId, remindAt);
      if (!validation.ok) {
        return throwError(() => new Error(validation.message));
      }

      const created = this.createLocalReminder({ appointmentId, remindAt, channel, provider: providerResolved, status: 'SCHEDULED' });
      const merged = [created, ...this.getLocalReminders().filter((r) => r.appointmentId !== appointmentId)];
      this.setLocalReminders([...merged]);
      return of(created);
    }

    return this.http.post<AppointmentReminderDTO>(`${this.appointmentUrl}/${appointmentId}/reminders/schedule`, {
      remindAt,
      channel,
      provider: providerResolved
    });
  }

  sendAppointmentReminder(
    appointmentId: number,
    channel: ReminderChannel = 'EMAIL',
    provider: ReminderProvider = this.defaultReminderProvider(channel)
  ): Observable<ReminderDeliveryResult> {
    return this.deliverAppointmentReminder(appointmentId, { channel, provider });
  }

  deliverAppointmentReminder(
    appointmentId: number,
    request: ReminderDeliveryRequest
  ): Observable<ReminderDeliveryResult> {
    const channel = request.channel || 'EMAIL';
    const provider = this.resolveReminderProviderForSend(channel, request.provider || this.defaultReminderProvider(channel));

    if (this.forceLocalCrud) {
      const now = new Date().toISOString();
      const rows = this.getLocalReminders();
      const hasRow = rows.some((r) => r.appointmentId === appointmentId);
      let next: AppointmentReminderDTO[];

      if (hasRow) {
        next = rows.map((r): AppointmentReminderDTO =>
          r.appointmentId === appointmentId
            ? {
                ...r,
                channel,
                provider,
                destination: request.destination || r.destination,
                templateId: request.templateId || r.templateId,
                status: 'SENT' as AppointmentReminderDTO['status'],
                sentAt: now,
                providerMessageId: `${provider.toLowerCase()}-${appointmentId}-${Date.now()}`
              }
            : r
        );
      } else {
        const created = this.createLocalReminder({
          appointmentId,
          remindAt: now,
          channel,
          provider,
          status: 'SENT',
          sentAt: now,
          providerMessageId: `${provider.toLowerCase()}-${appointmentId}-${Date.now()}`
        });
        next = [created, ...rows];
      }

      this.setLocalReminders(next);
      const msgId = `${provider.toLowerCase()}-${appointmentId}-${Date.now()}`;
      return of({
        success: true,
        provider,
        channel,
        providerMessageId: msgId,
        message: `Reminder recorded as sent (${channel} / ${provider}). Connect the API for real delivery.`
      });
    }

    return this.http
      .post<ReminderDeliveryResult>(`${this.integrationsUrl}/reminders/${appointmentId}/send`, {
        ...request,
        channel,
        provider
      })
      .pipe(
        catchError(() =>
          this.http.post<ReminderDeliveryResult>(`${this.appointmentUrl}/${appointmentId}/reminders/send`, {
            ...request,
            channel,
            provider
          })
        )
      );
  }

  private getLocalReminders(): AppointmentReminderDTO[] {
    try {
      const raw = localStorage.getItem(this.localRemindersKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((item) => ({
        id: item.id,
        appointmentId: item.appointmentId,
        remindAt: item.remindAt,
        channel: item.channel,
        provider: item.provider,
        destination: item.destination,
        templateId: item.templateId,
        status: item.status,
        sentAt: item.sentAt,
        providerMessageId: item.providerMessageId,
        failureReason: item.failureReason
      } as AppointmentReminderDTO)) : [];
    } catch {
      return [];
    }
  }

  private setLocalReminders(rows: AppointmentReminderDTO[]): void {
    try {
      localStorage.setItem(this.localRemindersKey, JSON.stringify(rows));
    } catch {
      // Ignore storage errors.
    }
  }

  private createLocalReminder(input: Partial<AppointmentReminderDTO>): AppointmentReminderDTO {
    const nextId = this.getLocalReminders().reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;
    return {
      id: nextId,
      appointmentId: this.readNumber(input.appointmentId) || 0,
      remindAt: this.readString(input.remindAt) || new Date().toISOString(),
      channel: this.readReminderChannel(input.channel),
      provider: this.readReminderProvider(input.provider) || this.defaultReminderProvider(input.channel),
      destination: this.readString(input.destination) || undefined,
      templateId: this.readString(input.templateId) || undefined,
      status: (input.status as AppointmentReminderDTO['status']) || 'SCHEDULED',
      sentAt: input.sentAt || undefined,
      providerMessageId: this.readString(input.providerMessageId) || undefined,
      failureReason: this.readString(input.failureReason) || undefined
    };
  }

  /**
   * Local NOTIFICATION reminders past due: mark SENT and return for UI (browser notification).
   */
  consumeDueInAppReminders(): AppointmentReminderDTO[] {
    if (!this.forceLocalCrud) {
      return [];
    }
    const now = Date.now();
    const rows = this.getLocalReminders();
    const due = rows.filter(
      (r) =>
        r.status === 'SCHEDULED' &&
        r.channel === 'NOTIFICATION' &&
        new Date(r.remindAt).getTime() <= now
    );
    if (due.length === 0) {
      return [];
    }
    const dueIds = new Set(
      due.map((r) => r.id).filter((id): id is number => typeof id === 'number' && id > 0)
    );
    const sentAt = new Date().toISOString();
    const next = rows.map((r) => {
      if (r.id != null && dueIds.has(r.id)) {
        return {
          ...r,
          status: 'SENT' as const,
          sentAt,
          providerMessageId: r.providerMessageId || `notification-${r.id}-${Date.now()}`
        };
      }
      return r;
    });
    this.setLocalReminders(next);
    return due;
  }

  // Teleconsultation
  getTeleconsultationSession(appointmentId: number): Observable<TeleconsultationSessionDTO> {
    if (this.forceLocalCrud) {
      const existing = this.getLocalTeleconsultationSessions().find((session) => session.appointmentId === appointmentId);
      return existing
        ? of(existing)
        : of({
            appointmentId,
            provider: 'JITSI',
            status: 'PENDING'
          });
    }

    return this.http.get<TeleconsultationSessionDTO>(`${this.appointmentUrl}/${appointmentId}/teleconsultation`);
  }

  startTeleconsultationSession(
    appointmentId: number,
    payload: Partial<TeleconsultationSessionDTO>,
    provider: VideoProvider = payload.provider || 'JITSI'
  ): Observable<TeleconsultationSessionDTO> {
    if (this.forceLocalCrud) {
      const session = this.createLocalTeleconsultationSession(appointmentId, provider, payload);
      this.setLocalTeleconsultationSessions([
        session,
        ...this.getLocalTeleconsultationSessions().filter((item) => item.appointmentId !== appointmentId)
      ]);
      return of(session);
    }

    return this.http
      .post<TeleconsultationSessionDTO>(`${this.integrationsUrl}/video/${provider.toLowerCase()}/${appointmentId}/start`, {
        ...payload,
        provider
      })
      .pipe(
        catchError(() =>
          this.http.post<TeleconsultationSessionDTO>(`${this.appointmentUrl}/${appointmentId}/teleconsultation/start`, {
            ...payload,
            provider
          })
        )
      );
  }

  joinTeleconsultationSession(appointmentId: number): Observable<TeleconsultationSessionDTO> {
    if (this.forceLocalCrud) {
      const existing = this.getLocalTeleconsultationSessions().find((session) => session.appointmentId === appointmentId)
        || this.createLocalTeleconsultationSession(appointmentId, 'JITSI', {});
      const session: TeleconsultationSessionDTO = { ...existing, status: 'LIVE' };
      this.setLocalTeleconsultationSessions([
        session,
        ...this.getLocalTeleconsultationSessions().filter((item) => item.appointmentId !== appointmentId)
      ]);
      return of(session);
    }

    return this.http.post<TeleconsultationSessionDTO>(`${this.appointmentUrl}/${appointmentId}/teleconsultation/join`, {});
  }

  syncAppointmentCalendar(
    appointmentId: number,
    provider: CalendarProvider = 'GOOGLE',
    request: Partial<CalendarSyncRequest> = {}
  ): Observable<CalendarSyncResult> {
    const payload: CalendarSyncRequest = {
      provider,
      sendUpdates: request.sendUpdates !== false
    };

    if (this.forceLocalCrud) {
      const appointment = this.getLocalAppointments().find((item) => item.id === appointmentId);
      const result: CalendarSyncResult = {
        appointmentId,
        provider,
        synced: !!appointment,
        externalEventId: appointment ? `${provider.toLowerCase()}-${appointmentId}-${Date.now()}` : undefined,
        calendarLink: appointment ? this.buildLocalCalendarLink(appointment, provider) : undefined,
        message: appointment
          ? `${provider} calendar sync prepared locally. Backend OAuth integration can publish it.`
          : 'Appointment not found.'
      };
      this.setLocalCalendarSyncResults([
        result,
        ...this.getLocalCalendarSyncResults().filter((item) => item.appointmentId !== appointmentId || item.provider !== provider)
      ]);
      return of(result);
    }

    return this.http
      .post<CalendarSyncResult>(`${this.integrationsUrl}/calendar/${provider.toLowerCase()}/appointments/${appointmentId}/sync`, payload)
      .pipe(
        catchError(() =>
          this.http.post<CalendarSyncResult>(`${this.appointmentUrl}/${appointmentId}/calendar/sync`, payload)
        )
      );
  }

  detectAvailabilityConflicts(
    appointment: Partial<AppointmentDTO>,
    excludeAppointmentId?: number
  ): Observable<AvailabilityConflict[]> {
    if (!this.forceLocalCrud) {
      return this.http
        .post<AvailabilityConflict[]>(`${this.appointmentUrl}/availability-conflicts`, {
          appointment,
          excludeAppointmentId
        })
        .pipe(catchError(() => of(this.detectLocalAvailabilityConflicts(appointment, excludeAppointmentId))));
    }

    return of(this.detectLocalAvailabilityConflicts(appointment, excludeAppointmentId));
  }

  findBestAppointmentMatches(request: AppointmentMatchRequest): Observable<AppointmentMatchCandidate[]> {
    if (!this.forceLocalCrud) {
      return this.http
        .post<AppointmentMatchCandidate[]>(`${this.appointmentUrl}/matching/recommendations`, request)
        .pipe(catchError(() => of(this.findLocalBestAppointmentMatches(request))));
    }

    return of(this.findLocalBestAppointmentMatches(request));
  }

  private detectLocalAvailabilityConflicts(
    appointment: Partial<AppointmentDTO>,
    excludeAppointmentId?: number
  ): AvailabilityConflict[] {
    const doctorId = this.readNumber(appointment.doctorId);
    const patientId = this.readNumber(appointment.patientId);
    const start = this.parseDate(appointment.startTime);
    const end = this.parseDate(appointment.endTime);
    const urgent = appointment.urgent === true;

    if (!doctorId || !patientId || !start || !end) {
      return [];
    }

    if (end <= start) {
      return [
        {
          type: 'INVALID_DURATION',
          severity: 'BLOCKER',
          message: 'Appointment end must be after the start.'
        }
      ];
    }

    const durationMin = this.minutesBetween(start, end);
    if (durationMin < this.minConsultationMinutes) {
      return [
        {
          type: 'INVALID_DURATION',
          severity: 'BLOCKER',
          message: `Minimum consultation length: ${this.minConsultationMinutes} minutes.`
        }
      ];
    }

    if (durationMin > this.maxConsultationMinutes) {
      return [
        {
          type: 'INVALID_DURATION',
          severity: 'BLOCKER',
          message: `Maximum allowed length: ${this.maxConsultationMinutes} minutes (check if an extended slot is needed).`
        }
      ];
    }

    const conflicts: AvailabilityConflict[] = [];
    const now = new Date();
    const minLeadMs = (urgent ? this.minLeadMinutesUrgent : this.minLeadMinutesStandard) * 60 * 1000;
    if (start.getTime() - now.getTime() < minLeadMs) {
      conflicts.push({
        type: 'LEAD_TIME_VIOLATION',
        severity: 'BLOCKER',
        message: urgent
          ? `Minimum lead time before appointment (urgent): ${this.minLeadMinutesUrgent} minutes.`
          : `Minimum lead time before appointment: ${this.minLeadMinutesStandard} minutes (mark “urgent” for shorter lead if policy allows).`
      });
    }

    const appointments = this.getLocalAppointments().filter(
      (item) => item.id !== excludeAppointmentId && this.isAppointmentBlockingSchedule(item, now)
    );

    const bufferMs = this.turnaroundBufferMinutes * 60 * 1000;

    appointments.forEach((item) => {
      const itemStart = this.parseDate(item.startTime);
      const itemEnd = this.parseDate(item.endTime);
      if (!itemStart || !itemEnd) {
        return;
      }

      if (this.rangesOverlap(start, end, itemStart, itemEnd)) {
        if (item.doctorId === doctorId) {
          conflicts.push({
            type: 'DOCTOR_OVERLAP',
            severity: 'BLOCKER',
            message: `Doctor #${doctorId} already has an appointment overlapping this slot.`,
            conflictingAppointmentId: item.id
          });
        }

        if (item.patientId === patientId) {
          conflicts.push({
            type: 'PATIENT_OVERLAP',
            severity: 'BLOCKER',
            message: `Patient #${patientId} already has an appointment overlapping this slot.`,
            conflictingAppointmentId: item.id
          });
        }
      }

      if (item.doctorId === doctorId) {
        const tooSoonAfter =
          start.getTime() >= itemEnd.getTime() && start.getTime() < itemEnd.getTime() + bufferMs;
        const tooCloseBeforeNext =
          end.getTime() <= itemStart.getTime() && end.getTime() > itemStart.getTime() - bufferMs;
        if (tooSoonAfter || tooCloseBeforeNext) {
          conflicts.push({
            type: 'TURNAROUND_VIOLATION',
            severity: 'WARNING',
            message: `Allow at least ${this.turnaroundBufferMinutes} minutes between two visits with the same doctor (room, documentation, turnover).`,
            conflictingAppointmentId: item.id
          });
        }
      }
    });

    const doctorAvailabilities = this.getLocalAvailabilities().filter((slot) => slot.doctorId === doctorId);
    const nonBlockedWindows = doctorAvailabilities.filter((s) => !s.blocked);
    const matchingAvailability = nonBlockedWindows.find((slot) => {
      const slotStart = this.parseDate(slot.startTime);
      const slotEnd = this.parseDate(slot.endTime);
      return !!slotStart && !!slotEnd && start >= slotStart && end <= slotEnd;
    });

    const blockedAvailability = doctorAvailabilities.find((slot) => {
      const slotStart = this.parseDate(slot.startTime);
      const slotEnd = this.parseDate(slot.endTime);
      return slot.blocked === true && !!slotStart && !!slotEnd && this.rangesOverlap(start, end, slotStart, slotEnd);
    });

    if (blockedAvailability) {
      conflicts.push({
        type: 'BLOCKED_AVAILABILITY',
        severity: 'BLOCKER',
        message: `Doctor #${doctorId} marked this window as unavailable.`,
        availabilityId: blockedAvailability.id
      });
    }

    if (nonBlockedWindows.length > 0 && !matchingAvailability) {
      conflicts.push({
        type: 'OUTSIDE_AVAILABILITY',
        severity: 'WARNING',
        message: `The requested slot is outside published availability for doctor #${doctorId} (may require an override).`
      });
    }

    if (matchingAvailability) {
      const capacity = Math.max(1, matchingAvailability.maxAppointments || 1);
      const concurrentBookings = appointments.filter((item) => {
        const itemStart = this.parseDate(item.startTime);
        const itemEnd = this.parseDate(item.endTime);
        return item.doctorId === doctorId && !!itemStart && !!itemEnd && this.rangesOverlap(start, end, itemStart, itemEnd);
      }).length;

      if (concurrentBookings >= capacity) {
        conflicts.push({
          type: 'CAPACITY_EXCEEDED',
          severity: 'BLOCKER',
          message: `Slot capacity reached (${concurrentBookings}/${capacity} concurrent appointments).`,
          availabilityId: matchingAvailability.id
        });
      }
    }

    return conflicts;
  }

  private isAppointmentBlockingSchedule(item: AppointmentDTO, now: Date): boolean {
    if (item.status === 'CANCELLED' || item.status === 'NO_SHOW' || item.status === 'COMPLETED') {
      return false;
    }

    const itemEnd = this.parseDate(item.endTime);
    if (itemEnd && itemEnd.getTime() <= now.getTime()) {
      return false;
    }

    return true;
  }

  private static readonly APPOINTMENT_REMINDER_MIN_HOURS_BEFORE_VISIT = 24;

  /** Local demo: scheduled reminder must be in the future and ≥24h before visit; use Send now for immediate. */
  private validateReminderAgainstAppointment(
    appointmentId: number,
    remindAt: string
  ): { ok: true } | { ok: false; message: string } {
    const at = this.parseDate(remindAt);
    if (!at) {
      return { ok: false, message: 'Invalid reminder date/time.' };
    }

    const now = new Date();
    if (at.getTime() <= now.getTime()) {
      return {
        ok: false,
        message: 'The reminder must be scheduled in the future (your browser local date/time).'
      };
    }

    const appt = this.getLocalAppointments().find((a) => a.id === appointmentId);
    const start = appt ? this.parseDate(appt.startTime) : null;
    if (!start) {
      return {
        ok: false,
        message: 'This appointment is not in local data — refresh the list or schedule again after the list loads.'
      };
    }

    const minMsBeforeVisit =
      AppointmentService.APPOINTMENT_REMINDER_MIN_HOURS_BEFORE_VISIT * 60 * 60 * 1000;
    const leadMs = start.getTime() - at.getTime();

    if (leadMs < minMsBeforeVisit) {
      const hoursUntilVisit = (start.getTime() - now.getTime()) / (60 * 60 * 1000);
      if (hoursUntilVisit < AppointmentService.APPOINTMENT_REMINDER_MIN_HOURS_BEFORE_VISIT) {
        return {
          ok: false,
          message:
            `The visit is in less than ${AppointmentService.APPOINTMENT_REMINDER_MIN_HOURS_BEFORE_VISIT} hours — you cannot schedule a compliant advance reminder. Use "Send now" for an immediate reminder.`
        };
      }
      const latestOk = new Date(start.getTime() - minMsBeforeVisit);
      return {
        ok: false,
        message: `Pick a "Send at" time at least ${AppointmentService.APPOINTMENT_REMINDER_MIN_HOURS_BEFORE_VISIT} hours before the visit (no later than ${latestOk.toLocaleString()} local).`
      };
    }

    return { ok: true };
  }

  private filterLocalUpcoming(doctorKeyword?: string, windowMinutes?: number): AppointmentDTO[] {
    const window = Math.max(1, windowMinutes ?? 60 * 24 * 7);
    const now = new Date();
    const horizon = new Date(now.getTime() + window * 60 * 1000);
    const keyword = (doctorKeyword || '').trim().toLowerCase();

    return this.getLocalAppointments()
      .map((row) => this.normalizeAppointment(row))
      .filter((a) => {
        const start = this.parseDate(a.startTime);
        if (!start || start < now || start > horizon) {
          return false;
        }
        if (a.status === 'CANCELLED' || a.status === 'NO_SHOW') {
          return false;
        }
        return true;
      })
      .filter((a) => {
        if (!keyword) {
          return true;
        }
        return String(a.doctorId).includes(keyword) || (a.reasonForVisit || '').toLowerCase().includes(keyword);
      })
      .sort((a, b) => {
        const ta = new Date(a.startTime).getTime();
        const tb = new Date(b.startTime).getTime();
        return ta - tb;
      });
  }

  private filterLocalSearch(filters: {
    doctorId?: number;
    patientKeyword?: string;
    reasonKeyword?: string;
  }): AppointmentDTO[] {
    const patientKw = (filters.patientKeyword || '').trim().toLowerCase();
    const reasonKw = (filters.reasonKeyword || '').trim().toLowerCase();

    return this.getLocalAppointments()
      .map((row) => this.normalizeAppointment(row))
      .filter((a) => {
        if (filters.doctorId != null && filters.doctorId > 0 && a.doctorId !== filters.doctorId) {
          return false;
        }
        if (patientKw && !String(a.patientId).includes(patientKw)) {
          return false;
        }
        if (reasonKw && !(a.reasonForVisit || '').toLowerCase().includes(reasonKw)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  private findLocalBestAppointmentMatches(request: AppointmentMatchRequest): AppointmentMatchCandidate[] {
    const requestedStart = this.parseDate(request.desiredStartTime);
    const requestedEnd = this.parseDate(request.desiredEndTime);
    const now = new Date();
    const consultationType = this.readConsultationType(request.consultationType);

    return this.getLocalAvailabilities()
      .filter((slot) => !slot.blocked)
      .map((slot): AppointmentMatchCandidate | null => {
        const slotStart = this.parseDate(slot.startTime);
        const slotEnd = this.parseDate(slot.endTime);
        if (!slotStart || !slotEnd || slotEnd <= now) {
          return null;
        }

        const candidateStart = requestedStart && requestedStart > slotStart && requestedStart < slotEnd
          ? requestedStart
          : slotStart;
        const candidateEnd = requestedEnd && requestedEnd > candidateStart && requestedEnd <= slotEnd
          ? requestedEnd
          : new Date(candidateStart.getTime() + Math.min(60, this.minutesBetween(candidateStart, slotEnd)) * 60 * 1000);

        const conflicts = this.detectLocalAvailabilityConflicts({
          doctorId: slot.doctorId,
          patientId: request.patientId || 0,
          startTime: candidateStart.toISOString(),
          endTime: candidateEnd.toISOString(),
          consultationType
        });

        const reasons: string[] = [];
        let score = 50;

        if (request.preferredDoctorId && slot.doctorId === request.preferredDoctorId) {
          score += 20;
          reasons.push('Preferred doctor match');
        }

        if (request.urgent) {
          const waitHours = Math.max(0, (candidateStart.getTime() - now.getTime()) / 36e5);
          const urgencyBoost = Math.max(0, 25 - Math.min(25, waitHours));
          score += urgencyBoost;
          reasons.push('Urgency favors earlier availability');
        }

        if (requestedStart) {
          const distanceHours = Math.abs(candidateStart.getTime() - requestedStart.getTime()) / 36e5;
          score += Math.max(0, 18 - Math.min(18, distanceHours * 2));
          reasons.push('Close to requested time');
        }

        const capacity = Math.max(1, slot.maxAppointments || 1);
        const nowForMatch = new Date();
        const occupancy = this.getLocalAppointments().filter((item) => {
          const itemStart = this.parseDate(item.startTime);
          const itemEnd = this.parseDate(item.endTime);
          return (
            item.doctorId === slot.doctorId
            && this.isAppointmentBlockingSchedule(item, nowForMatch)
            && !!itemStart
            && !!itemEnd
            && this.rangesOverlap(candidateStart, candidateEnd, itemStart, itemEnd)
          );
        }).length;
        score -= Math.min(20, Math.round((occupancy / capacity) * 20));

        const blockers = conflicts.filter((c) => c.severity === 'BLOCKER');
        if (blockers.length > 0) {
          return null;
        }

        score += 10;
        reasons.push('No blocking conflicts');
        const warnings = conflicts.filter((c) => c.severity === 'WARNING');
        if (warnings.length > 0) {
          score -= Math.min(15, warnings.length * 5);
          reasons.push('Warnings (availability or sequencing)');
        }

        const boundedScore = Math.max(0, Math.min(100, Math.round(score)));
        return {
          doctorId: slot.doctorId,
          startTime: candidateStart.toISOString(),
          endTime: candidateEnd.toISOString(),
          consultationType,
          score: boundedScore,
          confidence: boundedScore >= 75 ? 'HIGH' : boundedScore >= 50 ? 'MEDIUM' : 'LOW',
          reasons,
          conflicts
        };
      })
      .filter((candidate): candidate is AppointmentMatchCandidate => !!candidate)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }

  private getLocalTeleconsultationSessions(): TeleconsultationSessionDTO[] {
    try {
      const raw = localStorage.getItem(this.localTeleconsultationKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeTeleconsultationSession(item)) : [];
    } catch {
      return [];
    }
  }

  private setLocalTeleconsultationSessions(rows: TeleconsultationSessionDTO[]): void {
    try {
      localStorage.setItem(this.localTeleconsultationKey, JSON.stringify(rows));
    } catch {
      // Ignore storage errors.
    }
  }

  private createLocalTeleconsultationSession(
    appointmentId: number,
    provider: VideoProvider,
    payload: Partial<TeleconsultationSessionDTO>
  ): TeleconsultationSessionDTO {
    const roomId = payload.roomId || `medicare-${appointmentId}`;
    return {
      appointmentId,
      provider,
      roomId,
      meetingLink: payload.meetingLink || this.buildVideoMeetingLink(provider, roomId),
      startsAt: payload.startsAt || new Date().toISOString(),
      endsAt: payload.endsAt,
      status: 'LIVE'
    };
  }

  private normalizeTeleconsultationSession(value: unknown): TeleconsultationSessionDTO {
    const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
      appointmentId: this.readNumber(source['appointmentId']) || 0,
      provider: this.readVideoProvider(source['provider']),
      roomId: this.readString(source['roomId']) || undefined,
      meetingLink: this.readString(source['meetingLink']) || undefined,
      startsAt: this.readString(source['startsAt']) || undefined,
      endsAt: this.readString(source['endsAt']) || undefined,
      status: this.readTeleconsultationStatus(source['status'])
    };
  }

  private getLocalCalendarSyncResults(): CalendarSyncResult[] {
    try {
      const raw = localStorage.getItem(this.localCalendarSyncKey);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed as CalendarSyncResult[] : [];
    } catch {
      return [];
    }
  }

  private setLocalCalendarSyncResults(rows: CalendarSyncResult[]): void {
    try {
      localStorage.setItem(this.localCalendarSyncKey, JSON.stringify(rows));
    } catch {
      // Ignore storage errors.
    }
  }

  private normalizeAppointmentList(response: unknown): AppointmentDTO[] {
    return this.extractArrayResponse(response)
      .map((row) => this.normalizeAppointment(row))
      .filter((appointment) => !!appointment.doctorId && !!appointment.patientId && !!appointment.startTime);
  }

  private normalizeAppointment(response: unknown): AppointmentDTO {
    if (!response || typeof response !== 'object') {
      return {
        doctorId: 0,
        patientId: 0,
        startTime: '',
        endTime: '',
        consultationType: 'IN_PERSON'
      };
    }

    const source = response as Record<string, unknown>;
    const startTime =
      this.readString(source['startTime']) ||
      this.readString(source['appointmentDate']);
    const normalizedStart = this.normalizeDateTimeString(startTime);
    const endTimeRaw =
      this.readString(source['endTime']) ||
      this.readString(source['appointmentEndDate']);

    const doctorId = this.extractParticipantId(source, 'doctor');
    const patientId = this.extractParticipantId(source, 'patient');

    return {
      id: this.readNumber(source['id']) || undefined,
      doctorId,
      patientId,
      startTime: normalizedStart,
      endTime: this.normalizeDateTimeString(endTimeRaw) || this.estimateEndTime(normalizedStart),
      consultationType: this.readConsultationType(source['consultationType']),
      reasonForVisit: this.readString(source['reasonForVisit']) || this.readString(source['reason']) || undefined,
      timeZone: this.readString(source['timeZone']) || undefined,
      urgent: source['urgent'] === true,
      status: this.readStatus(source['status'])
    };
  }

  /** Spring returns nested {@code patient} / {@code doctor} users; some payloads use flat ids. */
  private extractParticipantId(
    source: Record<string, unknown>,
    role: 'patient' | 'doctor'
  ): number {
    const flatKey = role === 'patient' ? 'patientId' : 'doctorId';
    const flat = this.readNumber(source[flatKey]) ?? 0;
    if (flat > 0) {
      return flat;
    }
    const nested = source[role];
    if (nested && typeof nested === 'object') {
      const id = this.readNumber((nested as Record<string, unknown>)['id']) ?? 0;
      if (id > 0) {
        return id;
      }
    }
    return 0;
  }

  private normalizeAvailabilityList(response: unknown): AvailabilityDTO[] {
    const rows = this.extractArrayResponse(response);

    return rows
      .filter((row) => row && typeof row === 'object')
      .map((row) => {
        const source = row as Record<string, unknown>;
        const dateValue = this.readString(source['date']);
        const startValue = this.readString(source['startTime']);
        const endValue = this.readString(source['endTime']);

        const normalizedStart = this.combineDateTime(dateValue, startValue);
        const normalizedEnd = this.combineDateTime(dateValue, endValue);
        const available = source['available'];

        return {
          id: this.readNumber(source['id']),
          doctorId: this.readNumber(source['doctorId']) || 0,
          startTime: normalizedStart,
          endTime: normalizedEnd,
          blocked: available === false ? true : source['blocked'] === true,
          maxAppointments: this.readNumber(source['maxAppointments']) || 1
        } as AvailabilityDTO;
      })
      .filter((slot) => slot.doctorId > 0 && !!slot.startTime && !!slot.endTime);
  }

  private extractArrayResponse(response: unknown): unknown[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && typeof response === 'object') {
      const source = response as Record<string, unknown>;
      if (Array.isArray(source['content'])) {
        return source['content'];
      }
      if (Array.isArray(source['data'])) {
        return source['data'];
      }
      if (Array.isArray(source['availabilities'])) {
        return source['availabilities'];
      }
    }

    return [];
  }

  private toBackendAppointmentBody(input: Partial<AppointmentDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    const doctorId = this.readNumber(input.doctorId);
    if (doctorId) {
      body['doctorId'] = doctorId;
    }

    const patientId = this.readNumber(input.patientId);
    if (patientId) {
      body['patientId'] = patientId;
    }

    const startTime = this.readString(input.startTime);
    if (startTime) {
      const normalizedStart = this.normalizeDateTimeString(startTime);
      body['appointmentDate'] = normalizedStart;
      // Keep compatibility if backend still accepts these fields.
      body['startTime'] = normalizedStart;
    }

    const endTime = this.readString(input.endTime);
    if (endTime) {
      body['endTime'] = this.normalizeDateTimeString(endTime);
    }

    const consultationType = this.readConsultationType(input.consultationType);
    if (consultationType) {
      body['consultationType'] = consultationType;
    }

    const reasonForVisit = this.readString(input.reasonForVisit);
    if (reasonForVisit) {
      body['reason'] = reasonForVisit;
      body['reasonForVisit'] = reasonForVisit;
    }

    const status = this.readStatus(input.status);
    if (status) {
      body['status'] = status;
    }

    const timeZone = this.readString(input.timeZone);
    if (timeZone) {
      body['timeZone'] = timeZone;
    }

    if (typeof input.urgent === 'boolean') {
      body['urgent'] = input.urgent;
    }

    return body;
  }

  private normalizeDateTimeString(value: string): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }

    const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}$/);
    if (dateOnly) {
      return `${value}T00:00:00.000Z`;
    }

    const dateTimeNoZone = value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/);
    if (dateTimeNoZone) {
      return value.length === 16 ? `${value}:00` : value;
    }

    return value;
  }

  private estimateEndTime(startTime: string): string {
    const parsed = new Date(startTime);
    if (Number.isNaN(parsed.getTime())) {
      return startTime;
    }

    return new Date(parsed.getTime() + 60 * 60 * 1000).toISOString();
  }

  private readConsultationType(value: unknown): AppointmentDTO['consultationType'] {
    const normalized = this.readString(value).toUpperCase();
    if (normalized === 'VIDEO' || normalized === 'PHONE') {
      return normalized;
    }

    return 'IN_PERSON';
  }

  private readStatus(value: unknown): AppointmentDTO['status'] | undefined {
    const normalized = this.readString(value).toUpperCase();
    if (normalized === 'SCHEDULED' || normalized === 'COMPLETED' || normalized === 'CANCELLED' || normalized === 'NO_SHOW') {
      return normalized;
    }
    /** Backend persists {@code PENDING} / {@code CONFIRMED}; UI filters expect scheduled-like states. */
    if (normalized === 'PENDING' || normalized === 'CONFIRMED') {
      return 'SCHEDULED';
    }

    return undefined;
  }

  private readReminderChannel(value: unknown): ReminderChannel {
    const normalized = this.readString(value).toUpperCase();
    if (normalized === 'SMS' || normalized === 'PUSH' || normalized === 'NOTIFICATION') {
      return normalized as ReminderChannel;
    }

    return 'EMAIL';
  }

  private readReminderProvider(value: unknown): ReminderProvider | undefined {
    const normalized = this.readString(value).toUpperCase();
    if (normalized === 'SENDGRID' || normalized === 'TWILIO' || normalized === 'LOCAL') {
      return normalized;
    }

    return undefined;
  }

  private defaultReminderProvider(channel: unknown): ReminderProvider {
    const normalizedChannel = this.readReminderChannel(channel);
    if (normalizedChannel === 'SMS') {
      return 'TWILIO';
    }

    if (normalizedChannel === 'EMAIL') {
      return 'LOCAL';
    }

    if (normalizedChannel === 'NOTIFICATION') {
      return 'LOCAL';
    }

    return 'LOCAL';
  }

  /** Email is sent via Spring Mail only (e.g. Gmail SMTP); never SendGrid from this app. */
  private resolveReminderProviderForSend(channel: ReminderChannel, provider: ReminderProvider): ReminderProvider {
    if (channel === 'EMAIL') {
      return 'LOCAL';
    }
    if (channel === 'SMS') {
      return 'TWILIO';
    }
    return provider || 'LOCAL';
  }

  private readVideoProvider(value: unknown): VideoProvider {
    const normalized = this.readString(value).toUpperCase();
    if (normalized === 'AGORA' || normalized === 'ZOOM') {
      return normalized;
    }

    return 'JITSI';
  }

  private readTeleconsultationStatus(value: unknown): TeleconsultationSessionDTO['status'] {
    const normalized = this.readString(value).toUpperCase();
    if (normalized === 'LIVE' || normalized === 'ENDED') {
      return normalized;
    }

    return 'PENDING';
  }

  private parseDate(value: unknown): Date | null {
    const text = this.readString(value);
    if (!text) {
      return null;
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date): boolean {
    return startA < endB && endA > startB;
  }

  private minutesBetween(start: Date, end: Date): number {
    return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  }

  private buildVideoMeetingLink(provider: VideoProvider, roomId: string): string {
    const encodedRoom = encodeURIComponent(roomId);
    if (provider === 'ZOOM') {
      return `https://zoom.us/j/${encodedRoom}`;
    }

    if (provider === 'AGORA') {
      return `https://app.agora.io/${encodedRoom}`;
    }

    return `https://meet.jit.si/${encodedRoom}`;
  }

  private buildLocalCalendarLink(appointment: AppointmentDTO, provider: CalendarProvider): string {
    const start = appointment.startTime.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const end = appointment.endTime.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const title = encodeURIComponent(`MediCareAI appointment #${appointment.id || ''}`.trim());
    const details = encodeURIComponent(appointment.reasonForVisit || 'Medical appointment');

    if (provider === 'OUTLOOK') {
      return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${encodeURIComponent(appointment.startTime)}&enddt=${encodeURIComponent(appointment.endTime)}&body=${details}`;
    }

    if (provider === 'ICS') {
      return `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ADTSTART:${start}%0ADTEND:${end}%0ASUMMARY:${title}%0ADESCRIPTION:${details}%0AEND:VEVENT%0AEND:VCALENDAR`;
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  private combineDateTime(dateValue: string, timeOrDateValue: string): string {
    if (!timeOrDateValue) {
      return '';
    }

    const fullDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;
    if (fullDateTimePattern.test(timeOrDateValue)) {
      return timeOrDateValue.length === 16 ? `${timeOrDateValue}:00` : timeOrDateValue;
    }

    const timePattern = /^\d{2}:\d{2}(:\d{2})?$/;
    if (dateValue && timePattern.test(timeOrDateValue)) {
      return `${dateValue}T${timeOrDateValue.length === 5 ? `${timeOrDateValue}:00` : timeOrDateValue}`;
    }

    return timeOrDateValue;
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private readNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private toAvailabilityRequestBody(input: Partial<AvailabilityDTO>): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    if (typeof input.doctorId === 'number' && Number.isFinite(input.doctorId)) {
      body['doctorId'] = input.doctorId;
    }

    const normalizedDate = this.normalizeDateString(input.startTime);
    if (normalizedDate) {
      body['date'] = normalizedDate;
    }

    if (typeof input.startTime === 'string' && input.startTime.trim()) {
      body['startTime'] = this.normalizeTimeString(input.startTime);
    }

    if (typeof input.endTime === 'string' && input.endTime.trim()) {
      body['endTime'] = this.normalizeTimeString(input.endTime);
    }

    if (typeof input.maxAppointments === 'number' && Number.isFinite(input.maxAppointments)) {
      body['maxAppointments'] = Math.max(1, Math.trunc(input.maxAppointments));
    }

    // Backend AvailabilityDTO expects `available` primitive boolean.
    body['available'] = input.blocked !== true;

    return body;
  }

  private normalizeTimeString(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      const timeMatch = value.match(/(\d{2}:\d{2})(:\d{2})?/);
      if (timeMatch) {
        return `${timeMatch[1]}${timeMatch[2] || ':00'}`;
      }

      return value;
    }

    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const seconds = String(parsed.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private normalizeDateString(value: string | undefined): string | null {
    if (!value || !value.trim()) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      const dateMatch = value.match(/\d{4}-\d{2}-\d{2}/);
      return dateMatch ? dateMatch[0] : null;
    }

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

