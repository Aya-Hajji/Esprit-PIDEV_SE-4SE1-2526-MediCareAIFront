import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const MEDICAL_RECORD_ROUTES: Routes = [
  {
    path: 'medical-record',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR'] },
    children: [
      {
        path: '',
        loadComponent: () => import('../admin/components/medical/medical-management.component').then((m) => m.MedicalManagementComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('../admin/components/medical/medical-management.component').then((m) => m.MedicalManagementComponent)
      }
    ]
  }
];
