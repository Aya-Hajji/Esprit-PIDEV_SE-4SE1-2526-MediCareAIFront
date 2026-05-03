import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CollaborationSession, SharedDocument, Annotation, Meeting } from '../models/collaboration.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private sessionUrl = `${environment.apiUrl}/collaboration/sessions`;
  private documentUrl = `${environment.apiUrl}/collaboration/documents`;
  private annotationUrl = `${environment.apiUrl}/collaboration/annotations`;
  private meetingUrl = `${environment.apiUrl}/meetings`;

  constructor(private http: HttpClient) {}

  // Collaboration Sessions
  createSession(session: Partial<CollaborationSession>): Observable<CollaborationSession> {
    return this.http.post<CollaborationSession>(this.sessionUrl, session);
  }

  getSessionById(id: number): Observable<CollaborationSession> {
    return this.http.get<CollaborationSession>(`${this.sessionUrl}/${id}`);
  }

  getSessionsByCreator(creatorId: number): Observable<CollaborationSession[]> {
    return this.http.get<CollaborationSession[]>(`${this.sessionUrl}/creator/${creatorId}`);
  }

  deleteSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.sessionUrl}/${id}`);
  }

  // Shared Documents
  getSessionDocuments(sessionId: number): Observable<SharedDocument[]> {
    return this.http.get<SharedDocument[]>(`${this.documentUrl}/sessions/${sessionId}`);
  }

  getDocumentById(id: number): Observable<SharedDocument> {
    return this.http.get<SharedDocument>(`${this.documentUrl}/${id}`);
  }

  uploadDocument(sessionId: number, document: FormData): Observable<SharedDocument> {
    return this.http.post<SharedDocument>(`${this.documentUrl}/sessions/${sessionId}`, document);
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.documentUrl}/${id}`);
  }

  // Annotations
  getDocumentAnnotations(documentId: number): Observable<Annotation[]> {
    return this.http.get<Annotation[]>(`${this.annotationUrl}/documents/${documentId}`);
  }

  getAnnotationById(id: number): Observable<Annotation> {
    return this.http.get<Annotation>(`${this.annotationUrl}/${id}`);
  }

  createAnnotation(documentId: number, annotation: Annotation): Observable<Annotation> {
    return this.http.post<Annotation>(`${this.annotationUrl}/documents/${documentId}`, annotation);
  }

  updateAnnotation(id: number, annotation: Partial<Annotation>): Observable<Annotation> {
    return this.http.put<Annotation>(`${this.annotationUrl}/${id}`, annotation);
  }

  deleteAnnotation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.annotationUrl}/${id}`);
  }

  // Meetings
  createMeeting(meeting: Partial<Meeting>): Observable<Meeting> {
    return this.http.post<Meeting>(this.meetingUrl, meeting);
  }

  getMeetingById(id: number): Observable<Meeting> {
    return this.http.get<Meeting>(`${this.meetingUrl}/${id}`);
  }

  getUpcomingMeetings(): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.meetingUrl}/upcoming`);
  }

  deleteMeeting(id: number): Observable<void> {
    return this.http.delete<void>(`${this.meetingUrl}/${id}`);
  }
}
