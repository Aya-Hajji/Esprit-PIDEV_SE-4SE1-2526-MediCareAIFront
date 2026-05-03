import { Routes } from '@angular/router';
import { ForumListComponent } from './components/forum-list/forum-list.component';
import { ForumDetailComponent } from './components/forum-detail/forum-detail.component';
import { PostEditorComponent } from './components/post-editor/post-editor.component';
import { SubscriptionPlansEnhancedComponent } from './components/subscription-plans/subscription-plans-enhanced.component';
import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

// Routes principales du forum avec DashboardShellComponent
export const COMMUNITY_FORUM_ROUTES: Routes = [
  {
    path: 'community/forums',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: ForumListComponent,
        data: { title: 'Forum de Discussion' }
      },
      {
        path: 'post/:id',
        component: ForumDetailComponent,
        data: { title: 'Détail du Post' }
      },
      {
        path: 'create-post',
        component: PostEditorComponent,
        data: { title: 'Créer une discussion' }
      },
      {
        path: 'edit-post/:id',
        component: PostEditorComponent,
        data: { title: 'Modifier la discussion' }
      },
      {
        path: 'subscriptions',
        component: SubscriptionPlansEnhancedComponent,
        data: { title: 'Plans d\'abonnement' }
      }
    ]
  }
];

// Routes héritées pour la rétrocompatibilité
export const LEGACY_FORUM_ROUTES: Routes = [
  {
    path: 'community-forum',
    redirectTo: 'community/forums/dashboard',
    pathMatch: 'full'
  }
];
