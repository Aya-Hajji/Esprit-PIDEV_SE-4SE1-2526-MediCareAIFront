/**
 * E-Pharmacy Models
 * Supports medicine catalog, prescriptions, orders, and drug interactions
 */

export interface Medicine {
  id?: number;
  name: string;
  dosage: string;
  category: string;
  price: number;
  imageUrl?: string;
  description?: string;
  sideEffects?: string;
  requiresPrescription: boolean;
  stock?: number;
  lowStockThreshold?: number;
  activeIngredients?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicineSearchResult {
  content: Medicine[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface PrescriptionItem {
  id?: number;
  medicineId: number;
  medicineName?: string;
  quantity: number;
  dosage: string;
  frequency: string; // e.g., "3 times daily", "Once before bed"
  durationDays: number;
  instructions?: string;
}

export interface Prescription {
  id?: number;
  patientId: number;
  patientName?: string;
  doctorId?: number;
  doctorName?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  items: PrescriptionItem[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PrescriptionDTO extends Prescription {}

export interface PrescriptionUpload {
  imageFile: File;
  doctorName?: string;
}

export interface OrderItem {
  id?: number;
  medicineId: number;
  medicineName?: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
  prescriptionRequired?: boolean;
}

export interface Order {
  id?: number;
  patientId: number;
  items: OrderItem[];
  totalPrice: number;
  status?: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress: string;
  prescriptionId?: number;
  paymentStatus?: 'UNPAID' | 'PAID' | 'REFUNDED';
  orderDate?: string;
  deliveryDate?: string;
  tracking?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderDTO extends Order {}

export interface OrderSearchResult {
  content: Order[];
  totalElements: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface DrugInteraction {
  id?: number;
  medicine1Id: number;
  medicine1Name?: string;
  medicine2Id: number;
  medicine2Name?: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  description: string;
  recommendation?: string;
}

export interface DrugInteractionCheck {
  medicineIds: number[];
  interactions: DrugInteraction[];
  hasWarnings: boolean;
}

export interface Inventory {
  medicineId: number;
  medicineName: string;
  quantity: number;
  lowStockThreshold: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt?: string;
}

export interface PharmacyRefill {
  id?: number;
  prescriptionId: number;
  patientId: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  requestedAt?: string;
  approvedAt?: string;
}

export interface PaymentMethod {
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  cardDetails?: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    holderName: string;
  };
}

export interface Payment {
  id?: number;
  orderId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  transactionDate?: string;
  refundAmount?: number;
  refundReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  medicineId: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  requiresPrescription: boolean;
}

export interface ShoppingCart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  count: number;
}
