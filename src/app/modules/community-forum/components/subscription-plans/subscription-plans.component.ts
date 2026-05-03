import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionExtendedService } from '../../services/subscription-extended.service';
import { SubscriptionPlan } from '../../../../shared/models/subscription.model';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.css']
})
export class SubscriptionPlansComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading = true;
  selectedPlan: SubscriptionPlan | null = null;
  currentSubscription: any = null;
  userHasSubscription = false;

  constructor(private subscriptionService: SubscriptionExtendedService) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadUserSubscription();
  }

  loadPlans(): void {
    this.subscriptionService.getAllPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des plans:', error);
        this.loading = false;
      }
    });
  }

  loadUserSubscription(): void {
    // Backend will extract userId from JWT token
    this.subscriptionService.getUserSubscription().subscribe({
      next: (subscription) => {
        this.currentSubscription = subscription;
        this.userHasSubscription = !!subscription && subscription.status === 'ACTIVE';
      }
    });
  }

  subscribeToPlan(plan: SubscriptionPlan): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      alert('Veuillez vous connecter d\'abord');
      return;
    }

    if (plan.id) {
      // Backend will extract userId from JWT token
      this.subscriptionService.subscribe(plan.id, true).subscribe({
        next: (subscription) => {
          this.currentSubscription = subscription;
          this.userHasSubscription = true;
          alert('Vous vous êtes abonné avec succès!');
          this.loadUserSubscription();
        },
        error: (error) => {
          console.error('Erreur lors de l\'abonnement:', error);
          alert('Erreur lors de l\'abonnement');
        }
      });
    }
  }

  renewSubscription(): void {
    if (this.currentSubscription && this.currentSubscription.id) {
      this.subscriptionService.renewSubscription(this.currentSubscription.id).subscribe({
        next: (subscription) => {
          this.currentSubscription = subscription;
          alert('Abonnement renouvelé avec succès!');
        },
        error: (error) => {
          console.error('Erreur lors du renouvellement:', error);
          alert('Erreur lors du renouvellement');
        }
      });
    }
  }

  cancelSubscription(): void {
    if (this.currentSubscription && this.currentSubscription.id) {
      if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement?')) {
        this.subscriptionService.cancelSubscription(this.currentSubscription.id).subscribe({
          next: () => {
            this.currentSubscription = null;
            this.userHasSubscription = false;
            alert('Abonnement annulé');
          },
          error: (error) => {
            console.error('Erreur lors de l\'annulation:', error);
            alert('Erreur lors de l\'annulation');
          }
        });
      }
    }
  }

  getFeatures(planName?: string): string[] {
    const features: { [key: string]: string[] } = {
      'Premium Mensuel': [
        'Accès à tout le contenu premium',
        'Réponses prioritaires des professionnels',
        'Statistiques de santé avancées',
        'Support prioritaire',
        'Sans publicités'
      ],
      'Premium Annuel': [
        'Accès illimité au contenu premium',
        'Consultation vidéo avec professionnels',
        'Analyse complète de la santé',
        'Support 24/7',
        'Accès à des webinaires exclusifs'
      ],
      'Basic': [
        'Accès au forum public',
        'Réception de réponses'
      ]
    };
    return features[planName || ''] || [];
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return this.userHasSubscription && this.currentSubscription?.planId === plan.id;
  }

  getDaysRemaining(): number {
    if (!this.currentSubscription || !this.currentSubscription.endDate) return 0;
    const endDate = new Date(this.currentSubscription.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
