import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

// Standalone Components (ne pas les mettre dans declarations)
import { LandingComponent } from './landing/landing.component';
import { AdminComponent } from './modules/admin/components/admin-shell/admin.component';
import { LoginComponent } from './modules/user-auth/components/login/login.component';
import { SignupComponent } from './modules/user-auth/components/signup/signup.component';
import { ForgotPasswordComponent } from './modules/user-auth/components/forgot-password/forgot-password.component';

// Admin Standalone Components
import { DashboardComponent } from './modules/admin/components/dashboard/dashboard.component';
import { UserListComponent } from './modules/admin/components/user-management/user-list.component';
import { AppointmentListComponent } from './modules/admin/components/appointments/appointment-list.component';
import { MedicalManagementComponent } from './modules/admin/components/medical/medical-management.component';
import { EventsListComponent } from './modules/admin/components/events/events-list.component';
import { SubscriptionManagementComponent } from './modules/admin/components/subscriptions/subscription-management.component';
import { ForumManagementComponent } from './modules/admin/components/forum/forum-management.component';

import { AuthInterceptor } from './services/auth.interceptor';

@NgModule({
  declarations: [
    App,                    // Seul le composant root reste généralement ici
    // NE PAS mettre ici les composants standalone (Login, Signup, ForgotPassword, etc.)
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,

    // Import des composants standalone directement
    LandingComponent,
    AdminComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent,

    // Admin components (standalone)
    DashboardComponent,
    UserListComponent,
    AppointmentListComponent,
    MedicalManagementComponent,
    EventsListComponent,
    SubscriptionManagementComponent,
    ForumManagementComponent
  ],
  providers: [
    provideHttpClient(
      withInterceptorsFromDi()
    ),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }