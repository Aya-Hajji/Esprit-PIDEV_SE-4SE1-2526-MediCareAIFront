import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';
import { PROFESSIONAL_COLLABORATION_ROUTES } from '../professional-collaboration/professional-collaboration.routes';

export const COLLABORATION_ROUTES: Routes = [
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
      }
    ]
  }
];
