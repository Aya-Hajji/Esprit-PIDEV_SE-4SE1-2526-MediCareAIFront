import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LandingComponent } from './landing/landing.component';
import { AdminComponent } from './modules/admin/components/admin-shell/admin.component';
import { LoginComponent } from './modules/user-auth/components/login/login.component';
import { SignupComponent } from './modules/user-auth/components/signup/signup.component';
import { ForgotPasswordComponent } from './modules/user-auth/components/forgot-password/forgot-password.component';
import { AuthInterceptor } from './services/auth.interceptor';

// Admin Module Components
import { DashboardComponent } from './modules/admin/components/dashboard/dashboard.component';
import { UserListComponent } from './modules/admin/components/user-management/user-list.component';
import { AppointmentListComponent } from './modules/admin/components/appointments/appointment-list.component';
import { MedicalManagementComponent } from './modules/admin/components/medical/medical-management.component';
import { EventsListComponent } from './modules/admin/components/events/events-list.component';
import { SubscriptionManagementComponent } from './modules/admin/components/subscriptions/subscription-management.component';
import { ForumManagementComponent } from './modules/admin/components/forum/forum-management.component';

@NgModule({
  declarations: [
    App,
    LandingComponent,
    AdminComponent,
    LoginComponent,
    SignupComponent,
    ForgotPasswordComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    FormsModule,
    // Admin Module Components (Standalone)
    DashboardComponent,
    UserListComponent,
    AppointmentListComponent,
    MedicalManagementComponent,
    EventsListComponent,
    SubscriptionManagementComponent,
    ForumManagementComponent
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
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
