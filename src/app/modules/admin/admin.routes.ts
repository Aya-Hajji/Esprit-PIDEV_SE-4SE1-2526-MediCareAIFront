import { Routes } from '@angular/router';

import { AdminComponent } from './components/admin-shell/admin.component';
import { AppointmentCreateComponent } from './components/appointments/appointment-create.component';
import { AppointmentListComponent } from './components/appointments/appointment-list.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EventsListComponent } from './components/events/events-list.component';
import { ForumManagementComponent } from './components/forum/forum-management.component';
import { MedicalManagementComponent } from './components/medical/medical-management.component';
import { SubscriptionManagementComponent } from './components/subscriptions/subscription-management.component';
import { UserCreateComponent } from './components/user-management/user-create.component';
import { UserListComponent } from './components/user-management/user-list.component';
import { AuthGuard } from '../../services/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UserListComponent },
      { path: 'users/create', component: UserCreateComponent },
      { path: 'appointments', component: AppointmentListComponent },
      { path: 'appointments/create', component: AppointmentCreateComponent },
      { path: 'medical', component: MedicalManagementComponent },
      { path: 'events', component: EventsListComponent },
      { path: 'subscriptions', component: SubscriptionManagementComponent },
      { path: 'forum', component: ForumManagementComponent }
    ]
  }
];
