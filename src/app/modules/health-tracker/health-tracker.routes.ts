import { Routes } from '@angular/router';

import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const HEALTH_TRACKER_ROUTES: Routes = [
  {
    path: 'health-tracker',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'PATIENT'] },
    children: [
      {
        path: '',
        loadComponent: () => import('./health-tracker.component').then((m) => m.HealthTrackerComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent)
      },
      {
        path: 'metrics',
        loadComponent: () => import('./pages/metrics/metrics.component').then((m) => m.MetricsComponent)
      },
      {
        path: 'mood',
        loadComponent: () => import('./pages/mood/mood.component').then((m) => m.MoodComponent)
      },
      {
        path: 'sleep',
        loadComponent: () => import('./pages/sleep/sleep.component').then((m) => m.SleepComponent)
      },
      {
        path: 'stress',
        loadComponent: () => import('./pages/stress/stress.component').then((m) => m.StressComponent)
      },
      {
        path: 'nutrition-ai',
        loadComponent: () => import('./pages/nutrition-ai/nutrition-ai.component').then((m) => m.NutritionAiComponent)
      },
      {
        path: 'medication/reminder',
        loadComponent: () =>
          import('./pages/medication/reminder/reminder.component').then((m) => m.ReminderComponent)
      },
      {
        path: 'medication/schedule',
        loadComponent: () =>
          import('./pages/medication/schedule/schedule.component').then((m) => m.ScheduleComponent)
      }
    ]
  }
];
