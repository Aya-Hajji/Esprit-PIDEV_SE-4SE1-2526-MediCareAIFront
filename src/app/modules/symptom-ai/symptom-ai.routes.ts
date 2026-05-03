import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const SYMPTOM_AI_ROUTES: Routes = [
  {
    path: 'symptom-ai',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./symptom-ai.component').then((m) => m.SymptomAiComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./symptom-ai.component').then((m) => m.SymptomAiComponent)
      }
    ]
  }
];
