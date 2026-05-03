import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, timeout } from 'rxjs/operators';
import { SubscriptionExtendedService, SubscriptionExtended } from '../../services/subscription-extended.service';
import { SubscriptionPlan } from '../../../../shared/models/subscription.model';

@Component({
  selector: 'app-subscription-plans-enhanced',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './subscription-plans-enhanced.component.html',
  styleUrls: ['./subscription-plans-enhanced.component.css']
})
export class SubscriptionPlansEnhancedComponent implements OnInit, OnDestroy {
  // Data
  plans: SubscriptionPlan[] = [];
  subscriptionHistory: SubscriptionExtended[] = [];
  currentSubscription: SubscriptionExtended | null = null;

  // UI States
  loading = true;
  subscribing = false;
  loadingHistory = false;
  error: string | null = null;
  
  // User State
  userHasSubscription = false;
  autoRenewEnabled = false;
  showHistory = false;
  selectedPlan: SubscriptionPlan | null = null;
  openFaqItems: { [key: string]: boolean } = {};

  // Lifecycle
  private destroy$ = new Subject<void>();

  constructor(
    private subscriptionService: SubscriptionExtendedService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 SubscriptionPlansEnhancedComponent Initialize');
    this.loadPlans();
    this.loadUserSubscription();
  }

  ngOnDestroy(): void {
    console.log('🛑 SubscriptionPlansEnhancedComponent Destroy');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== LOAD DATA ====================

  loadPlans(): void {
    console.log('📋 Loading subscription plans...');
    this.subscriptionService.getAllPlans()
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (plans) => {
          console.log('✅ Plans loaded successfully:', plans.length, 'plans');
          this.plans = plans;
          this.loading = false;
          this.error = null;
          this.updateUI();
        },
        error: (error) => {
          console.error('❌ Error loading plans:', error);
          this.loading = false;
          this.error = 'Error loading plans. Please try again.';
          this.updateUI();
        }
      });
  }

  loadUserSubscription(): void {
    console.log('👤 Loading user subscription...');
    this.subscriptionService.getUserSubscription()
      .pipe(
        timeout(5000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (subscription) => {
          console.log('✅ User subscription loaded:', subscription?.status || 'none');
          this.currentSubscription = subscription as SubscriptionExtended | null;
          this.userHasSubscription = !!subscription && subscription.status === 'ACTIVE';
          this.autoRenewEnabled = subscription?.autoRenew || false;
          this.updateUI();
        },
        error: (error) => {
          console.warn('⚠️ Error loading subscription (assuming no active subscription):', error.message);
          this.currentSubscription = null;
          this.userHasSubscription = false;
          this.autoRenewEnabled = false;
          this.updateUI();
        }
      });
  }

  loadSubscriptionHistory(): void {
    console.log('📚 Loading subscription history...');
    this.loadingHistory = true;
    this.subscriptionService.getUserSubscriptionHistory()
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (history) => {
          console.log('✅ History loaded:', history.length, 'subscriptions');
          this.subscriptionHistory = history;
          this.loadingHistory = false;
          this.updateUI();
        },
        error: (error) => {
          console.error('❌ Error loading history:', error);
          this.subscriptionHistory = [];
          this.loadingHistory = false;
          this.updateUI();
        }
      });
  }

  // ==================== ACTIONS ====================

  subscribeToPlan(plan: SubscriptionPlan): void {
    const token = localStorage.getItem('authToken');
    console.log('🎯 subscribeToPlan() called for plan:', plan.name);
    
    if (!token) {
      console.error('❌ No auth token found');
      alert('Please log in first');
      return;
    }

    if (!plan.id) {
      console.error('❌ Plan has no ID');
      return;
    }

    this.subscribing = true;
    this.error = null;
    console.log('📝 Subscribing to plan ID:', plan.id, 'with auto-renew: true');
    
    this.subscriptionService.subscribe(plan.id, true)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (subscription) => {
          console.log('✅ Subscription successful:', subscription);
          this.currentSubscription = subscription;
          this.userHasSubscription = true;
          this.autoRenewEnabled = true;
          this.subscribing = false;
          this.updateUI();
          alert(`✅ Successfully subscribed to ${plan.name}!\nYour subscription is now active.`);
        },
        error: (error) => {
          console.error('❌ Subscription error:', error);
          this.subscribing = false;
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.error = 'Subscription error: ' + errorMessage;
          this.updateUI();
          alert('❌ Subscription error:\n' + errorMessage);
        }
      });
  }

  renewSubscription(): void {
    console.log('🔄 renewSubscription() called');
    
    if (!this.currentSubscription || !this.currentSubscription.id) {
      console.error('❌ No current subscription to renew');
      alert('No subscription to renew');
      return;
    }

    if (!confirm('Are you sure you want to renew your subscription?')) {
      return;
    }

    console.log('📝 Renewing subscription ID:', this.currentSubscription.id);
    this.subscriptionService.renewSubscription(this.currentSubscription.id)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (subscription) => {
          console.log('✅ Subscription renewed successfully');
          this.currentSubscription = subscription;
          this.updateUI();
          alert('✅ Subscription renewed successfully!');
        },
        error: (error) => {
          console.error('❌ Renewal error:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.error = 'Renewal error: ' + errorMessage;
          this.updateUI();
          alert('❌ Renewal error:\n' + errorMessage);
        }
      });
  }

  cancelSubscription(): void {
    console.log('❌ cancelSubscription() called');
    
    if (!this.currentSubscription || !this.currentSubscription.id) {
      console.error('❌ No subscription to cancel');
      alert('No subscription to cancel');
      return;
    }

    if (!confirm('Are you sure you want to cancel your subscription?\nThis action cannot be undone.')) {
      console.log('⚠️ Cancellation cancelled by user');
      return;
    }

    console.log('📝 Cancelling subscription ID:', this.currentSubscription.id);
    this.subscriptionService.cancelSubscription(this.currentSubscription.id)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {
          console.log('✅ Subscription cancelled successfully');
          this.currentSubscription = null;
          this.userHasSubscription = false;
          this.autoRenewEnabled = false;
          this.updateUI();
          alert('✅ Your subscription has been cancelled.');
        },
        error: (error) => {
          console.error('❌ Cancellation error:', error);
          const errorMessage = error.error?.message || error.message || 'Unknown error';
          this.error = 'Cancellation error: ' + errorMessage;
          this.updateUI();
          alert('❌ Cancellation error:\n' + errorMessage);
        }
      });
  }

  toggleAutoRenew(): void {
    console.log('🔄 toggleAutoRenew() called, current state:', this.autoRenewEnabled);
    
    if (!this.currentSubscription || !this.currentSubscription.id) {
      console.error('❌ No subscription to update');
      return;
    }

    const newState = !this.autoRenewEnabled;
    console.log('📝 Setting auto-renew to:', newState);
    
    this.subscriptionService.updateAutoRenew(this.currentSubscription.id, newState)
      .pipe(
        timeout(10000),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (subscription) => {
          console.log('✅ Auto-renew updated successfully');
          this.currentSubscription = subscription;
          this.autoRenewEnabled = newState;
          this.updateUI();
          alert(`✅ Auto-renewal ${newState ? 'enabled' : 'disabled'}!`);
        },
        error: (error) => {
          console.error('❌ Update error:', error);
          alert('❌ Error updating settings');
        }
      });
  }

  toggleHistory(): void {
    console.log('📚 toggleHistory() called');
    this.showHistory = !this.showHistory;
    if (this.showHistory && this.subscriptionHistory.length === 0) {
      this.loadSubscriptionHistory();
    }
  }

  toggleFaq(itemId: string): void {
    console.log('📖 toggleFaq() called for item:', itemId);
    this.openFaqItems[itemId] = !this.openFaqItems[itemId];
    
    // Update DOM element class
    setTimeout(() => {
      const element = document.getElementById(itemId);
      if (element) {
        const faqItem = element.closest('.faq-item') as HTMLElement;
        if (faqItem) {
          if (this.openFaqItems[itemId]) {
            faqItem.classList.add('open');
          } else {
            faqItem.classList.remove('open');
          }
        }
      }
    }, 0);
  }

  // ==================== HELPERS ====================

  getFeatures(planName?: string): string[] {
    const features: { [key: string]: string[] } = {
      'Premium Monthly': [
        'Access to all premium content',
        'Unlimited discussions with community',
        'Priority responses from professionals',
        'Advanced health statistics',
        'Priority email support',
        'Access to educational resources',
        'Badges and rewards',
        'No ads'
      ],
      'Premium Annual': [
        'Unlimited access to premium content',
        'Video consultations with professionals',
        'Complete health analysis with AI',
        'Priority support 24/7 (email + chat)',
        'Access to exclusive monthly webinars',
        'Detailed health reports',
        'Personalized wellness programs',
        'Priority in queues',
        '30% discount on additional services',
        'No ads',
        'Flexible auto-renewal'
      ],
      'Basic': [
        'Access to public forum',
        'Community responses',
        'Complete user profile',
        'Discussion history',
        'Search in posts',
        'Basic notifications'
      ],
      'Premium': [
        'Access to all premium content',
        'Priority support',
        'No ads'
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

  getStatusBadge(): string {
    if (!this.currentSubscription) return 'aucun';
    return this.currentSubscription.status?.toLowerCase() || 'aucun';
  }

  // ==================== UI ====================

  updateUI(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  closeError(): void {
    this.error = null;
    this.updateUI();
  }
}
