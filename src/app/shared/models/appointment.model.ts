export interface Appointment {
  id?: number;
  doctorId: number;
  patientId: number;
  startTime: string;
  endTime: string;
  consultationType: 'IN_PERSON' | 'VIDEO' | 'PHONE';
  reasonForVisit?: string;
  timeZone?: string;
  urgent?: boolean;
  status?: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
}

export interface AppointmentDTO extends Appointment {}

export interface DoctorAvailability {
  id?: number;
  doctorId: number;
  startTime: string;
  endTime: string;
  blocked?: boolean;
  maxAppointments?: number;
}

export interface AvailabilityDTO extends DoctorAvailability {}

export interface AppointmentReminderDTO {
  id?: number;
  appointmentId: number;
  remindAt: string;
  channel?: 'EMAIL' | 'SMS' | 'PUSH';
  status?: 'SCHEDULED' | 'SENT' | 'FAILED';
  sentAt?: string;
}

export interface TeleconsultationSessionDTO {
  appointmentId: number;
  roomId?: string;
  meetingLink?: string;
  startsAt?: string;
  endsAt?: string;
  status?: 'PENDING' | 'LIVE' | 'ENDED';
}
