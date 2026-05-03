import { Routes } from '@angular/router';
import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const PATIENT_ROUTES: Routes = [
  {
    path: 'patient',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['PATIENT'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/patient-dashboard/patient-dashboard.component').then((m) => m.PatientDashboardComponent)
      },
      {
        path: 'dasshboard',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'health-profile',
        loadComponent: () => import('./pages/health-profile/health-profile.component').then((m) => m.HealthProfileComponent)
      },
      {
        path: 'medical-history',
        loadComponent: () => import('./pages/medical-history/medical-history.component').then((m) => m.MedicalHistoryComponent)
      },
      {
        path: 'appointments',
        loadComponent: () => import('./pages/appointments-list/appointments-list.component').then((m) => m.AppointmentsListComponent)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./pages/prescriptions/prescriptions.component').then((m) => m.PrescriptionsComponent)
      },
      {
        path: 'health-records',
        loadComponent: () => import('./pages/health-records/health-records.component').then((m) => m.HealthRecordsComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./pages/messages/messages.component').then((m) => m.MessagesComponent)
      },
      {
        path: 'insurance',
        loadComponent: () => import('./pages/insurance/insurance.component').then((m) => m.InsuranceComponent)
      }
    ]
  }
];
