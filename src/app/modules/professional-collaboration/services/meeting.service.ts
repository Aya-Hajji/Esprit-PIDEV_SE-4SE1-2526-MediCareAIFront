import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  MeetingExtended,
  MeetingParticipant,
  MeetingFilter
} from '../models/collaboration.model';
import { PVGenerationProgress, ProcesVerbal } from '../models/meeting.model';

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private meetingUrl = `${this.baseUrl}/api/meetings`;
  
  // Jitsi config
  private jitsiDomain = 'meet.jit.si'; // Change to your domain
  
  // PV Progress tracking
  private pvProgressSubject = new BehaviorSubject<PVGenerationProgress | null>(null);
  pvProgress$ = this.pvProgressSubject.asObservable();

  private meetingsSubject = new BehaviorSubject<MeetingExtended[]>([]);
  meetings$ = this.meetingsSubject.asObservable();

  private currentMeetingSubject = new BehaviorSubject<MeetingExtended | null>(null);
  currentMeeting$ = this.currentMeetingSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('MeetingService initialized');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private getCreatorParams(): HttpParams {
    let params = new HttpParams();
    const userId = localStorage.getItem('userId');
    if (userId) {
      params = params.set('creatorId', userId);
    }
    return params;
  }

  // ============================================
  // Meetings CRUD
  // ============================================

  getAllMeetings(filter?: MeetingFilter): Observable<MeetingExtended[]> {
    let params = new HttpParams();
    
    // Add creatorId (userId)
    const userId = localStorage.getItem('userId');
    if (userId) {
      params = params.set('creatorId', userId);
    }
    
    if (filter) {
      if (filter.status) params = params.set('status', filter.status);
      if (filter.searchTerm) params = params.set('search', filter.searchTerm);
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
      if (filter.toDate) params = params.set('toDate', filter.toDate);
    }

    console.log('Fetching all meetings');
    return this.http.get<MeetingExtended[]>(this.meetingUrl, { params }).pipe(
      tap(meetings => {
        console.log('Meetings fetched:', meetings.length);
        this.meetingsSubject.next(meetings);
      })
    );
  }

  getMeetingById(id: number): Observable<MeetingExtended> {
    console.log('Fetching meeting:', id);
    return this.http.get<MeetingExtended>(`${this.meetingUrl}/${id}`).pipe(
      tap(meeting => {
        console.log('Meeting fetched:', meeting);
        this.currentMeetingSubject.next(meeting);
      })
    );
  }

  private getOrganizerId(): number | null {
    const userId = localStorage.getItem('userId');
    const n = userId ? Number(userId) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  private toBackendMeetingPayload(meeting: Partial<MeetingExtended>): Record<string, unknown> {
    // Backend error shows it persists columns:
    // (date_time, meeting_link, organizer_id, recorded, recording_url, title)
    // So we provide a compatible payload.
    const organizerId = meeting.organizerId ?? this.getOrganizerId();

    const scheduledDate = (meeting as any).scheduledDate as string | undefined;
    const scheduledTime = (meeting as any).scheduledTime as string | undefined;
    const dateTime =
      (meeting as any).dateTime ||
      (scheduledDate && scheduledTime ? `${scheduledDate}T${scheduledTime}:00` : undefined);

    const recorded = (meeting as any).recorded ?? (meeting as any).isRecorded ?? false;
    const recordingUrl = (meeting as any).recordingUrl ?? null;

    return {
      title: meeting.title,
      organizerId,
      meetingLink: meeting.meetingLink,
      dateTime,
      recorded,
      recordingUrl
    };
  }

  createMeeting(meeting: Partial<MeetingExtended>): Observable<MeetingExtended> {
    console.log('Creating meeting');
    console.log('Meeting payload:', meeting);

    // Backend will extract organizer from JWT token
    const payload = this.toBackendMeetingPayload(meeting);
    return this.http.post<MeetingExtended>(this.meetingUrl, payload, {
      headers: this.getAuthHeaders(),
      params: this.getCreatorParams()
    });
  }

  updateMeeting(id: number, meeting: Partial<MeetingExtended>): Observable<MeetingExtended> {
    console.log('Updating meeting:', id);
    const payload = this.toBackendMeetingPayload(meeting);
    return this.http.put<MeetingExtended>(`${this.meetingUrl}/${id}`, payload, {
      headers: this.getAuthHeaders(),
      params: this.getCreatorParams()
    });
  }

  deleteMeeting(id: number): Observable<void> {
    console.log('Deleting meeting:', id);
    return this.http.delete<void>(`${this.meetingUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // Meeting Participants (Option A: invite by userId)
  // ============================================

  addParticipant(meetingId: number, userId: number): Observable<void> {
    return this.http.post<void>(`${this.meetingUrl}/${meetingId}/participants/${userId}`, {}, {
      headers: this.getAuthHeaders(),
      params: this.getCreatorParams()
    });
  }

  removeParticipant(meetingId: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.meetingUrl}/${meetingId}/participants/${userId}`, {
      headers: this.getAuthHeaders(),
      params: this.getCreatorParams()
    });
  }

  // ============================================
  // Meeting Status Helpers
  // ============================================

  getUpcomingMeetings(): Observable<MeetingExtended[]> {
    return this.getAllMeetings({ status: 'SCHEDULED' });
  }

  getCompletedMeetings(): Observable<MeetingExtended[]> {
    return this.getAllMeetings({ status: 'COMPLETED' });
  }

  generateMeetingLink(meetingId: number): string {
    return `${window.location.origin}/collaboration/dashboard/meeting/${meetingId}/join`;
  }

  formatDateTime(date: string, time: string): Date {
    return new Date(`${date}T${time}`);
  }

  isUpcoming(meeting: MeetingExtended): boolean {
    if (meeting.scheduledDate && meeting.scheduledTime) {
      const scheduledTime = this.formatDateTime(meeting.scheduledDate, meeting.scheduledTime);
      return scheduledTime > new Date();
    }
    return false;
  }

  isPast(meeting: MeetingExtended): boolean {
    if (meeting.scheduledDate && meeting.scheduledTime) {
      const scheduledTime = this.formatDateTime(meeting.scheduledDate, meeting.scheduledTime);
      const duration = meeting.duration || 60;
      const endTime = new Date(scheduledTime.getTime() + duration * 60000);
      return endTime < new Date();
    }
    return false;
  }

  isOngoing(meeting: MeetingExtended): boolean {
    return !this.isUpcoming(meeting) && !this.isPast(meeting);
  }

  getTimeUntilMeeting(meeting: MeetingExtended): string {
    if (meeting.scheduledDate && meeting.scheduledTime) {
      const scheduledTime = this.formatDateTime(meeting.scheduledDate, meeting.scheduledTime);
      const now = new Date();
      const diff = scheduledTime.getTime() - now.getTime();

      if (diff < 0) return 'Passée';

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `Dans ${days}j ${hours % 24}h`;
      }

      return `Dans ${hours}h ${minutes}m`;
    }

    return 'Date inconnue';
  }

  // ============================================
  // JITSI INTEGRATION - Phase 1-2
  // ============================================

  /**
   * Generate a DETERMINISTIC Jitsi room name from meetingId only.
   * All participants with the same meetingId land in the SAME room.
   * No localStorage, no timestamp — purely based on meetingId.
   */
  generateJitsiRoomName(meetingId: number): string {
    // Deterministic: same meetingId → same room name, always, on every device
    return `medicare-meeting-${meetingId}`.toLowerCase();
  }

  /**
   * Get full Jitsi room URL
   */
  getJitsiRoomUrl(roomName: string): string {
    return `https://${this.jitsiDomain}/${roomName}`;
  }

  /**
   * Configure Jitsi iframe options with recording enabled
   */
  getJitsiIframeOptions(roomName: string, userInfo: any, recordingEnabled: boolean) {
    return {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: document.getElementById('jitsi-container'),
      configOverwrite: {
        // Recording (Phase 2)
        fileRecordingsEnabled: recordingEnabled,
        
        // Start defaults
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        
        // UI
        disableDeepLinking: true,
        requireDisplayName: true,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
          'hangup', 'chat', 'recording', 'settings', 'raisehand', 'videoquality',
          'filmstrip', 'invite', 'feedback', 'stats', 'tileview'
        ],
        HIDE_INVITE_MORE_HEADER: false,
        MOBILE_APP_PROMO: false,
      },
      userInfo: {
        displayName: userInfo.name,
        email: userInfo.email,
      }
    };
  }

  /**
   * Start Jitsi meeting — POST /api/meetings/{id}/start
   */
  startMeeting(meetingId: number): Observable<any> {
    return this.http.post(`${this.meetingUrl}/${meetingId}/start`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * End meeting — POST /api/meetings/{id}/end
   */
  endMeeting(meetingId: number): Observable<any> {
    return this.http.post(`${this.meetingUrl}/${meetingId}/end`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Cancel meeting — POST /api/meetings/{id}/cancel
   */
  cancelMeeting(meetingId: number): Observable<any> {
    return this.http.post(`${this.meetingUrl}/${meetingId}/cancel`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Update meeting notes — PATCH /api/meetings/{id}/notes
   */
  updateNotes(meetingId: number, notes: string): Observable<any> {
    return this.http.patch(`${this.meetingUrl}/${meetingId}/notes`, { notes }, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get live meeting data — GET /api/meetings/{id}/live
   */
  getLiveData(meetingId: number): Observable<any> {
    return this.http.get(`${this.meetingUrl}/${meetingId}/live`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Generate PV via IA — POST /api/meetings/{id}/pv/generate
   */
  generatePV(meetingId: number): Observable<any> {
    console.log('[PV] Requesting IA generation for meeting:', meetingId);
    return this.http.post(`${this.meetingUrl}/${meetingId}/pv/generate`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Get PV — GET /api/meetings/{id}/pv
   */
  getPV(meetingId: number): Observable<ProcesVerbal> {
    return this.http.get<ProcesVerbal>(`${this.meetingUrl}/${meetingId}/pv`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Poll PV until ready (polls GET /api/meetings/{id}/pv every 4s)
   */
  pollPVUntilReady(meetingId: number): Observable<ProcesVerbal> {
    return interval(4000).pipe(
      switchMap(() => this.getPV(meetingId)),
      tap(pv => {
        console.log('[PV] Poll result:', (pv as any)?.status);
        this.pvProgressSubject.next({
          stage: (pv as any)?.status || 'generating',
          progress: (pv as any)?.status === 'ready' ? 100 : 60,
          message: (pv as any)?.status === 'ready' ? '✅ PV prêt !' : '🧠 Génération en cours…'
        } as PVGenerationProgress);
      })
    );
  }

  // ── Legacy aliases (kept for backward compat) ──────────────────────────────

  /** @deprecated use endMeeting() */
  endJitsiMeeting(meetingId: number): Observable<any> {
    return this.endMeeting(meetingId);
  }

  /** @deprecated use generatePV() */
  monitorPVProgress(meetingId: number) {
    return this.pollPVUntilReady(meetingId);
  }

  /**
   * Update PV (review/approve/edit)
   */
  updatePV(pvId: number, pv: Partial<ProcesVerbal>): Observable<ProcesVerbal> {
    return this.http.put<ProcesVerbal>(`${this.baseUrl}/api/pv/${pvId}`, pv, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Export PV to PDF
   */
  exportPVtoPDF(pvId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/api/pv/${pvId}/pdf`, {
      responseType: 'blob',
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Send PV email to participants
   */
  sendPVEmail(pvId: number, recipients: string[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/pv/${pvId}/send-email`, { recipients }, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Sign PV electronically
   */
  signPV(pvId: number, signature: string): Observable<ProcesVerbal> {
    return this.http.post<ProcesVerbal>(`${this.baseUrl}/api/pv/${pvId}/sign`, { signature }, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Format duration in seconds to readable string
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  /**
   * Get meeting summary for display
   */
  getMeetingSummary(meeting: MeetingExtended): string {
    return `${meeting.title} • ${meeting.scheduledDate}`;
  }
}
