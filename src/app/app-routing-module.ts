import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { ADMIN_ROUTES } from './modules/admin/admin.routes';
import { APPOINTMENTS_SCHEDULING_ROUTES } from './modules/appointments-scheduling/appointments-scheduling.routes';
import { COLLABORATION_ROUTES } from './modules/collaboration/collaboration.routes';
import { COMMUNITY_EVENTS_ROUTES } from './modules/community-events/community-events.routes';
import { E_PHARMACY_ROUTES } from './modules/e-pharmacy/e-pharmacy.routes';
import { HEALTH_TRACKER_ROUTES } from './modules/health-tracker/health-tracker.routes';
import { MEDICAL_RECORD_ROUTES } from './modules/medical-record/medical-record.routes';
import { PREGNANCY_ROUTES } from './modules/pregnancy/pregnancy.routes';
import { SYMPTOM_AI_ROUTES } from './modules/symptom-ai/symptom-ai.routes';
import { USER_AUTH_ROUTES } from './modules/user-auth/user-auth.routes';
import { PATIENT_ROUTES } from './modules/patient/patient.routes';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'nutrition-ai', redirectTo: 'health-tracker/nutrition-ai', pathMatch: 'full' },
  ...USER_AUTH_ROUTES,
  ...PATIENT_ROUTES,
  ...MEDICAL_RECORD_ROUTES,
  ...APPOINTMENTS_SCHEDULING_ROUTES,
  ...SYMPTOM_AI_ROUTES,
  ...E_PHARMACY_ROUTES,
  ...HEALTH_TRACKER_ROUTES,
  ...PREGNANCY_ROUTES,
  ...COLLABORATION_ROUTES,
  ...COMMUNITY_EVENTS_ROUTES,
  ...ADMIN_ROUTES,
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
