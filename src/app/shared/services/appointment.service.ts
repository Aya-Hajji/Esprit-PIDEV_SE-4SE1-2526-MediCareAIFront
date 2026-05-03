import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  AppointmentDTO,
  AppointmentReminderDTO,
  AvailabilityDTO,
  TeleconsultationSessionDTO
} from '../models/appointment.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private appointmentUrl = `${this.baseUrl}/appointments`;
  private availabilityUrl = `${this.baseUrl}/availabilities`;

  constructor(private http: HttpClient) {}

  // Appointments
  getAllAppointments(): Observable<AppointmentDTO[]> {
    return this.http.get<AppointmentDTO[]>(this.appointmentUrl);
  }

  getAppointmentById(id: number): Observable<AppointmentDTO> {
    return this.http.get<AppointmentDTO>(`${this.appointmentUrl}/${id}`);
  }

  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.appointmentUrl}/me`);
  }

  getPatientAppointments(patientId: number): Observable<AppointmentDTO[]> {
    return this.http.get<AppointmentDTO[]>(`${this.appointmentUrl}/patient/${patientId}`);
  }

  getDoctorAppointments(doctorId: number): Observable<AppointmentDTO[]> {
    return this.http.get<AppointmentDTO[]>(`${this.appointmentUrl}/doctor/${doctorId}`);
  }

  createAppointment(appointment: AppointmentDTO): Observable<AppointmentDTO> {
    return this.http.post<AppointmentDTO>(this.appointmentUrl, appointment);
  }

  updateAppointment(id: number, appointment: Partial<AppointmentDTO>): Observable<AppointmentDTO> {
    return this.http.put<AppointmentDTO>(`${this.appointmentUrl}/${id}`, appointment);
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.appointmentUrl}/${id}`);
  }

  cancelAppointment(id: number): Observable<void> {
    return this.deleteAppointment(id);
  }

  markAsNoShow(id: number): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.appointmentUrl}/${id}/no-show`, {});
  }

  // Doctor Availability
  getDoctorAvailability(doctorId: number): Observable<AvailabilityDTO[]> {
    return this.http.get<AvailabilityDTO[]>(`${this.availabilityUrl}/doctor/${doctorId}`);
  }

  getAvailableDoctorAvailability(doctorId: number): Observable<AvailabilityDTO[]> {
    return this.http.get<AvailabilityDTO[]>(`${this.availabilityUrl}/doctor/${doctorId}/available`);
  }

  createAvailability(availability: AvailabilityDTO): Observable<AvailabilityDTO> {
    return this.http.post<AvailabilityDTO>(this.availabilityUrl, availability);
  }

  updateAvailability(id: number, availability: Partial<AvailabilityDTO>): Observable<AvailabilityDTO> {
    return this.http.put<AvailabilityDTO>(`${this.availabilityUrl}/${id}`, availability);
  }

  deleteAvailability(id: number): Observable<void> {
    return this.http.delete<void>(`${this.availabilityUrl}/${id}`);
  }

  // Reminders
  getAppointmentReminders(appointmentId: number): Observable<AppointmentReminderDTO[]> {
    return this.http.get<AppointmentReminderDTO[]>(`${this.appointmentUrl}/${appointmentId}/reminders`);
  }

  scheduleAppointmentReminder(
    appointmentId: number,
    remindAt: string,
    channel: 'EMAIL' | 'SMS' | 'PUSH' = 'EMAIL'
  ): Observable<AppointmentReminderDTO> {
    return this.http.post<AppointmentReminderDTO>(`${this.appointmentUrl}/${appointmentId}/reminders/schedule`, {
      remindAt,
      channel
    });
  }

  sendAppointmentReminder(
    appointmentId: number,
    channel: 'EMAIL' | 'SMS' | 'PUSH' = 'EMAIL'
  ): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.appointmentUrl}/${appointmentId}/reminders/send`, {
      channel
    });
  }

  // Teleconsultation
  getTeleconsultationSession(appointmentId: number): Observable<TeleconsultationSessionDTO> {
    return this.http.get<TeleconsultationSessionDTO>(`${this.appointmentUrl}/${appointmentId}/teleconsultation`);
  }

  startTeleconsultationSession(
    appointmentId: number,
    payload: Partial<TeleconsultationSessionDTO>
  ): Observable<TeleconsultationSessionDTO> {
    return this.http.post<TeleconsultationSessionDTO>(`${this.appointmentUrl}/${appointmentId}/teleconsultation/start`, payload);
  }

  joinTeleconsultationSession(appointmentId: number): Observable<TeleconsultationSessionDTO> {
    return this.http.post<TeleconsultationSessionDTO>(`${this.appointmentUrl}/${appointmentId}/teleconsultation/join`, {});
  }
}
