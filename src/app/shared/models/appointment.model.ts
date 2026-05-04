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

/** NOTIFICATION = in-app / browser reminder (no real email/SMS in local demo). */
export type ReminderChannel = 'EMAIL' | 'SMS' | 'PUSH' | 'NOTIFICATION';
/** `LOCAL` = Spring Mail (`spring.mail.*`), e.g. Gmail SMTP. `SENDGRID` may still appear when parsing older API payloads. */
export type ReminderProvider = 'SENDGRID' | 'TWILIO' | 'LOCAL';
export type CalendarProvider = 'GOOGLE' | 'OUTLOOK' | 'ICS';
export type VideoProvider = 'JITSI' | 'AGORA' | 'ZOOM';

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
  channel?: ReminderChannel;
  provider?: ReminderProvider;
  destination?: string;
  templateId?: string;
  status?: 'SCHEDULED' | 'SENT' | 'FAILED';
  sentAt?: string;
  providerMessageId?: string;
  failureReason?: string;
}

export interface TeleconsultationSessionDTO {
  appointmentId: number;
  provider?: VideoProvider;
  roomId?: string;
  meetingLink?: string;
  startsAt?: string;
  endsAt?: string;
  status?: 'PENDING' | 'LIVE' | 'ENDED';
}

export interface ReminderDeliveryRequest {
  channel: ReminderChannel;
  provider?: ReminderProvider;
  destination?: string;
  templateId?: string;
  message?: string;
}

export interface ReminderDeliveryResult {
  success: boolean;
  provider: ReminderProvider;
  channel: ReminderChannel;
  providerMessageId?: string;
  message?: string;
}

export interface CalendarSyncRequest {
  provider: CalendarProvider;
  sendUpdates?: boolean;
}

export interface CalendarSyncResult {
  appointmentId: number;
  provider: CalendarProvider;
  synced: boolean;
  externalEventId?: string;
  calendarLink?: string;
  message?: string;
}

export interface AvailabilityConflict {
  type:
    | 'DOCTOR_OVERLAP'
    | 'PATIENT_OVERLAP'
    | 'OUTSIDE_AVAILABILITY'
    | 'BLOCKED_AVAILABILITY'
    | 'CAPACITY_EXCEEDED'
    | 'LEAD_TIME_VIOLATION'
    | 'TURNAROUND_VIOLATION'
    | 'INVALID_DURATION';
  severity: 'BLOCKER' | 'WARNING';
  message: string;
  conflictingAppointmentId?: number;
  availabilityId?: number;
}

export interface AppointmentMatchRequest {
  patientId?: number;
  preferredDoctorId?: number;
  specialtyKeyword?: string;
  desiredStartTime?: string;
  desiredEndTime?: string;
  consultationType?: AppointmentDTO['consultationType'];
  urgent?: boolean;
  reasonForVisit?: string;
}

export interface AppointmentMatchCandidate {
  doctorId: number;
  startTime: string;
  endTime: string;
  consultationType: AppointmentDTO['consultationType'];
  score: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  reasons: string[];
  conflicts: AvailabilityConflict[];
}

// ============ MÉTIERS AVANCÉS ============

/**
 * 🔧 AppointmentSlot - Gestion intelligente des créneaux horaires
 * Métier avancé pour l'optimisation et l'allocation automatique des rendez-vous
 */
export interface AppointmentSlot {
  id?: number;
  availabilityId: number;
  doctorId: number;
  slotStartTime: string;
  slotEndTime: string;
  durationMinutes: number;
  isBooked: boolean;
  appointmentId?: number;
  slotType: 'GENERAL' | 'URGENT' | 'FOLLOW_UP' | 'CONSULTATION';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  capacity: number; // Pour slots de groupe (ex: clinique de groupe)
  currentBookings: number;
  bufferMinutesAfter?: number; // Temps d'attente entre rendez-vous
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 🎯 AppointmentQueue - File d'attente et prioritization
 * Métier avancé pour gérer les files d'attente, les urgences et la répartition
 */
export interface AppointmentQueue {
  id?: number;
  patientId: number;
  appointmentId?: number;
  requestedSlotTime?: string;
  queuePosition: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  reasonForPriority?: string;
  estimatedWaitTime?: number; // en minutes
  status: 'WAITING' | 'CALLED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  urgencyScore: number; // 0-100 calculé par l'IA
  preferredSpecialty?: string;
  preferredDoctorIds?: number[];
  checkinTime?: string;
  callTime?: string;
  estimatedConsultationEndTime?: string;
  createdAt?: string;
  updatedAt?: string;
}
