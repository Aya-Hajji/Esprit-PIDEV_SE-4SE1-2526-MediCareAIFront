import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const APPOINTMENTS_SCHEDULING_ROUTES: Routes = [
  {
    path: 'appointments',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('../admin/components/appointments/appointment-list.component').then((m) => m.AppointmentListComponent)
      },
      {
        path: '',
        loadComponent: () => import('../admin/components/appointments/appointment-list.component').then((m) => m.AppointmentListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('../admin/components/appointments/appointment-create.component').then((m) => m.AppointmentCreateComponent)
      },
      {
        path: 'availability',
        loadComponent: () => import('../admin/components/appointments/availability-picker.component').then((m) => m.AvailabilityPickerComponent)
      },
      {
        path: 'session/:id',
        loadComponent: () => import('../admin/components/appointments/teleconsultation-session.component').then((m) => m.TeleconsultationSessionComponent)
      },
      {
        path: 'details/:id',
        loadComponent: () => import('../admin/components/appointments/appointment-details.component').then((m) => m.AppointmentDetailsComponent)
      },
      {
        path: 'reminders',
        loadComponent: () => import('../admin/components/appointments/appointment-reminders.component').then((m) => m.AppointmentRemindersComponent)
      }
    ]
  }
];
