import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Subscription, SubscriptionPlan } from '../../../shared/models/subscription.model';
import { environment } from '../../../../environments/environment';

export interface SubscriptionExtended extends Subscription {
  planDetails?: SubscriptionPlan;
  daysRemaining?: number;
  autoRenew?: boolean;
  billingCycle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionExtendedService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private apiUrl = `${this.baseUrl}/api/subscriptions`;
  private planUrl = `${this.baseUrl}/api/subscription-plans`;

  private userSubscriptionSubject = new BehaviorSubject<SubscriptionExtended | null>(null);
  userSubscription$ = this.userSubscriptionSubject.asObservable();

  private plansSubject = new BehaviorSubject<SubscriptionPlan[]>([]);
  plans$ = this.plansSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get authorization headers with token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // Get all plans
  getAllPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<SubscriptionPlan[]>(this.planUrl).pipe(
      tap(plans => {
        console.log('✅ Plans loaded:', plans.length);
        this.plansSubject.next(plans);
      }),
      catchError(error => {
        console.error('❌ Error loading plans:', error);
        // Return empty array as fallback
        this.plansSubject.next([]);
        return of([]);
      })
    );
  }

  getPlanById(id: number): Observable<SubscriptionPlan> {
    return this.http.get<SubscriptionPlan>(`${this.planUrl}/${id}`);
  }

  // Get user's active subscription
  getUserSubscription(): Observable<SubscriptionExtended | null> {
    // Backend will extract userId from JWT token
    return this.http.get<SubscriptionExtended>(`${this.apiUrl}/active`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(subscription => {
        console.log('✅ User subscription received:', subscription);
        this.userSubscriptionSubject.next(subscription);
      }),
      catchError(error => {
        console.warn('⚠️ Error fetching subscription (user may not have subscription yet):', error);
        // Return null instead of throwing error - user might not have subscription
        this.userSubscriptionSubject.next(null);
        return of(null);
      })
    );
  }

  getSubscriptionById(id: number): Observable<SubscriptionExtended> {
    return this.http.get<SubscriptionExtended>(`${this.apiUrl}/${id}`);
  }

  // Create subscription (subscribe to plan)
  subscribe(planId: number, autoRenew: boolean = false): Observable<SubscriptionExtended> {
    // Backend will extract userId from JWT token
    return this.http.post<SubscriptionExtended>(this.apiUrl, {
      planId,
      autoRenew
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(subscription => this.userSubscriptionSubject.next(subscription))
    );
  }

  // Renew subscription
  renewSubscription(id: number): Observable<SubscriptionExtended> {
    return this.http.put<SubscriptionExtended>(`${this.apiUrl}/${id}/renew`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(subscription => this.userSubscriptionSubject.next(subscription))
    );
  }

  // Cancel subscription
  cancelSubscription(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        this.userSubscriptionSubject.next(null);
        console.log('Subscription cancelled successfully');
      })
    );
  }

  // Update auto-renew
  updateAutoRenew(id: number, autoRenew: boolean): Observable<SubscriptionExtended> {
    return this.http.patch<SubscriptionExtended>(`${this.apiUrl}/${id}/auto-renew`, { autoRenew }, {
      headers: this.getAuthHeaders()
    });
  }

  // Check if user has active subscription
  hasActiveSubscription(): Observable<boolean> {
    console.log('🔍 Checking active subscription at:', `${this.apiUrl}/has-active`);
    // Backend will extract userId from JWT token
    return this.http.get<boolean>(`${this.apiUrl}/has-active`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(hasActive => {
        console.log('✅ Has active subscription:', hasActive);
      }),
      catchError(error => {
        console.error('❌ Error checking subscription:', error.status);
        // Return false if endpoint fails
        return of(false);
      })
    );
  }

  // Get subscription history
  getUserSubscriptionHistory(): Observable<SubscriptionExtended[]> {
    // Backend will extract userId from JWT token
    return this.http.get<SubscriptionExtended[]>(`${this.apiUrl}/history`, {
      headers: this.getAuthHeaders()
    });
  }
}
