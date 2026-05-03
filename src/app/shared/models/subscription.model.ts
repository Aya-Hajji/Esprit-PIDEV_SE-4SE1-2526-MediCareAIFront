export interface SubscriptionPlan {
  id?: number;
  name: string;
  price?: number;
  durationDays?: number;
  description?: string;
}

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
