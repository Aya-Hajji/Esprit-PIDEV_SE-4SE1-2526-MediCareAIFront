import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForumService } from '../../../../shared/services/forum.service';
import { Post } from '../../../../shared/models/forum.model';

@Component({
  selector: 'app-forum-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forum-management.component.html',
  styleUrls: ['./forum-management.component.css']
})
export class ForumManagementComponent implements OnInit {
  posts: Post[] = [];
  loading = false;
  error: string | null = null;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading = true;
    this.forumService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load posts';
        this.loading = false;
      }
    });
  }

  deletePost(id: number): void {
    if (confirm('Delete this post?')) {
      this.forumService.deletePost(id).subscribe({
        next: () => this.loadPosts(),
        error: (error) => console.error('Error deleting post:', error)
      });
    }
  }
}
