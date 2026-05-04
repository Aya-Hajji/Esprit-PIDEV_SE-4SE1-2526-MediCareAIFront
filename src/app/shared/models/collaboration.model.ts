export interface CollaborationSession {
  id?: number;
  title?: string;
  creatorId?: number;
  creatorName?: string;
  participantIds?: number[];
  createdAt?: string;
  documentCount?: number;
}

export interface SharedDocument {
  id?: number;
  fileName?: string;
  fileUrl?: string;
  sessionId?: number;
  annotationCount?: number;
}

export interface Annotation {
  id?: number;
  content: string;
  positionX?: number;
  positionY?: number;
  documentId?: number;
  authorId?: number;
}

export interface Meeting {
  id?: number;
  title?: string;
  dateTime?: string;
  meetingLink?: string;
  organizerId?: number;
  organizerName?: string;
  participantIds?: number[];
  recorded?: boolean;
  recordingUrl?: string;
}
