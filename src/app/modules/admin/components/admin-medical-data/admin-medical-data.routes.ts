import { Routes } from '@angular/router';
import { AuthGuard } from '../../../../services/auth.guard';
import { DashboardShellComponent } from '../../../../shared/components/dashboard-shell/dashboard-shell.component';

export const ADMIN_MEDICAL_ROUTES: Routes = [
  {
    path: 'admin-medical',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./admin-medical-data.component').then((m) => m.AdminMedicalDataComponent)
      }
    ]
  }
];