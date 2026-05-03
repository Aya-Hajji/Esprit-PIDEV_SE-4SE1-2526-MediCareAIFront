export interface HealthEvent {
  id?: number;
  title: string;
  description?: string;
  eventDate?: string;
  location?: string;
  participantIds?: number[];
  feedbackIds?: number[];
}

export interface Feedback {
  id?: number;
  userName: string;
  comment?: string;
  rating: number;
  createdAt?: string;
  healthEventId?: number;
}
