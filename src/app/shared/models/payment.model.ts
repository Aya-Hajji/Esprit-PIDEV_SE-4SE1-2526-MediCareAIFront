/**
 * Payment and Subscription Models
 */

export interface Payment {
  id?: number;
  orderId?: number;
  userId: number;
  amount: number;
  currency?: string; // e.g., "USD", "EUR"
  paymentMethod: PaymentMethod;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  transactionDate?: string;
  refundAmount?: number;
  refundReason?: string;
  description?: string;
  metadata?: any;
  createdAt?: string;
  updatedAt?: string;
}

export type PaymentMethodType = 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER' | 'WALLET';

export interface PaymentMethod {
  id?: number;
  type: PaymentMethodType;
  name?: string;
  isDefault?: boolean;
  cardDetails?: {
    cardNumber: string; // Last 4 digits should be stored
    expiryDate: string; // MM/YY
    cvv?: string; // Only for immediate processing
    holderName: string;
    brand?: 'VISA' | 'MASTERCARD' | 'AMEX'; // Detected from cardNumber
  };
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountHolderName: string;
  };
  paypalEmail?: string;
  walletBalance?: number;
  createdAt?: string;
}

export interface Invoice {
  id?: number;
  invoiceNumber: string;
  userId: number;
  paymentId: number;
  orderId?: number;
  invoiceDate: string;
  dueDate?: string;
  amount: number;
  currency?: string;
  items?: InvoiceItem[];
  tax?: number;
  discount?: number;
  total: number;
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  documentUrl?: string;
  createdAt?: string;
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  tax?: number;
}

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export interface Subscription {
  id?: number;
  userId: number;
  plan: SubscriptionPlan;
  startDate: string;
  endDate?: string;
  status: SubscriptionStatus;
  autoRenew?: boolean;
  paymentMethod?: PaymentMethod;
  billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  amount: number;
  currency?: string;
  features?: string[];
  nextBillingDate?: string;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionPlanDetails {
  id?: number;
  plan: SubscriptionPlan;
  price: number;
  currency?: string;
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  description?: string;
  features: SubscriptionFeature[];
  limitations?: SubscriptionLimitation[];
  trialPeriodDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionFeature {
  id?: number;
  name: string;
  description?: string;
  limit?: number; // e.g., 5 appointments per month
  unit?: string;
}

export interface SubscriptionLimitation {
  feature: string;
  limit: number;
  unit: string;
}

export interface Transaction {
  id?: number;
  userId: number;
  type: 'PAYMENT' | 'REFUND' | 'SUBSCRIPTION' | 'ADJUSTMENT';
  amount: number;
  currency?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  relatedEntityId?: number; // Order ID, Subscription ID, etc.
  relatedEntityType?: string; // Order, Subscription, etc.
  description?: string;
  transactionId?: string;
  timestamp: string;
  createdAt?: string;
}

export interface BillingHistory {
  userId: number;
  payments: Payment[];
  invoices: Invoice[];
  subscriptions: Subscription[];
  totalSpent?: number;
  currency?: string;
}

export interface Refund {
  id?: number;
  paymentId: number;
  orderId?: number;
  amount: number;
  reason: string;
  status?: 'REQUESTED' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestedAt?: string;
  processedAt?: string;
  notes?: string;
  createdAt?: string;
}

export interface Coupon {
  id?: number;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxUses?: number;
  usedCount?: number;
  validFrom: string;
  validUntil: string;
  minOrderAmount?: number;
  applicableToPlans?: SubscriptionPlan[];
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  createdAt?: string;
}

export interface PromoCode {
  id?: number;
  code: string;
  discount: number;
  expiryDate: string;
  maxUses?: number;
  usedCount?: number;
  applicableTo?: string[]; // e.g., ['MEDICINES', 'SUBSCRIPTIONS']
  createdAt?: string;
}

export interface BillingAddress {
  id?: number;
  userId: number;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingAddress extends BillingAddress {}
