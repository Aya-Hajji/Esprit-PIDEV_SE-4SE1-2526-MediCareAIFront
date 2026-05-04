import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const COMMUNITY_EVENTS_ROUTES: Routes = [
  {
    path: 'community',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    children: [
      {
        path: 'forums',
        loadComponent: () => import('../admin/components/forum/forum-management.component').then((m) => m.ForumManagementComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('../admin/components/events/events-list.component').then((m) => m.EventsListComponent)
      },
      {
        path: 'subscriptions',
        loadComponent: () => import('../admin/components/subscriptions/subscription-management.component').then((m) => m.SubscriptionManagementComponent)
      }
    ]
  }
];
