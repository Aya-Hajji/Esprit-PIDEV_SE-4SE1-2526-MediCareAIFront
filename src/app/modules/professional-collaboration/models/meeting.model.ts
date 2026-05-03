/**
 * MEETING MODELS - Jitsi + IA PV Integration
 */

// ============================================
// MEETING
// ============================================
export interface Meeting {
  id?: number;
  sessionId: number; // FK to CollaborationSession
  title: string;
  description?: string;
  startTime: string; // ISO datetime
  endTime?: string;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  
  jitsi: {
    roomName: string; // Room identifier
    roomUrl: string; // Full URL
    jwtToken?: string; // Security token
    allowRecording: boolean;
  };
  
  organizer: {
    userId: number;
    name: string;
    email: string;
  };
  
  participants: MeetingParticipant[];
  
  recording?: {
    recordingId: string;
    status: 'recording' | 'processing' | 'ready' | 'failed';
    fileUrl?: string;
    duration?: number; // seconds
    uploadedAt?: string;
  };
  
  pv?: ProcesVerbal; // Linked PV
  pvStatus?: 'pending' | 'generating' | 'ready' | 'failed';
  
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// MEETING PARTICIPANT
// ============================================
export interface MeetingParticipant {
  id?: number;
  meetingId?: number;
  userId: number;
  name: string;
  email: string;
  specialization?: string; // e.g., "Cardiologue"
  status: 'invited' | 'joined' | 'left' | 'declined';
  joinedAt?: string;
  leftAt?: string;
  speakingTime?: number; // minutes
  isOrganizer?: boolean;
}

// ============================================
// PROCEÈS-VERBAL (PV)
// ============================================
export interface ProcesVerbal {
  id?: number;
  meetingId: number;
  sessionId: number;
  documentId?: number; // FK to shared document
  
  // Meta
  generatedAt: string; // When PV was generated
  generatedBy: 'AI' | 'MANUAL'; // AI or manually created
  status: 'draft' | 'reviewed' | 'approved' | 'signed';
  confidenceScores: ConfidenceScores;
  
  // Content
  content: PVContent;
  
  // Review
  reviewedBy?: {
    userId: number;
    name: string;
    timestamp: string;
  };
  
  signatureData?: {
    signedBy: number;
    signature: string;
    timestamp: string;
  };
  
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// PV CONTENT (Main structure)
// ============================================
export interface PVContent {
  // Header
  header: PVHeader;
  
  // Sections
  participants: PVParticipant[];
  executiveSummary: string;
  discussionPoints: string[];
  
  // Medical
  diagnosis?: PVDiagnosis;
  
  // Decisions & Actions
  decisionsMade: PVDecision[];
  actionItems: PVActionItem[];
  
  // Treatment
  treatmentsRecommended: PVTreatment[];
  
  // Footer
  importantNotes?: string;
  nextMeeting?: {
    date: string;
    topic: string;
  };
}

export interface PVHeader {
  meetingTitle: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string;
  durationMinutes: number;
  location: string; // "Réunion Virtuelle Jitsi"
  roomLink?: string;
}

export interface PVParticipant {
  name: string;
  specialization: string;
  status: 'present' | 'absent';
  speakingTime?: string; // "18 min"
}

export interface PVDiagnosis {
  main: string; // Main diagnosis
  icd10: string; // e.g., "I50.9"
  comorbidities: string[];
  severity?: string; // "Stage 3"
  details: string;
}

export interface PVDecision {
  decision: string; // What was decided
  responsible: string; // Who is responsible
  deadline: string; // YYYY-MM-DD or "ASAP"
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
}

export interface PVActionItem {
  task: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'high' | 'medium' | 'low';
}

export interface PVTreatment {
  medication: string; // "Lisinopril"
  dosage: string; // "10mg"
  frequency: string; // "1x/day"
  duration?: string; // "Indefinite" or "30 days"
  indication: string; // Why prescribed
  contraindications?: string[];
  interactions?: string[];
  notes?: string;
}

// ============================================
// CONFIDENCE SCORES
// ============================================
export interface ConfidenceScores {
  transcript: number; // 0-1 (STT accuracy)
  participantsExtraction: number;
  diagnosisExtraction: number;
  decisionsExtraction: number;
  treatmentsExtraction: number;
  overallQuality: number;
}

// ============================================
// TRANSCRIPTION (Intermediate)
// ============================================
export interface Transcription {
  meetingId: number;
  recordingId: string;
  
  fullText: string; // Entire transcription
  segments: TranscriptionSegment[];
  
  language: string; // "fr" or "en"
  confidence: number; // 0-1
  
  generatedAt: string;
}

export interface TranscriptionSegment {
  timestamp: string; // "00:01:23"
  speaker: string; // "Dr. Dupont" or "Unknown"
  text: string;
  confidence: number;
  keywords?: string[]; // Extracted keywords
}

// ============================================
// API RESPONSES
// ============================================
export interface MeetingResponse {
  success: boolean;
  data?: Meeting;
  error?: string;
}

export interface PVGenerationProgress {
  meetingId: number;
  stage: 'initializing' | 'transcribing' | 'analyzing' | 'generating' | 'finalizing';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface PVGenerationResult {
  success: boolean;
  pvId?: number;
  pv?: ProcesVerbal;
  transcription?: Transcription;
  error?: string;
  warnings?: string[];
}
