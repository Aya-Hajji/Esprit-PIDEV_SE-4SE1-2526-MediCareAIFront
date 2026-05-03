import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { timeout, takeUntil } from 'rxjs/operators';
import { ForumExtendedService } from '../../services/forum-extended.service';
import { SubscriptionExtendedService } from '../../services/subscription-extended.service';
import { BadWordsService } from '../../services/bad-words.service';
import { TranslationService } from '../../services/translation.service';
import { PostExtended, ReplyExtended } from '../../models/forum-extended.model';

@Component({
  selector: 'app-forum-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forum-detail.component.html',
  styleUrls: ['./forum-detail.component.css']
})
export class ForumDetailComponent implements OnInit, OnDestroy {

  post: PostExtended | null = null;
  replies: ReplyExtended[] = [];
  loading = true;
  submittingReply = false;
  replyText = '';
  postId: number | null = null;
  userHasSubscription = false;
  canReply = false;
  isLoadingReplies = false;
  error: string | null = null;
  replyError: string | null = null;
  checkingBadWords = false;

  // ── Translation ────────────────────────────────────────────────────────────
  isTranslating = false;
  isTranslated = false;
  private originalPost: PostExtended | null = null;
  private originalReplies: ReplyExtended[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private forumService: ForumExtendedService,
    private subscriptionService: SubscriptionExtendedService,
    private badWordsService: BadWordsService,
    private translationService: TranslationService,
    private route: ActivatedRoute,
    private router: Router,
    public cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 ForumDetailComponent Init');
    this.route.params.subscribe((params) => {
      this.postId = +params['id'];
      console.log('📍 Navigated to post ID:', this.postId);
      console.log('🔍 loading:', this.loading, 'post:', this.post, 'error:', this.error);
      if (this.postId) {
        this.loadPost();
        this.loadReplies();
        this.checkSubscription();
      } else {
        console.error('❌ No postId found in params!');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPost(): void {
    if (!this.postId) return;

    this.loading = true;
    this.error = null;
    this.isTranslated = false;

    this.forumService.getPostById(this.postId)
      .pipe(timeout(10000), takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          this.post = post;
          this.originalPost = { ...post };
          this.loading = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          this.checkAccessPermission();
          // Auto-translate after loading
          this.translatePost();
        },
        error: (error) => {
          this.loading = false;
          this.error = 'Unable to load post. Please try again.';
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
  }

  loadReplies(): void {
    if (!this.postId) return;
    this.isLoadingReplies = true;

    this.forumService.getPostReplies(this.postId)
      .pipe(timeout(10000), takeUntil(this.destroy$))
      .subscribe({
        next: (replies) => {
          this.replies = replies;
          this.originalReplies = replies.map(r => ({ ...r }));
          this.isLoadingReplies = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
          // Auto-translate replies
          this.translateReplies();
        },
        error: () => {
          this.isLoadingReplies = false;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });
  }

  checkSubscription(): void {
    // Backend will extract userId from JWT token
    console.log('🔍 Checking subscription status...');
    this.subscriptionService.hasActiveSubscription().pipe(
      timeout(5000),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (hasSubscription) => {
        console.log('✅ Subscription status:', hasSubscription);
        this.userHasSubscription = hasSubscription;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.checkAccessPermission();
      },
      error: (error) => {
        console.warn('⚠️ Subscription check failed, assuming no active subscription:', error);
        // Si erreur, assume pas d'abonnement
        this.userHasSubscription = false;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        this.checkAccessPermission();
      }
    });
  }

  checkAccessPermission(): void {
    if (this.post?.premiumOnly && !this.userHasSubscription) {
      this.canReply = false;
    } else {
      this.canReply = true;
    }
  }

  // ── Translation ────────────────────────────────────────────────────────────

  private translatePost(): void {
    if (!this.post) return;
    this.isTranslating = true;
    this.cdr.detectChanges();

    const title   = this.post.title   || '';
    const content = this.post.content || '';

    // Translate title and content in sequence (respect free API rate limit)
    this.translationService.translateToEnglish(title).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (translatedTitle) => {
        if (this.post) this.post = { ...this.post, title: translatedTitle };
        this.cdr.detectChanges();

        // Then translate content
        this.translationService.translateToEnglish(content).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (translatedContent) => {
            if (this.post) this.post = { ...this.post, content: translatedContent };
            this.isTranslating = false;
            this.isTranslated = true;
            this.cdr.detectChanges();
          },
          error: () => { this.isTranslating = false; this.cdr.detectChanges(); }
        });
      },
      error: () => { this.isTranslating = false; this.cdr.detectChanges(); }
    });
  }

  private translateReplies(): void {
    if (!this.replies.length) return;

    this.replies.forEach((reply, index) => {
      const content = reply.content || '';
      // Stagger requests to avoid rate limiting (200ms between each)
      setTimeout(() => {
        this.translationService.translateToEnglish(content).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (translated) => {
            this.replies[index] = { ...this.replies[index], content: translated };
            this.cdr.detectChanges();
          },
          error: () => {} // keep original on error
        });
      }, index * 300);
    });
  }

  /** Toggle between translated and original text */
  toggleTranslation(): void {
    if (this.isTranslated) {
      // Show original
      if (this.originalPost) this.post = { ...this.originalPost };
      this.replies = this.originalReplies.map(r => ({ ...r }));
      this.isTranslated = false;
    } else {
      // Re-translate
      this.translatePost();
      this.translateReplies();
    }
    this.cdr.detectChanges();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  getInitial(name: string | undefined | null): string {
    if (!name || name.trim() === '') return 'U';
    return name.charAt(0).toUpperCase();
  }

  submitReply(): void {
    if (!this.replyText.trim()) {
      this.replyError = 'Veuillez écrire une réponse avant de la publier.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.postId) {
      this.replyError = 'Erreur: ID du post manquant.';
      this.cdr.detectChanges();
      return;
    }

    // ── Step 1: Bad Words check ────────────────────────────────────────────
    this.checkingBadWords = true;
    this.replyError = null;
    this.cdr.detectChanges();

    this.badWordsService.checkText(this.replyText).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (result) => {
        this.checkingBadWords = false;

        if (!result.isClean) {
          // ❌ BLOQUÉ
          this.replyError = result.message ||
            'Votre réponse contient des mots inappropriés. Veuillez les supprimer.';
          this.cdr.detectChanges();
          return;
        }

        // ✅ OK — envoyer la réponse
        this.sendReply();
      },
      error: () => {
        // Si Bad Words API indisponible, on laisse passer
        this.checkingBadWords = false;
        this.sendReply();
      }
    });
  }

  private sendReply(): void {
    this.submittingReply = true;
    this.replyError = null;
    this.cdr.detectChanges();

    const reply: Partial<ReplyExtended> = {
      content: this.replyText,
      postId: this.postId!
    };

    this.forumService.createReply(this.postId!, reply).subscribe({
      next: (newReply) => {
        this.replies.push(newReply);
        this.replyText = '';
        this.submittingReply = false;
        this.replyError = null;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
        alert('✅ Réponse publiée avec succès !');
      },
      error: (error) => {
        this.submittingReply = false;
        // Show backend message directly (bad words or other 400/500)
        const msg = error?.message || error?.error?.message || '';
        if (error?.status === 400 || msg.toLowerCase().includes('inapproprié') || msg.toLowerCase().includes('bad')) {
          this.replyError = msg || 'Votre réponse contient des mots inappropriés. Veuillez les supprimer.';
        } else if (error?.status === 401) {
          this.replyError = 'Non authentifié. Veuillez vous reconnecter.';
        } else if (error?.status === 403) {
          this.replyError = 'Vous n\'avez pas la permission de publier une réponse.';
        } else {
          this.replyError = msg || 'Erreur lors de la publication. Veuillez réessayer.';
        }
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    });
  }

  deleteReply(replyId?: number): void {
    if (!replyId) {
      console.error('❌ No replyId provided');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réponse ?')) return;

    console.log('🗑️ deleteReply() called for reply ID:', replyId);
    
    this.forumService.deleteReply(replyId).subscribe({
      next: () => {
        console.log('✅ Reply deleted successfully');
        this.replies = this.replies.filter(r => r.id !== replyId);
        alert('✅ Réponse supprimée avec succès');
      },
      error: (error) => {
        console.error('❌ Error deleting reply:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error response:', JSON.stringify(error.error, null, 2));
        
        let errorMessage = 'Erreur lors de la suppression de la réponse';
        if (error.status === 400) {
          const serverMessage = error.error?.message || error.error?.error || '';
          errorMessage = serverMessage || 'Requête invalide.';
        } else if (error.status === 401) {
          errorMessage = 'Non authentifié. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas la permission de supprimer cette réponse.';
        } else if (error.status === 404) {
          errorMessage = 'Réponse non trouvée.';
        } else if (error.status === 500) {
          const serverMessage = error.error?.message || error.error?.error || '';
          errorMessage = 'Erreur serveur (500). ' + (serverMessage ? 'Détails: ' + serverMessage : 'Veuillez réessayer plus tard.');
        }
        
        alert(errorMessage);
      }
    });
  }

  deletePost(): void {
    if (!this.postId) {
      console.error('❌ No postId available');
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) return;

    console.log('🗑️ deletePost() called for post ID:', this.postId);
    
    this.forumService.deletePost(this.postId).subscribe({
      next: () => {
        console.log('✅ Post deleted successfully');
        alert('✅ Post supprimé avec succès');
        this.router.navigate(['/community/forums/dashboard']);
      },
      error: (error) => {
        console.error('❌ Error deleting post:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error response:', JSON.stringify(error.error, null, 2));
        
        let errorMessage = 'Erreur lors de la suppression';
        if (error.status === 0) {
          errorMessage = 'Erreur de connexion. Vérifiez votre internet.';
        } else if (error.status === 400) {
          const serverMessage = error.error?.message || error.error?.error || '';
          errorMessage = serverMessage || 'Requête invalide.';
        } else if (error.status === 401) {
          errorMessage = 'Non authentifié. Veuillez vous reconnecter.';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas la permission de supprimer ce post.';
        } else if (error.status === 404) {
          errorMessage = 'Post non trouvé.';
        } else if (error.status === 500) {
          const serverMessage = error.error?.message || error.error?.error || '';
          errorMessage = 'Erreur serveur (500). ' + (serverMessage ? 'Détails: ' + serverMessage : 'Veuillez réessayer plus tard.');
        }
        
        alert(errorMessage);
      }
    });
  }

  editPost(): void {
    if (this.postId) {
      this.router.navigate(['/community/forums/edit-post', this.postId]);
    }
  }

  likePost(): void {
    if (!this.postId || !this.post) return;

    // Optimistic update — increment immediately
    const prevCount = this.post.likerCount || 0;
    this.post = { ...this.post, likerCount: prevCount + 1, isLiked: true };
    this.cdr.detectChanges();

    this.forumService.likePost(this.postId).subscribe({
      next: (updatedPost: any) => {
        // Use backend count if it's higher than our optimistic value,
        // otherwise keep our optimistic value (avoids toggle reset)
        const backendCount = updatedPost?.likerCount ?? updatedPost?.likesCount ?? updatedPost?.likes;
        const finalCount = (backendCount != null && backendCount > prevCount)
          ? backendCount
          : prevCount + 1;
        this.post = { ...this.post!, likerCount: finalCount, isLiked: true };
        this.cdr.detectChanges();
      },
      error: () => {
        // Rollback
        this.post = { ...this.post!, likerCount: prevCount, isLiked: false };
        this.cdr.detectChanges();
      }
    });
  }

  unlikePost(): void {
    if (!this.postId || !this.post) return;

    // Optimistic update — decrement immediately
    const prevCount = this.post.likerCount || 0;
    this.post = { ...this.post, likerCount: Math.max(0, prevCount - 1), isLiked: false };
    this.cdr.detectChanges();

    this.forumService.unlikePost(this.postId).subscribe({
      next: (updatedPost: any) => {
        const backendCount = updatedPost?.likerCount ?? updatedPost?.likesCount ?? updatedPost?.likes;
        const finalCount = (backendCount != null && backendCount < prevCount)
          ? backendCount
          : Math.max(0, prevCount - 1);
        this.post = { ...this.post!, likerCount: finalCount, isLiked: false };
        this.cdr.detectChanges();
      },
      error: () => {
        // Rollback
        this.post = { ...this.post!, likerCount: prevCount, isLiked: true };
        this.cdr.detectChanges();
      }
    });
  }

  likeReply(replyId?: number): void {
    if (!replyId) return;
    this.forumService.likeReply(replyId).subscribe({
      next: (updatedReply) => {
        const index = this.replies.findIndex(r => r.id === replyId);
        if (index > -1) this.replies[index] = updatedReply;
      }
    });
  }

  getTimeAgo(date: string | undefined): string {
    if (!date) return 'Unknown date';
    const now = new Date();
    const postDate = new Date(date);
    const diff = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    if (diff < 60)    return 'Just now';
    if (diff < 3600)  return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    return `${Math.floor(diff / 86400)} d ago`;
  }

  goBack(): void {
    this.router.navigate(['/community/forums/dashboard']);
  }

  goToSubscriptions(): void {
    this.router.navigate(['/community/forums/subscriptions']);
  }
}