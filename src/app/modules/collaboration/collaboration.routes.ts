import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const COLLABORATION_ROUTES: Routes = [
  {
    path: 'collaboration',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./collaboration.component').then((m) => m.CollaborationComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./collaboration.component').then((m) => m.CollaborationComponent)
      }
    ]
  }
];
