// Base Subscription Plan
export interface SubscriptionPlan {
  id?: number;
  name: string;
  price?: number;
  durationDays?: number;
  description?: string;
  features?: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';
  createdAt?: string;
  updatedAt?: string;
}

// User Subscription (basic)
export interface Subscription {
  id?: number;
  userId: number;
  planId: number;
  planName?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  activeNow?: boolean;
}

// Extended Subscription with all fields
export interface SubscriptionExtended {
  id?: number;
  userId?: number;
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenew?: boolean;
  planPrice?: number;
  planDescription?: string;
  daysRemaining?: number;
  isExpiring?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Subscription History
export interface SubscriptionHistory {
  id?: number;
  userId?: number;
  planId: number;
  planName: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  createdAt?: string;
}

// API Responses
export interface SubscriptionResponse {
  success: boolean;
  data: SubscriptionExtended;
  message?: string;
}

export interface SubscriptionListResponse {
  success: boolean;
  data: SubscriptionPlan[];
  message?: string;
}

export interface SubscriptionHistoryResponse {
  success: boolean;
  data: SubscriptionHistory[];
  message?: string;
}

// API Requests
export interface SubscribeRequest {
  planId: number;
  autoRenew: boolean;
}

export interface RenewSubscriptionRequest {
  subscriptionId: number;
}

export interface UpdateAutoRenewRequest {
  autoRenew: boolean;
}

export interface CancelSubscriptionRequest {
  subscriptionId: number;
  reason?: string;
}
