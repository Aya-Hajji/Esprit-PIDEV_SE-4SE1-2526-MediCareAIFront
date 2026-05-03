/**
 * Modèles pour le module Collaboration & Professional Meeting
 */

// ============================================
// Collaboration Models
// ============================================

export interface CollaborationSession {
  id?: number;
  title: string;
  description?: string;
  caseNumber?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  organizerId?: number;
  organizerName?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
  maxParticipants?: number;
  documentCount?: number;
  meetingLink?: string; // Microsoft Teams or other meeting link
}

export interface SessionExtended extends CollaborationSession {
  participants?: Participant[];
  documents?: SharedDocument[];
  createdAtFormatted?: string;
  isOwner?: boolean;
  isMember?: boolean;
  activeSince?: string;
}

export interface Participant {
  id?: number;
  userId?: number;
  sessionId?: number;
  name: string;
  email?: string;
  specialty?: string;
  role: 'ORGANIZER' | 'EDITOR' | 'VIEWER';
  joinedAt?: string;
  avatar?: string;
}

export interface SharedDocument {
  id?: number;
  sessionId: number;
  fileName: string;
  fileType: string;
  fileSize?: number;
  uploadedBy?: string;
  uploadedById?: number;
  uploadedAt?: string;
  description?: string;
  url?: string;
  annotationCount?: number;
  lastModified?: string;
}

export interface DocumentAnnotation {
  id?: number;
  documentId: number;
  userId?: number;
  userName?: string;
  content: string;
  x?: number;
  y?: number;
  pageNumber?: number;
  color?: string;
  type?: 'COMMENT' | 'HIGHLIGHT' | 'ARROW';
  createdAt?: string;
  updatedAt?: string;
}

export interface Discussion {
  id?: number;
  sessionId: number;
  title: string;
  content: string;
  createdBy?: number;
  createdByName?: string;
  createdByAvatar?: string;
  createdAt?: string;
  updatedAt?: string;
  replies?: DiscussionReply[];
  replyCount?: number;
  isEditable?: boolean;
}

export interface DiscussionReply {
  id?: number;
  discussionId: number;
  content: string;
  createdBy?: number;
  createdByName?: string;
  createdByAvatar?: string;
  createdAt?: string;
  updatedAt?: string;
  isEditable?: boolean;
}

// ============================================
// Meeting Models
// ============================================

export interface Meeting {
  id?: number;
  title: string;
  description?: string;
  organizerId?: number;
  organizerName?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number; // in minutes
  venue?: string;
  meetingLink?: string;
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isRecorded?: boolean;
  recordingUrl?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  createdAt?: string;
}

export interface MeetingExtended extends Meeting {
  participants?: MeetingParticipant[];
  isOwner?: boolean;
  isAttendee?: boolean;
  startedAtTime?: string;
  endedAtTime?: string;
  participantCount?: number;
  scheduledDateTime?: Date;
  isUpcoming?: boolean;
  isPast?: boolean;
  isOngoing?: boolean;
}

export interface MeetingParticipant {
  id?: number;
  meetingId: number;
  userId: number;
  name: string;
  email?: string;
  specialty?: string;
  status: 'INVITED' | 'ACCEPTED' | 'REJECTED' | 'JOINED' | 'LEFT';
  joinedAt?: string;
  leftAt?: string;
  avatar?: string;
  role?: string;
}

// ============================================
// Filter and Search Models
// ============================================

export interface CollaborationFilter {
  status?: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  searchTerm?: string;
  sortBy?: 'newest' | 'recently_modified' | 'oldest';
  caseNumber?: string;
}

export interface MeetingFilter {
  status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  searchTerm?: string;
  sortBy?: 'upcoming' | 'recent' | 'oldest';
  fromDate?: string;
  toDate?: string;
}
