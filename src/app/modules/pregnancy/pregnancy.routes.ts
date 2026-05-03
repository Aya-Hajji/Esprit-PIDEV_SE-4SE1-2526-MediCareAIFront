import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const PREGNANCY_ROUTES: Routes = [
  {
    path: 'pregnancy',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./pregnancy.component').then((m) => m.PregnancyComponent)
      },
      {
        path: 'tracking',
        loadComponent: () => import('./pages/tracking/tracking.component').then((m) => m.TrackingComponent)
      },
      {
        path: 'checkup',
        loadComponent: () => import('./pages/checkup/checkup.component').then((m) => m.CheckupComponent)
      }
    ]
  }
];
