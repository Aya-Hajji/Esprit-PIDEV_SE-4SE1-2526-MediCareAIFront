import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  SessionExtended,
  SharedDocument,
  DocumentAnnotation,
  CollaborationFilter,
  Participant,
  Discussion,
  DiscussionReply
} from '../models/collaboration.model';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private sessionUrl = `${this.baseUrl}/api/collaboration/sessions`;
  private documentUrl = `${this.baseUrl}/api/collaboration/documents`;
  private annotationUrl = `${this.baseUrl}/api/collaboration/annotations`;
  private discussionUrl = `${this.baseUrl}/api/collaboration/discussions`;
  private replyUrl = `${this.baseUrl}/api/collaboration/replies`;
  private participantUrl = `${this.baseUrl}/api/collaboration/participants`;

  private sessionsSubject = new BehaviorSubject<SessionExtended[]>([]);
  sessions$ = this.sessionsSubject.asObservable();

  private currentSessionSubject = new BehaviorSubject<SessionExtended | null>(null);
  currentSession$ = this.currentSessionSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('CollaborationService initialized');
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

  // ============================================
  // Collaboration Sessions
  // ============================================

  getAllSessions(filter?: CollaborationFilter): Observable<SessionExtended[]> {
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
      if (filter.caseNumber) params = params.set('caseNumber', filter.caseNumber);
    }
    console.log('Fetching all collaboration sessions');
    return this.http.get<SessionExtended[]>(this.sessionUrl, { params }).pipe(
      tap(sessions => {
        console.log('Sessions fetched:', sessions.length);
        this.sessionsSubject.next(sessions);
      })
    );
  }

  getSessionById(id: number): Observable<SessionExtended> {
    const url = `${this.sessionUrl}/${id}`;
    console.log('[CollaborationService] Fetching session:', { id, url });
    return this.http.get<SessionExtended>(url).pipe(
      tap(session => {
        console.log('[CollaborationService] Session fetched successfully:', session);
        this.currentSessionSubject.next(session);
      }),
      catchError(error => {
        console.error('[CollaborationService] Error fetching session:', { id, url, error });
        return throwError(() => new Error(`Failed to load session: ${error.message}`));
      })
    );
  }

  createSession(session: Partial<SessionExtended>, creatorId: number | null): Observable<SessionExtended> {
    console.log('Creating collaboration session');
    console.log('Session payload:', session);
    console.log('Creator ID:', creatorId);

    // Validation stricte: creatorId est OBLIGATOIRE
    if (!creatorId || creatorId <= 0) {
      console.error('CreatorId is required and must be a valid positive number');
      return throwError(() => new Error('User ID is not available. Please log in again.'));
    }

    let params = new HttpParams();
    params = params.set('creatorId', creatorId.toString());

    console.log('Request params:', params.toString());

    return this.http.post<SessionExtended>(this.sessionUrl, session, {
      headers: this.getAuthHeaders(),
      params: params
    }).pipe(
      tap(newSession => {
        console.log('Session created:', newSession);
        this.sessionsSubject.next([newSession, ...this.sessionsSubject.value]);
      }),
      catchError(error => {
        console.error('Error creating session:', error);
        return throwError(() => error);
      })
    );
  }

  updateSession(id: number, session: Partial<SessionExtended>): Observable<SessionExtended> {
    console.log('Updating session:', id);
    return this.http.put<SessionExtended>(`${this.sessionUrl}/${id}`, session, {
      headers: this.getAuthHeaders()
    });
  }

  deleteSession(id: number): Observable<void> {
    console.log('Deleting session:', id);
    return this.http.delete<void>(`${this.sessionUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // Documents
  // ============================================

  getSessionDocuments(sessionId: number): Observable<SharedDocument[]> {
    console.log('Fetching documents for session:', sessionId);
    return this.http.get<SharedDocument[]>(`${this.documentUrl}/sessions/${sessionId}`);
  }

  uploadDocument(sessionId: number, file: File, description?: string): Observable<SharedDocument> {
    // Validations avant upload
    if (!file) {
      console.error('[CollaborationService] Aucun fichier fourni');
      return throwError(() => new Error('Aucun fichier fourni'));
    }

    if (sessionId <= 0) {
      console.error('[CollaborationService] ID de session invalide:', sessionId);
      return throwError(() => new Error('Session ID invalide'));
    }

    // Log détaillé des informations du fichier
    console.log('[CollaborationService] Préparation du upload avec détails:', {
      sessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      hasDescription: !!description,
      descriptionLength: description?.length || 0
    });

    // ⚠️ SOLUTION: Utiliser HttpClient avec FormData
    // L'AuthInterceptor va supprimer le Content-Type et laisser le navigateur
    // le reconstruire SANS charset (ce que les navigateurs modernes font)
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (description && description.trim().length > 0) {
      formData.append('description', description.trim());
    }

    const uploadUrl = `${this.documentUrl}/sessions/${sessionId}`;
    console.log('[CollaborationService] Upload FormData via HttpClient');
    console.log('[CollaborationService] URL:', uploadUrl);

    return this.http.post<SharedDocument>(
      uploadUrl,
      formData,
      // ⚠️ NE PAS définir Content-Type
      // L'interceptor va supprimer les headers FormData
      // Le navigateur recréera le Content-Type sans charset
      { 
        headers: this.getAuthHeaders()
      }
    ).pipe(
      tap(doc => {
        console.log('[CollaborationService] ✅ Document uploadé avec succès:', doc);
      }),
      catchError(error => {
        console.error('[CollaborationService] ❌ Erreur upload:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Participants (Invitations)
  // ============================================

  getSessionParticipants(sessionId: number): Observable<Participant[]> {
    console.log('[CollaborationService] Fetching participants for session:', sessionId);
    const url = `${this.participantUrl}/sessions/${sessionId}`;
    console.log('[CollaborationService] URL:', url);
    
    return this.http.get<Participant[]>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(participants => {
        console.log('[CollaborationService] ✅ Participants fetched:', {
          count: participants?.length || 0,
          participants: participants
        });
      }),
      catchError(error => {
        console.error('[CollaborationService] ❌ Error fetching participants:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.message,
          url: error?.url
        });
        
        // Return empty array as fallback instead of throwing error
        // This allows the session to still work even if participants endpoint fails
        if (error?.status === 500) {
          console.warn('[CollaborationService] Backend returned 500, returning empty participants array');
          return of([]); // Return empty array instead of error
        }
        
        return throwError(() => new Error(`Failed to load participants: ${error.message}`));
      })
    );
  }

  inviteParticipant(sessionId: number, email: string, role: 'EDITOR' | 'VIEWER' = 'VIEWER', userId?: number): Observable<Participant> {
    console.log('[CollaborationService] Inviting participant:', { sessionId, email, role, userId });
    
    // Strategy 1: Try with userId if provided (some backends prefer userId over email)
    if (userId) {
      console.log('[CollaborationService] Attempting with userId...');
      let params = new HttpParams();
      params = params.set('userId', userId.toString());
      params = params.set('role', role);
      
      return this.http.post<Participant>(
        `${this.sessionUrl}/${sessionId}/participants`,
        {},
        { 
          headers: this.getAuthHeaders(),
          params: params
        }
      ).pipe(
        tap(participant => {
          console.log('[CollaborationService] ✅ Participant invited successfully with userId:', participant);
        }),
        catchError(userIdError => {
          console.error('[CollaborationService] ❌ userId attempt failed:', {
            status: userIdError?.status,
            message: userIdError?.error?.message
          });
          // Fall back to email if userId fails
          return this.inviteParticipantByEmail(sessionId, email, role);
        })
      );
    }
    
    return this.inviteParticipantByEmail(sessionId, email, role);
  }

  private inviteParticipantByEmail(sessionId: number, email: string, role: 'EDITOR' | 'VIEWER'): Observable<Participant> {
    console.log('[CollaborationService] Inviting by email with JSON body...');

    const payload = { email, role };
    return this.http.post<any>(
      `${this.sessionUrl}/${sessionId}/participants`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      map((response: any) => {
        if (response && typeof response === 'object' && response.id) {
          return response as Participant;
        }
        return this.createParticipantFromResponse(
          typeof response === 'string' ? response : JSON.stringify(response),
          email, role, sessionId
        );
      }),
      tap(p => console.log('[CollaborationService] ✅ Participant invited:', p)),
      catchError(err1 => {
        const backendMsg: string = (err1?.error?.message || err1?.error || err1?.message || '').toString().toLowerCase();

        // ── "Already participant" is NOT an error — treat as success ──────
        const alreadyKeywords = ['déjà', 'already', 'exist', 'duplicate', 'conflict'];
        if (err1?.status === 400 && alreadyKeywords.some(k => backendMsg.includes(k))) {
          console.warn('[CollaborationService] Participant already exists — treating as success');
          return of(this.createParticipantFromResponse('', email, role, sessionId));
        }

        console.warn('[CollaborationService] JSON body failed, trying query params...', err1?.status);

        // Fallback: query params
        let params = new HttpParams().set('email', email).set('role', role);
        return this.http.post<any>(
          `${this.sessionUrl}/${sessionId}/participants`,
          {},
          { headers: this.getAuthHeaders(), params }
        ).pipe(
          map((response: any) => {
            if (response && typeof response === 'object' && response.id) return response as Participant;
            return this.createParticipantFromResponse(
              typeof response === 'string' ? response : JSON.stringify(response),
              email, role, sessionId
            );
          }),
          tap(p => console.log('[CollaborationService] ✅ Participant invited (query params):', p)),
          catchError(err2 => {
            const msg2: string = (err2?.error?.message || err2?.error || err2?.message || '').toString().toLowerCase();

            // Same check for query params fallback
            if (err2?.status === 400 && alreadyKeywords.some(k => msg2.includes(k))) {
              console.warn('[CollaborationService] Participant already exists (query params) — treating as success');
              return of(this.createParticipantFromResponse('', email, role, sessionId));
            }

            console.error('[CollaborationService] ❌ All strategies failed:', err2?.status, err2?.error);
            const displayMsg = err2?.error?.message || err2?.error || err2?.message || 'Erreur lors de l\'invitation';
            return throwError(() => new Error(displayMsg));
          })
        );
      })
    );
  }

  private createParticipantFromResponse(response: string, email: string, role: 'EDITOR' | 'VIEWER', sessionId: number): Participant {
    console.log('[CollaborationService] Creating Participant object from response');
    
    // Try to extract participant ID from response text (e.g., "id=2")
    const idMatch = response?.match(/id=(\d+)/);
    const participantId = idMatch ? parseInt(idMatch[1], 10) : undefined;
    
    // Extract email name for display if available
    const emailName = email.split('@')[0];
    
    const participant: Participant = {
      id: participantId,
      sessionId: sessionId,
      name: emailName,
      email: email,
      role: role,
      joinedAt: new Date().toISOString()
    };
    
    console.log('[CollaborationService] Created Participant:', participant);
    return participant;
  }

  deleteParticipant(sessionId: number, participantId: number): Observable<void> {
    console.log('Deleting participant:', { sessionId, participantId });
    return this.http.delete<void>(`${this.sessionUrl}/${sessionId}/participants/${participantId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => console.log('Participant deleted successfully')),
      catchError(error => {
        console.error('Error deleting participant:', error);
        return throwError(() => error);
      })
    );
  }

  deleteDocument(documentId: number): Observable<void> {
    console.log('Deleting document:', documentId);
    return this.http.delete<void>(`${this.documentUrl}/${documentId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // Annotations
  // ============================================

  getDocumentAnnotations(documentId: number): Observable<DocumentAnnotation[]> {
    console.log('Fetching annotations for document:', documentId);
    return this.http.get<DocumentAnnotation[]>(
      `${this.annotationUrl}/documents/${documentId}`
    );
  }

  createAnnotation(documentId: number, annotation: Partial<DocumentAnnotation>): Observable<DocumentAnnotation> {
    const userId = localStorage.getItem('userId');
    console.log('[CollaborationService] Creating annotation. UserId:', userId, 'DocumentId:', documentId);

    const payload = {
      ...annotation,
      userId: userId ? +userId : null,
      documentId: documentId
    };

    console.log('[CollaborationService] Annotation payload:', payload);

    return this.http.post<DocumentAnnotation>(
      `${this.annotationUrl}/documents/${documentId}`,
      payload,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(result => {
        console.log('[CollaborationService] Annotation created successfully:', result);
      }),
      catchError(error => {
        console.error('[CollaborationService] Error creating annotation:', error);
        console.error('[CollaborationService] Error status:', error?.status);
        console.error('[CollaborationService] Error body:', error?.error);
        return throwError(() => error);
      })
    );
  }

  updateAnnotation(id: number, annotation: Partial<DocumentAnnotation>): Observable<DocumentAnnotation> {
    console.log('Updating annotation:', id);
    return this.http.put<DocumentAnnotation>(
      `${this.annotationUrl}/${id}`,
      annotation,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteAnnotation(id: number): Observable<void> {
    console.log('Deleting annotation:', id);
    return this.http.delete<void>(`${this.annotationUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Alias for compatibility
  addAnnotation(annotation: Partial<DocumentAnnotation>): Observable<DocumentAnnotation> {
    if (!annotation.documentId) {
      return throwError(() => new Error('Document ID is required'));
    }
    return this.createAnnotation(annotation.documentId, annotation);
  }

  getDocumentById(documentId: number): Observable<SharedDocument> {
    console.log('[CollaborationService] Fetching document:', documentId);
    const url = `${this.documentUrl}/${documentId}`;
    console.log('[CollaborationService] URL:', url);
    
    return this.http.get<SharedDocument>(url).pipe(
      tap(doc => {
        console.log('[CollaborationService] ✅ Document reçu:', {
          id: doc?.id,
          fileName: doc?.fileName,
          sessionId: doc?.sessionId,
          url: doc?.url,
          fileType: doc?.fileType,
          hasUrl: !!doc?.url,
          fullDoc: doc
        });
      }),
      catchError(error => {
        console.error('[CollaborationService] ❌ Erreur GET document:', {
          status: error?.status,
          message: error?.message,
          error: error?.error
        });
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // Discussions
  // ============================================

  getSessionDiscussions(sessionId: number): Observable<Discussion[]> {
    const url = `${this.discussionUrl}/sessions/${sessionId}`;
    console.log('[CollaborationService] Fetching discussions for session:', { sessionId, url });
    return this.http.get<Discussion[]>(url, { headers: this.getAuthHeaders() }).pipe(
      tap((discussions) => {
        console.log('[CollaborationService] ✅ Discussions fetched:', discussions?.length || 0);
      }),
      catchError((error) => {
        console.error('[CollaborationService] ❌ Error fetching discussions:', {
          status: error?.status,
          message: error?.message,
          url: error?.url
        });
        // Return empty array on error instead of throwing
        // TODO: Verify endpoint exists on backend: GET /api/collaboration/discussions/sessions/{id}
        return of([] as Discussion[]);
      })
    );
  }

  createDiscussion(discussion: Partial<Discussion>): Observable<Discussion> {
    const userId = localStorage.getItem('userId');
    console.log('Creating discussion. UserId:', userId);

    const payload = {
      ...discussion,
      createdBy: userId ? +userId : null
    };

    return this.http.post<Discussion>(
      this.discussionUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  updateDiscussion(id: number, discussion: Partial<Discussion>): Observable<Discussion> {
    console.log('Updating discussion:', id);
    return this.http.put<Discussion>(
      `${this.discussionUrl}/${id}`,
      discussion,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteDiscussion(id: number): Observable<void> {
    console.log('Deleting discussion:', id);
    return this.http.delete<void>(`${this.discussionUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // Discussion Replies
  // ============================================

  replyToDiscussion(reply: Partial<DiscussionReply>): Observable<DiscussionReply> {
    const userId = localStorage.getItem('userId');
    console.log('Creating reply. UserId:', userId);

    const payload = {
      ...reply,
      createdBy: userId ? +userId : null
    };

    return this.http.post<DiscussionReply>(
      this.replyUrl,
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteReply(id: number): Observable<void> {
    console.log('Deleting reply:', id);
    return this.http.delete<void>(`${this.replyUrl}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ============================================
  // Meetings
  // ============================================

  /**
   * Récupère tous les meetings
   */
  getMeetings(): Observable<any[]> {
    const meetingUrl = `${this.baseUrl}/api/meetings`;
    console.log('[CollaborationService] Fetching all meetings:', meetingUrl);
    return this.http.get<any[]>(meetingUrl, { headers: this.getAuthHeaders() }).pipe(
      tap((meetings) => {
        console.log('[CollaborationService] ✅ Meetings fetched:', meetings?.length || 0);
      }),
      catchError(error => {
        console.error('[CollaborationService] ❌ Error fetching meetings:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  /**
   * Récupère un meeting par son ID
   */
  getMeetingById(id: number): Observable<any> {
    const meetingUrl = `${this.baseUrl}/api/meetings/${id}`;
    console.log('[CollaborationService] Fetching meeting:', id);
    return this.http.get<any>(meetingUrl, { headers: this.getAuthHeaders() }).pipe(
      tap((meeting) => {
        console.log('[CollaborationService] ✅ Meeting fetched:', meeting);
      }),
      catchError(error => {
        console.error('[CollaborationService] ❌ Error fetching meeting:', error);
        return throwError(() => error);
      })
    );
  }
}
