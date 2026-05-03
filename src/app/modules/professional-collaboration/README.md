# Module 2: Professional Collaboration & Meetings 🏥

## Overview

The Professional Collaboration Module enables healthcare professionals to collaborate on medical cases, share documents, annotate in real-time, and schedule virtual meetings. This module is built with modern Angular 21.1.0 standalone components for maximum flexibility and performance.

## Features

### 1. **Collaborative Sessions** 🤝
- Create and manage medical case collaboration sessions
- Assign different roles: ORGANIZER, EDITOR, VIEWER
- Add participants and manage permissions
- Track session status: PENDING, ACTIVE, COMPLETED, ARCHIVED

### 2. **Document Sharing** 📄
- Upload medical documents (PDFs, images, reports)
- Organize documents by session
- Track document metadata (size, upload date, author)
- Delete and manage document access

### 3. **Real-time Annotations** 🖍️
- Comment on documents with specific positions
- Highlight important sections
- Add arrows and visual markers
- Support multiple annotation types with color coding

### 4. **Virtual Meetings** 🎥
- Schedule professional meetings with datetime
- Set meeting duration and venue type (Virtual/In-person/Hybrid)
- Manage meeting links for video conferences (Teams, Zoom, etc.)
- Track meeting status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
- Record meetings for future reference
- Automatic participant invitations

## Architecture

```
professional-collaboration/
├── components/
│   ├── collaboration-list/          # Display all collaboration sessions
│   ├── collaboration-detail/        # Detailed view with tabs
│   ├── session-editor/              # Create/edit sessions
│   ├── meeting-list/                # Display all meetings
│   ├── meeting-detail/              # Detailed meeting view
│   └── meeting-scheduler/           # Schedule meetings
├── services/
│   ├── collaboration.service.ts     # CRUD for sessions, documents, annotations
│   └── meeting.service.service.ts   # CRUD for meetings
├── models/
│   └── collaboration.model.ts       # TypeScript interfaces
└── professional-collaboration.routes.ts  # Routing configuration
```

## Service Layer

### CollaborationService
Handles all collaboration-related operations:

```typescript
// Sessions
getAllSessions(filter?: CollaborationFilter): Observable<SessionExtended[]>
getSessionById(id: number): Observable<SessionExtended>
createSession(session: Partial<SessionExtended>): Observable<SessionExtended>
updateSession(id: number, session: Partial<SessionExtended>): Observable<SessionExtended>
deleteSession(id: number): Observable<void>

// Documents
getSessionDocuments(sessionId: number): Observable<SharedDocument[]>
uploadDocument(sessionId: number, file: File, description?: string): Observable<SharedDocument>
deleteDocument(documentId: number): Observable<void>

// Annotations
getDocumentAnnotations(documentId: number): Observable<DocumentAnnotation[]>
createAnnotation(documentId: number, annotation: Partial<DocumentAnnotation>): Observable<DocumentAnnotation>
updateAnnotation(id: number, annotation: Partial<DocumentAnnotation>): Observable<DocumentAnnotation>
deleteAnnotation(id: number): Observable<void>
```

### MeetingService
Manages meeting scheduling and lifecycle:

```typescript
// Meetings CRUD
getAllMeetings(filter?: MeetingFilter): Observable<MeetingExtended[]>
getMeetingById(id: number): Observable<MeetingExtended>
createMeeting(meeting: Partial<MeetingExtended>): Observable<MeetingExtended>
updateMeeting(id: number, meeting: Partial<MeetingExtended>): Observable<MeetingExtended>
deleteMeeting(id: number): Observable<void>

// Helper Methods
getUpcomingMeetings(): Observable<MeetingExtended[]>
getCompletedMeetings(): Observable<MeetingExtended[]>
isUpcoming(meeting: MeetingExtended): boolean
isPast(meeting: MeetingExtended): boolean
isOngoing(meeting: MeetingExtended): boolean
getTimeUntilMeeting(meeting: MeetingExtended): string
```

## API Endpoints

### Session Management
```
GET    /api/collaboration/sessions           - List all sessions
POST   /api/collaboration/sessions           - Create new session
GET    /api/collaboration/sessions/{id}      - Get session details
PUT    /api/collaboration/sessions/{id}      - Update session
DELETE /api/collaboration/sessions/{id}      - Delete session
```

### Document Management
```
GET    /api/collaboration/documents/sessions/{sessionId}   - List documents
POST   /api/collaboration/documents/sessions/{sessionId}   - Upload document
GET    /api/collaboration/documents/{id}                    - Download document
DELETE /api/collaboration/documents/{id}                    - Delete document
```

### Annotations
```
GET    /api/collaboration/annotations/documents/{documentId}  - List annotations
POST   /api/collaboration/annotations/documents/{documentId}  - Create annotation
PUT    /api/collaboration/annotations/{id}                    - Update annotation
DELETE /api/collaboration/annotations/{id}                    - Delete annotation
```

### Meeting Management
```
GET    /api/meetings                  - List all meetings
POST   /api/meetings                  - Create meeting
GET    /api/meetings/{id}             - Get meeting details
PUT    /api/meetings/{id}             - Update meeting
DELETE /api/meetings/{id}             - Delete meeting
```

## Data Models

### Session
```typescript
interface SessionExtended {
  id: number;
  title: string;
  description: string;
  caseNumber: string;
  category?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  organizerId: number;
  organizerName?: string;
  createdAt: string;
  updatedAt?: string;
  maxParticipants: number;
  participantCount?: number;
  documentCount?: number;
  participants?: Participant[];
  documents?: SharedDocument[];
  isOrganicer?: boolean;
  membershipRole?: 'ORGANIZER' | 'EDITOR' | 'VIEWER';
  membershipStatus?: string;
}
```

### Meeting
```typescript
interface MeetingExtended {
  id: number;
  title: string;
  description: string;
  organizerId: number;
  organizerName?: string;
  scheduledDate: string;
  scheduledTime: string;
  scheduledDateTime?: string;
  duration: number;
  venue: string;
  meetingLink: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  isRecorded: boolean;
  recordingUrl?: string;
  createdAt?: string;
  participants?: MeetingParticipant[];
  participantCount?: number;
  isOrganizer?: boolean;
  isUpcoming?: boolean;
  isPast?: boolean;
  isOngoing?: boolean;
}
```

## Components

### CollaborationListComponent
- Grid view of collaboration sessions
- Search, filter, and sort functionality
- Quick actions (edit, delete)
- Permission-based UI visibility
- Responsive design with mobile support

### SessionEditorComponent
- Form-based session creation/editing
- Real-time character counter
- Form validation with detailed error messages
- Category and status selectors
- Draft auto-save support (future enhancement)

### MeetingListComponent
- Grid view of meetings
- Status badges with color coding
- Search and filter by status
- "Join meeting" button for upcoming/ongoing meetings
- Time until meeting countdown

### MeetingSchedulerComponent
- Date and time pickers
- Duration selector with warnings
- Automatic meeting link generation
- Recording toggle
- Info box with participant expectations

### CollaborationDetailComponent
- Tabbed interface (Overview, Documents, Participants)
- Document upload and management
- File preview support
- Participant list with roles
- Document annotation history

### MeetingDetailComponent
- Meeting overview card
- Participant list with status badges
- Live status indicator for ongoing meetings
- Time countdown for upcoming meetings
- Direct join functionality

## Authentication & Security

All requests to protected endpoints include:
- JWT Bearer token from localStorage ('authToken')
- User context from localStorage ('userId')
- Content-Type: application/json headers

```typescript
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
```

## Routing

Integration in main app routes:
```typescript
{
  path: 'professional-collaboration',
  loadChildren: () => import('./modules/professional-collaboration').then(m => m.PROFESSIONAL_COLLABORATION_ROUTES)
}
```

## Styling & Design

- **Primary Gradient**: #667eea → #764ba2
- **Accent Green**: #4CAF50 (success actions)
- **Accent Red**: #ff6b6b (alerts/premium)
- **Background**: #f5f7fa → #c3cfe2 (gradient)
- **Responsive Breakpoint**: 768px
- **Card-based Layout** with hover effects and smooth transitions

## File Upload

Document upload uses FormData and multipart/form-data encoding:

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('description', description);

this.http.post<SharedDocument>(
  `${this.documentUrl}/sessions/${sessionId}`,
  formData,
  { headers }
);
```

## Performance Optimization

- Lazy-loaded module
- Standalone components (no NgModule)
- BehaviorSubject for reactive state
- OnPush change detection ready
- Minimal re-renders with proper trackBy functions

## Testing

The module is structured for easy unit testing:
- Services with dependency injection
- Pure components with inputs
- Observable-based data flow
- FormGroup-based form handling

## Troubleshooting

### Authentication Issues
- Verify JWT token exists in localStorage
- Check 'authToken' key is used consistently
- Review browser DevTools Network tab for Authorization header

### File Upload Errors
- Ensure FormData is used for file uploads
- Check file size limits on backend
- Verify CORS is configured correctly

### Missing Data
- Check API endpoints match backend routes
- Verify filter parameters are correct
- Enable console logging in services for debugging

## Future Enhancements

1. **Real-time Collaboration**
   - WebSocket for live annotations
   - Real-time participant presence

2. **Document Versioning**
   - Track document history
   - Compare versions
   - Restore previous versions

3. **Meeting Recording Integration**
   - Automatic transcription
   - Timestamp search in recordings
   - Chapter markers

4. **Advanced Filtering**
   - Save favorite filters
   - Custom date ranges
   - Tag-based search

5. **Notifications**
   - Email invitations
   - In-app notifications
   - Meeting reminders

## Related Documentation

- [Integration Guide](./INTEGRATION_GUIDE.md) - How to integrate with main app
- [Usage Examples](./USAGE_EXAMPLES.md) - Code examples for common tasks
- [Debug Guide](./DEBUG_GUIDE.md) - Troubleshooting and debugging
