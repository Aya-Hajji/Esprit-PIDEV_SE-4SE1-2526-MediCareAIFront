# Module 2 Usage Examples 📚

## Component Usage

### Displaying Collaboration Sessions

```typescript
// In your component
import { CollaborationListComponent } from '@modules/professional-collaboration';

// The component is standalone and can be used directly in templates
// Route to: /professional-collaboration
```

Template usage:
```html
<app-collaboration-list></app-collaboration-list>
```

### Creating a Collaboration Session

```typescript
// Programmatically create a session
import { CollaborationService } from '@modules/professional-collaboration';

export class MyComponent {
  constructor(private collaborationService: CollaborationService) {}

  createSession() {
    const newSession = {
      title: 'Case Review - Cardiac Arrhythmia',
      description: 'Multidisciplinary review of cardiac case',
      caseNumber: 'CASE-2024-001',
      category: 'CARDIOLOGY',
      maxParticipants: 10
    };

    this.collaborationService.createSession(newSession).subscribe({
      next: (session) => {
        console.log('Session created:', session);
        // Navigate to session details
      },
      error: (error) => {
        console.error('Failed to create session:', error);
      }
    });
  }
}
```

### Getting Session Details

```typescript
export class SessionDetailComponent implements OnInit {
  session$ = this.collaborationService.currentSession$;

  constructor(private collaborationService: CollaborationService) {}

  ngOnInit() {
    // Triggered when user clicks on a session
    // The service automatically updates currentSession$
  }
}
```

### Uploading Documents

```typescript
// In collaboration-detail component
export class MyComponent {
  constructor(private collaborationService: CollaborationService) {}

  onFileSelected(event: any, sessionId: number) {
    const file = event.target.files[0];
    const description = 'CT scan results';

    this.collaborationService.uploadDocument(sessionId, file, description)
      .subscribe({
        next: (doc) => {
          console.log('Document uploaded:', doc);
          // Refresh document list
        },
        error: (error) => {
          console.error('Upload failed:', error);
        }
      });
  }
}
```

### Adding Annotations

```typescript
export class AnnotationComponent {
  constructor(private collaborationService: CollaborationService) {}

  addCommentAnnotation(documentId: number, position: { x: number; y: number }) {
    const annotation = {
      content: 'This area requires further analysis',
      x: position.x,
      y: position.y,
      pageNumber: 1,
      color: '#FF5252',
      type: 'COMMENT'
    };

    this.collaborationService.createAnnotation(documentId, annotation)
      .subscribe({
        next: (anno) => {
          console.log('Annotation created:', anno);
          // Update UI to show new annotation
        },
        error: (error) => {
          console.error('Failed to create annotation:', error);
        }
      });
  }

  highlightText(documentId: number, selection: { x: number; y: number; width: number; height: number }) {
    const annotation = {
      content: 'Important finding',
      x: selection.x,
      y: selection.y,
      pageNumber: 1,
      color: '#FFEB3B',
      type: 'HIGHLIGHT'
    };

    this.collaborationService.createAnnotation(documentId, annotation).subscribe();
  }
}
```

### Managing Meetings

```typescript
export class MeetingComponent {
  constructor(private meetingService: MeetingService) {}

  // Schedule a new meeting
  scheduleMeeting() {
    const meeting = {
      title: 'Weekly Team Standup',
      description: 'Discussion of current cases',
      scheduledDate: '2024-02-20',
      scheduledTime: '15:30',
      duration: 60,
      venue: 'VIRTUAL',
      meetingLink: 'https://teams.microsoft.com/...',
      status: 'SCHEDULED',
      isRecorded: true
    };

    this.meetingService.createMeeting(meeting).subscribe({
      next: (meeting) => {
        console.log('Meeting scheduled:', meeting);
      },
      error: (error) => {
        console.error('Failed to schedule meeting:', error);
      }
    });
  }

  // Get upcoming meetings
  getUpcomingMeetings() {
    this.meetingService.getUpcomingMeetings().subscribe({
      next: (meetings) => {
        console.log('Upcoming meetings:', meetings);
        // Update calendar view
      }
    });
  }

  // Check if meeting is in progress
  isMeetingLive(meeting: MeetingExtended): boolean {
    return this.meetingService.isOngoing(meeting);
  }

  // Join a meeting
  joinMeeting(meeting: MeetingExtended) {
    if (this.meetingService.isOngoing(meeting)) {
      window.open(meeting.meetingLink, '_blank');
    }
  }

  // Get time until meeting
  getTimeRemaining(meeting: MeetingExtended): string {
    return this.meetingService.getTimeUntilMeeting(meeting);
  }
}
```

## Service Integration Examples

### In a Dashboard Component

```typescript
import { Component, OnInit } from '@angular/core';
import { CollaborationService, MeetingService } from '@modules/professional-collaboration';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <h2>My Active Sessions</h2>
      <div *ngFor="let session of activeSessions$ | async">
        <h3>{{ session.title }}</h3>
        <p>Participants: {{ session.participantCount }}/{{ session.maxParticipants }}</p>
      </div>

      <h2>Upcoming Meetings</h2>
      <div *ngFor="let meeting of upcomingMeetings$ | async">
        <h3>{{ meeting.title }}</h3>
        <p>{{ meeting.scheduledTime }}</p>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  activeSessions$: Observable<any>;
  upcomingMeetings$: Observable<any>;

  constructor(
    private collaborationService: CollaborationService,
    private meetingService: MeetingService
  ) {}

  ngOnInit() {
    this.activeSessions$ = this.collaborationService.getAllSessions({
      status: 'ACTIVE'
    });

    this.upcomingMeetings$ = this.meetingService.getUpcomingMeetings();
  }
}
```

### Searching and Filtering

```typescript
export class SearchComponent {
  constructor(private collaborationService: CollaborationService) {}

  searchSessions(query: string) {
    const filter = {
      searchTerm: query,
      sortBy: 'recent'
    };

    this.collaborationService.getAllSessions(filter).subscribe({
      next: (sessions) => {
        console.log('Search results:', sessions);
      }
    });
  }

  filterByCategory(category: string) {
    const filter = {
      sortBy: 'name'
    };

    // Backend would filter by category
    // Frontend can use the searchTerm for client-side filtering
  }

  filterByCaseNumber(caseNumber: string) {
    const filter = {
      caseNumber: caseNumber
    };

    this.collaborationService.getAllSessions(filter).subscribe({
      next: (sessions) => {
        console.log('Sessions for case:', sessions);
      }
    });
  }
}
```

## Reactive Forms Integration

### Session Creation Form

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export class SessionFormComponent {
  sessionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private collaborationService: CollaborationService
  ) {
    this.sessionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      caseNumber: ['', Validators.required],
      category: ['OTHER'],
      maxParticipants: [10, Validators.min(2)]
    });
  }

  submitForm() {
    if (this.sessionForm.valid) {
      this.collaborationService.createSession(this.sessionForm.value)
        .subscribe();
    }
  }
}
```

## Error Handling

```typescript
export class ErrorHandlingComponent {
  constructor(private collaborationService: CollaborationService) {}

  loadSessionWithErrorHandling(id: number) {
    this.collaborationService.getSessionById(id).subscribe({
      next: (session) => {
        console.log('Session loaded successfully');
      },
      error: (error) => {
        // Handle specific error types
        if (error.status === 404) {
          console.error('Session not found');
        } else if (error.status === 403) {
          console.error('Access denied');
        } else if (error.status === 500) {
          console.error('Server error');
        }

        // Show user-friendly message
        this.showErrorNotification('Failed to load session');
      }
    });
  }

  private showErrorNotification(message: string) {
    // Implement your notification system
    alert(message);
  }
}
```

## State Management

### Using Services as State

```typescript
export class StateComponent implements OnInit {
  sessions$ = this.collaborationService.sessions$;

  constructor(private collaborationService: CollaborationService) {}

  ngOnInit() {
    // Load sessions (updates the BehaviorSubject)
    this.collaborationService.getAllSessions().subscribe();

    // Subscribe to reactive updates
    this.sessions$.subscribe(sessions => {
      console.log('Sessions updated:', sessions);
    });
  }

  addSessionToState(session: any) {
    this.collaborationService.createSession(session).subscribe();
    // Service updates sessions$ automatically
  }
}
```

## Real-World Scenarios

### Scenario 1: Doctor Reviews Medical Case

```typescript
export class CaseReviewComponent implements OnInit {
  sessionId = 1; // From route params
  documents$ = new Observable();
  annotations$ = new Observable();

  constructor(private collaborationService: CollaborationService) {}

  ngOnInit() {
    // Load session documents
    this.documents$ = this.collaborationService.getSessionDocuments(this.sessionId);

    // Watch for annotations on first document
    this.documents$.subscribe(docs => {
      if (docs.length > 0) {
        this.annotations$ = this.collaborationService.getDocumentAnnotations(docs[0].id);
      }
    });
  }

  // Doctor adds comment on specific area
  addCommentOnImage(x: number, y: number, text: string) {
    this.documents$.pipe(
      switchMap(docs => {
        const firstDoc = docs[0];
        return this.collaborationService.createAnnotation(firstDoc.id, {
          content: text,
          x, y, pageNumber: 1,
          color: '#FF5252',
          type: 'COMMENT'
        });
      })
    ).subscribe();
  }
}
```

### Scenario 2: Scheduling Team Meeting

```typescript
export class MeetingSetupComponent {
  constructor(private meetingService: MeetingService) {}

  scheduleTeamMeeting() {
    const meeting = {
      title: 'Quarterly Case Review',
      description: 'Review of complex cases from Q1',
      scheduledDate: '2024-03-15',
      scheduledTime: '14:00',
      duration: 120,
      venue: 'VIRTUAL',
      meetingLink: 'https://teams.microsoft.com/l/meetup-join/...',
      status: 'SCHEDULED',
      isRecorded: true
    };

    this.meetingService.createMeeting(meeting).subscribe({
      next: (meeting) => {
        console.log('Meeting created with ID:', meeting.id);
        // Send invitations to participants
        // Update calendar
        // Save to database
      }
    });
  }
}
```

## TypeScript Interfaces

Use these for type safety:

```typescript
import {
  SessionExtended,
  MeetingExtended,
  SharedDocument,
  DocumentAnnotation,
  Participant,
  MeetingParticipant
} from '@modules/professional-collaboration';

// In your components
collaborations: SessionExtended[] = [];
meetings: MeetingExtended[] = [];
document: SharedDocument;
annotation: DocumentAnnotation;
```

---

**Note**: Replace `@modules/professional-collaboration` with actual import paths based on your project structure.
