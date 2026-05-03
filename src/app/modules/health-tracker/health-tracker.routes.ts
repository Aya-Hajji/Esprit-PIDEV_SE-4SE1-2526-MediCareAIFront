import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const HEALTH_TRACKER_ROUTES: Routes = [
  {
    path: 'health-tracker',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./health-tracker.component').then((m) => m.HealthTrackerComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./health-tracker.component').then((m) => m.HealthTrackerComponent)
      }
    ]
  }
];
