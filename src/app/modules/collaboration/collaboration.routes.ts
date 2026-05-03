import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';
import { PROFESSIONAL_COLLABORATION_ROUTES } from '../professional-collaboration/professional-collaboration.routes';
import { MeetingLiveComponent } from '../professional-collaboration/components/meeting-live/meeting-live.component';

export const COLLABORATION_ROUTES: Routes = [
  // ── Public route: live meeting accessible without login ──────────────────
  // Participants can join directly via shared link without an account
  {
    path: 'collaboration/dashboard/meetings/:meetingId/live',
    component: MeetingLiveComponent,
    data: { title: 'Live Meeting' }
  },

  // ── Authenticated routes ─────────────────────────────────────────────────
  {
    path: 'collaboration',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        children: PROFESSIONAL_COLLABORATION_ROUTES
      },
      {
        path: 'overview',
        loadComponent: () => import('./collaboration.component').then((m) => m.CollaborationComponent)
      }
    ]
  }
];
