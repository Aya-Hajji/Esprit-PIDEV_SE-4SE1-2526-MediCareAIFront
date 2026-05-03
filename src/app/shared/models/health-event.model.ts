export interface HealthEvent {
  id?: number;
  title: string;
  category?: 'VACCINATION' | 'AWARENESS' | 'TRAINING' | 'CONSULTATION' | 'OTHER';
  description?: string;
  eventDate?: string;
  location?: string;
  participants?: Array<{ id?: number; fullName?: string; email?: string }>;
  participantIds?: number[];
  numberOfParticipants?: number;
  participantCount?: number;
  participantsCount?: number;   // alternative field name some backends use
  totalParticipants?: number;   // alternative field name
  feedbackIds?: number[];
  [key: string]: unknown;       // allow extra fields from backend
}

export interface Feedback {
  id?: number;
  userName: string;
  comment?: string;
  rating: number;
  createdAt?: string;
  healthEventId?: number;
  userId?: number;
  user?: { id?: number };
  healthEvent?: { id?: number };
  event?: { id?: number };
}

export interface FeedbackRequestDTO {
  userName: string;
  comment?: string;
  rating: number;
  healthEventId: number;
  userId: number;
}
