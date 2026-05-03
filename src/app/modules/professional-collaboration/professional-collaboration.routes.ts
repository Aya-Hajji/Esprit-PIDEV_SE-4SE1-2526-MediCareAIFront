import { Routes } from '@angular/router';
import { CollaborationListComponent } from './components/collaboration-list/collaboration-list.component';
import { CollaborationDetailComponent } from './components/collaboration-detail/collaboration-detail.component';
import { SessionEditorComponent } from './components/session-editor/session-editor.component';
import { MeetingListComponent } from './components/meeting-list/meeting-list.component';
import { MeetingDetailComponent } from './components/meeting-detail/meeting-detail.component';
import { MeetingSchedulerComponent } from './components/meeting-scheduler/meeting-scheduler.component';
import { DiscussionEditorComponent } from './components/discussion-editor/discussion-editor.component';
import { DocumentDetailComponent } from './components/document-detail/document-detail.component';
import { AcceptInviteComponent } from './components/accept-invite/accept-invite.component';
import { CreateMeetingComponent } from './components/create-meeting/create-meeting.component';
import { MeetingLiveComponent } from './components/meeting-live/meeting-live.component';
import { PVDisplayComponent } from './components/pv-display/pv-display.component';

export const PROFESSIONAL_COLLABORATION_ROUTES: Routes = [
  // ============================================
  // JITSI + PV ROUTES (Phase 1-8)
  // ============================================
  
  // Create Meeting (Phase 1) - singular
  {
    path: 'meetings/create',
    component: CreateMeetingComponent,
    data: { title: 'Créer une Réunion' }
  },
  
  // Meeting Live - Jitsi Integration (Phase 1-2) - plural
  {
    path: 'meetings/:meetingId/live',
    component: MeetingLiveComponent,
    data: { title: 'Réunion Jitsi' }
  },
  
  // PV Display (Phase 5-8) - plural
  {
    path: 'meetings/:meetingId/pv',
    component: PVDisplayComponent,
    data: { title: 'Procès-Verbal' }
  },
  
  // ============================================
  // EXISTING ROUTES
  // ============================================
  
  // Session/Collaboration Routes
  {
    path: 'create',
    component: SessionEditorComponent,
    data: { title: 'Créer une session' }
  },
  {
    path: 'edit/:id',
    component: SessionEditorComponent,
    data: { title: 'Éditer la session' }
  },
  // Meeting Routes (must be before :id)
  {
    path: 'meetings',
    component: MeetingListComponent,
    data: { title: 'Réunions Professionnelles' }
  },
  {
    path: 'meeting/create',
    component: MeetingSchedulerComponent,
    data: { title: 'Programmer une réunion' }
  },
  {
    path: 'meeting/edit/:id',
    component: MeetingSchedulerComponent,
    data: { title: 'Éditer la réunion' }
  },
  {
    path: 'meeting/:id',
    component: MeetingDetailComponent,
    data: { title: 'Détail de la réunion' }
  },
  // Discussions Routes
  {
    path: 'discussions/:id',
    component: DiscussionEditorComponent,
    data: { title: 'Discussions & Commentaires' }
  },
  // Document Detail Routes
  {
    path: 'document/:sessionId/:documentId',
    component: DocumentDetailComponent,
    data: { title: 'Détail du Document & Annotations' }
  },
  // Invitation Routes (must be before :id)
  {
    path: 'accept-invite/:token',
    component: AcceptInviteComponent,
    data: { title: 'Accepter l\'invitation' }
  },
  {
    path: ':sessionId/accept-invite/:token',
    component: AcceptInviteComponent,
    data: { title: 'Accepter l\'invitation' }
  },
  // Legacy redirects to support old links containing an extra "dashboard/" segment
  {
    path: 'dashboard/meetings/:meetingId/live',
    redirectTo: 'meetings/:meetingId/live',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/meeting/create',
    redirectTo: 'meetings/create',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/meetings/:meetingId/pv',
    redirectTo: 'meetings/:meetingId/pv',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/:sessionId/accept-invite/:token',
    redirectTo: ':sessionId/accept-invite/:token',
    pathMatch: 'full'
  },
  // Default and wildcard routes (must be last)
  {
    path: '',
    component: CollaborationListComponent,
    data: { title: 'Collaborations Professionnelles' }
  },
  {
    path: ':id',
    component: CollaborationDetailComponent,
    data: { title: 'Détail de la session' }
  }
];
