import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../../../shared/services/subscription.service';
import { SubscriptionPlan } from '../../../../shared/models/subscription.model';

@Component({
  selector: 'app-subscription-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-management.component.html',
  styleUrls: ['./subscription-management.component.css']
})
export class SubscriptionManagementComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading = false;

  constructor(private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading = true;
    this.subscriptionService.getAllPlans().subscribe({
      next: (plans) => {
        this.plans = plans;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.loading = false;
      }
    });
  }

  deletePlan(id: number): void {
    if (confirm('Delete this plan?')) {
      this.subscriptionService.deletePlan(id).subscribe({
        next: () => this.loadPlans(),
        error: (error) => console.error('Error:', error)
      });
    }
  }
}
