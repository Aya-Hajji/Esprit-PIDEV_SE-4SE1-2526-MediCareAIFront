import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-community-forum-shell',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="forum-shell">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .forum-shell {
      width: 100%;
    }
  `]
})
export class CommunityForumShellComponent {}
