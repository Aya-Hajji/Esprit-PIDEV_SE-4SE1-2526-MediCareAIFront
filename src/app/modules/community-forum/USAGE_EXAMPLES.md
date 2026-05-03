/**
 * Exemples d'utilisation du Module Community Forum + Subscription
 * Ce fichier montre comment utiliser les services et composants
 */

// ============================================
// EXEMPLE 1: Utiliser ForumExtendedService
// ============================================

import { Component, OnInit } from '@angular/core';
import { ForumExtendedService } from './services/forum-extended.service';
import { PostExtended, ForumFilter } from './models/forum-extended.model';

@Component({
  selector: 'app-example-forum',
  template: `
    <div>
      <h2>{{ posts.length }} Posts trouvés</h2>
      <div *ngFor="let post of posts">
        <h3>{{ post.title }}</h3>
        <p>{{ post.content }}</p>
      </div>
    </div>
  `
})
export class ExampleForumComponent implements OnInit {
  posts: PostExtended[] = [];

  constructor(private forumService: ForumExtendedService) {}

  ngOnInit() {
    // Récupérer tous les posts avec filtres
    const filter: ForumFilter = {
      category: 'general',
      premiumOnly: false,
      searchTerm: 'santé',
      sortBy: 'newest'
    };

    this.forumService.getAllPosts(filter).subscribe({
      next: (posts) => {
        this.posts = posts;
        console.log('Posts chargés:', posts);
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
      }
    });
  }

  // Créer un nouveau post
  createNewPost() {
    const newPost: Partial<PostExtended> = {
      title: 'Ma nouvelle discussion',
      content: 'Voici le contenu de ma discussion...',
      category: 'nutrition',
      premiumOnly: false,
      tags: ['nutrition', 'santé']
    };

    this.forumService.createPost(newPost).subscribe({
      next: (createdPost) => {
        console.log('Post créé:', createdPost);
        this.posts.push(createdPost);
      },
      error: (error) => {
        console.error('Erreur lors de la création:', error);
      }
    });
  }

  // Mettre à jour un post
  updatePost(postId: number, updatedData: Partial<PostExtended>) {
    this.forumService.updatePost(postId, updatedData).subscribe({
      next: (updatedPost) => {
        console.log('Post mis à jour:', updatedPost);
        // Mettre à jour la liste locale
        const index = this.posts.findIndex(p => p.id === postId);
        if (index > -1) {
          this.posts[index] = updatedPost;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
      }
    });
  }

  // Supprimer un post
  deletePost(postId: number) {
    this.forumService.deletePost(postId).subscribe({
      next: () => {
        console.log('Post supprimé');
        this.posts = this.posts.filter(p => p.id !== postId);
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  }

  // Aimer un post
  likePost(postId: number) {
    this.forumService.likePost(postId).subscribe({
      next: (updatedPost) => {
        console.log('Post aimé:', updatedPost);
        const index = this.posts.findIndex(p => p.id === postId);
        if (index > -1) {
          this.posts[index] = updatedPost;
        }
      },
      error: (error) => {
        console.error('Erreur lors du like:', error);
      }
    });
  }
}

// ============================================
// EXEMPLE 2: Utiliser SubscriptionExtendedService
// ============================================

import { SubscriptionExtendedService } from './services/subscription-extended.service';
import { SubscriptionPlan } from '../../shared/models/subscription.model';

@Component({
  selector: 'app-example-subscription',
  template: `
    <div>
      <h2>Plans d'Abonnement</h2>
      <div *ngFor="let plan of plans">
        <h3>{{ plan.name }} - ${{ plan.price }}/mois</h3>
        <button (click)="subscribe(plan)">S'abonner</button>
      </div>
    </div>
  `
})
export class ExampleSubscriptionComponent implements OnInit {
  plans: SubscriptionPlan[] = [];

  constructor(private subscriptionService: SubscriptionExtendedService) {}

  ngOnInit() {
    // Récupérer tous les plans disponibles
    this.subscriptionService.getAllPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        console.log('Plans disponibles:', plans);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des plans:', error);
      }
    });

    // Vérifier l'abonnement de l'utilisateur
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.subscriptionService.getUserSubscription(+userId).subscribe({
        next: (subscription) => {
          if (subscription) {
            console.log('Abonnement actif:', subscription);
            console.log('Expire le:', subscription.endDate);
          } else {
            console.log('Aucun abonnement actif');
          }
        }
      });
    }
  }

  // S'abonner à un plan
  subscribe(plan: SubscriptionPlan) {
    const userId = localStorage.getItem('userId');
    if (!userId || !plan.id) {
      alert('Erreur: Utilisateur ou plan non valide');
      return;
    }

    this.subscriptionService.subscribe(+userId, plan.id, true).subscribe({
      next: (subscription) => {
        console.log('Abonnement créé:', subscription);
        alert('Vous êtes maintenant abonné!');
      },
      error: (error) => {
        console.error('Erreur lors de l\'abonnement:', error);
        alert('Erreur lors de l\'abonnement');
      }
    });
  }

  // Renouveler un abonnement
  renewSubscription(subscriptionId: number) {
    this.subscriptionService.renewSubscription(subscriptionId).subscribe({
      next: (updatedSubscription) => {
        console.log('Abonnement renouvelé:', updatedSubscription);
        alert('Abonnement renouvelé avec succès!');
      },
      error: (error) => {
        console.error('Erreur lors du renouvellement:', error);
      }
    });
  }

  // Annuler un abonnement
  cancelSubscription(subscriptionId: number) {
    this.subscriptionService.cancelSubscription(subscriptionId).subscribe({
      next: () => {
        console.log('Abonnement annulé');
        alert('Votre abonnement a été annulé');
      },
      error: (error) => {
        console.error('Erreur lors de l\'annulation:', error);
      }
    });
  }

  // Vérifier si l'utilisateur a un abonnement actif
  checkActiveSubscription() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.subscriptionService.hasActiveSubscription(+userId).subscribe({
      next: (hasActive) => {
        if (hasActive) {
          console.log('L\'utilisateur a un abonnement actif');
        } else {
          console.log('L\'utilisateur n\'a pas d\'abonnement actif');
        }
      }
    });
  }
}

// ============================================
// EXEMPLE 3: Gestion des Réponses (Replies)
// ============================================

export class ExampleRepliesComponent implements OnInit {
  constructor(private forumService: ForumExtendedService) {}

  ngOnInit() {
    const postId = 1; // ID du post

    // Récupérer les réponses d'un post
    this.forumService.getPostReplies(postId).subscribe({
      next: (replies) => {
        console.log('Réponses du post:', replies);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des réponses:', error);
      }
    });
  }

  // Ajouter une réponse
  addReply(postId: number, content: string) {
    this.forumService.createReply(postId, { content, postId }).subscribe({
      next: (newReply) => {
        console.log('Réponse créée:', newReply);
      },
      error: (error) => {
        console.error('Erreur lors de la création de la réponse:', error);
      }
    });
  }

  // Modifier une réponse
  updateReply(replyId: number, updatedContent: string) {
    this.forumService.updateReply(replyId, { content: updatedContent }).subscribe({
      next: (updatedReply) => {
        console.log('Réponse mise à jour:', updatedReply);
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour:', error);
      }
    });
  }

  // Supprimer une réponse
  deleteReply(replyId: number) {
    this.forumService.deleteReply(replyId).subscribe({
      next: () => {
        console.log('Réponse supprimée');
      },
      error: (error) => {
        console.error('Erreur lors de la suppression:', error);
      }
    });
  }
}

// ============================================
// EXEMPLE 4: Filtrage Avancé
// ============================================

export class ExampleFiltersComponent implements OnInit {
  constructor(private forumService: ForumExtendedService) {}

  ngOnInit() {
    // Filter 1: Tous les posts premium
    this.getPremiumPosts();

    // Filter 2: Posts avec recherche spécifique
    this.searchPosts('diabetes');

    // Filter 3: Posts les plus populaires
    this.getPopularPosts();
  }

  getPremiumPosts() {
    const filter: ForumFilter = {
      premiumOnly: true
    };

    this.forumService.getAllPosts(filter).subscribe({
      next: (posts) => {
        console.log('Posts premium:', posts);
      }
    });
  }

  searchPosts(term: string) {
    const filter: ForumFilter = {
      searchTerm: term
    };

    this.forumService.getAllPosts(filter).subscribe({
      next: (posts) => {
        console.log(`Résultats pour "${term}":`, posts);
      }
    });
  }

  getPopularPosts() {
    const filter: ForumFilter = {
      sortBy: 'popular'
    };

    this.forumService.getAllPosts(filter).subscribe({
      next: (posts) => {
        console.log('Posts populaires:', posts);
      }
    });
  }

  getMostRepliedPosts() {
    const filter: ForumFilter = {
      sortBy: 'mostReplies'
    };

    this.forumService.getAllPosts(filter).subscribe({
      next: (posts) => {
        console.log('Posts les plus répondus:', posts);
      }
    });
  }
}

// ============================================
// EXEMPLE 5: Navigation Programmatique
// ============================================

import { Router } from '@angular/router';

export class ExampleNavigationComponent {
  constructor(private router: Router) {}

  // Aller à la liste des posts
  goToForum() {
    this.router.navigate(['/community-forum']);
  }

  // Aller à un post spécifique
  viewPost(postId: number) {
    this.router.navigate(['/community-forum/post', postId]);
  }

  // Créer un nouveau post
  createNewPost() {
    this.router.navigate(['/community-forum/create-post']);
  }

  // Modifier un post
  editPost(postId: number) {
    this.router.navigate(['/community-forum/edit-post', postId]);
  }

  // Voir les plans d'abonnement
  viewSubscriptions() {
    this.router.navigate(['/community-forum/subscriptions']);
  }
}

// Export pour utilisation dans d'autres modules
export {
  ExampleForumComponent,
  ExampleSubscriptionComponent,
  ExampleRepliesComponent,
  ExampleFiltersComponent,
  ExampleNavigationComponent
};
