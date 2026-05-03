import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ForumExtendedService } from '../../services/forum-extended.service';
import { SubscriptionExtendedService } from '../../services/subscription-extended.service';
import { PostExtended, ForumFilter } from '../../models/forum-extended.model';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forum-list.component.html',
  styleUrls: ['./forum-list.component.css']
})
export class ForumListComponent implements OnInit {

  // ── All posts ──────────────────────────────────────────────────────────────
  posts: PostExtended[] = [];
  filteredPosts: PostExtended[] = [];
  loading = true;
  backendError = false;

  // ── Recommendations ────────────────────────────────────────────────────────
  recommendations: PostExtended[] = [];
  loadingReco = true;
  showRecommendations = true;

  // ── Filters ────────────────────────────────────────────────────────────────
  searchTerm = '';
  selectedCategory = '';
  sortBy: 'newest' | 'popular' | 'mostReplies' = 'newest';
  showPremiumOnly = false;
  userHasSubscription = false;

  categories = [
    { name: 'All', value: '' },
    { name: 'General Health', value: 'general' },
    { name: 'Nutrition', value: 'nutrition' },
    { name: 'Exercise', value: 'exercise' },
    { name: 'Mental Health', value: 'mental' },
    { name: 'Medical Questions', value: 'medical' }
  ];

  constructor(
    private forumService: ForumExtendedService,
    private subscriptionService: SubscriptionExtendedService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPosts();
    this.loadRecommendations();
    this.checkSubscription();
  }

  // ── Load all posts ─────────────────────────────────────────────────────────

  loadPosts(): void {
    this.loading = true;
    this.backendError = false;

    const filter: ForumFilter = {
      category: this.selectedCategory || undefined,
      premiumOnly: this.showPremiumOnly || undefined,
      searchTerm: this.searchTerm || undefined,
      sortBy: this.sortBy
    };

    this.forumService.getAllPosts(filter).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.filteredPosts = [...posts];
        this.loading = false;
        this.backendError = false;
      },
      error: () => {
        this.loading = false;
        this.backendError = true;
      }
    });
  }

  // ── Load recommendations ───────────────────────────────────────────────────

  loadRecommendations(): void {
    this.loadingReco = true;
    this.forumService.getRecommendations(5).subscribe({
      next: (posts) => {
        this.recommendations = posts;
        this.loadingReco = false;
        // Hide section if backend returns nothing
        this.showRecommendations = posts.length > 0;
      },
      error: () => {
        this.loadingReco = false;
        this.showRecommendations = false;
      }
    });
  }

  // ── Subscription ───────────────────────────────────────────────────────────

  checkSubscription(): void {
    this.subscriptionService.hasActiveSubscription().subscribe({
      next: (has) => this.userHasSubscription = has,
      error: () => this.userHasSubscription = false
    });
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  onSearch(): void { this.applyFilters(); }
  onFilterChange(): void { this.applyFilters(); }
  onSortChange(): void { this.applyFilters(); }

  private applyFilters(): void {
    let result = [...this.posts];

    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(term) ||
        p.content?.toLowerCase().includes(term)
      );
    }

    if (this.selectedCategory) {
      result = result.filter(p => p.category === this.selectedCategory);
    }

    if (this.showPremiumOnly) {
      result = result.filter(p => p.premiumOnly === true);
    }

    if (this.sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (this.sortBy === 'popular') {
      result.sort((a, b) => (b.likerCount || 0) - (a.likerCount || 0));
    } else if (this.sortBy === 'mostReplies') {
      result.sort((a, b) => (b.replyCount || 0) - (a.replyCount || 0));
    }

    this.filteredPosts = result;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  viewPost(postId?: number): void {
    if (postId) this.router.navigate(['/community/forums/post', postId]);
  }

  createNewPost(): void {
    this.router.navigate(['/community/forums/create-post']);
  }

  viewSubscriptions(): void {
    this.router.navigate(['/community/forums/subscriptions']);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getInitial(name: string | undefined | null): string {
    if (!name || name.trim() === '') return 'U';
    return name.charAt(0).toUpperCase();
  }

  getTimeAgo(date: string | undefined): string {
    if (!date) return 'Date inconnue';
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60)    return 'À l\'instant';
    if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  }

  /**
   * Score label shown on recommendation cards.
   * Uses the score field if backend returns it, otherwise computes locally.
   */
  getScoreLabel(post: any): string {
    const score = post.score ?? post.recommendationScore ?? post.relevanceScore;
    if (score != null) return `Score : ${Math.round(score)}`;
    // Local fallback
    return `Score : ${(post.likerCount || 0) * 3 + (post.replyCount || 0) * 2 + Math.floor((post.viewCount || 0) / 10)}`;
  }

  /** Tags shared between this recommendation and the user's interests */
  getMatchingTags(post: PostExtended): string[] {
    return post.tags?.slice(0, 3) || [];
  }

  getPlanBadgeClass(isPremium: boolean): string {
    return isPremium ? 'badge-premium' : 'badge-free';
  }
}
