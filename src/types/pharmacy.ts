/**
 * Pharmacy Module Type Definitions
 */

// ============ Medicine Types ============
export interface Medicine {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  price: number;
  strength: string;
  dosageForm: string;
  prescriptionRequired: boolean;
  stock: number;
  category: string;
  sideEffects?: string;
  contraindications?: string;
  interactions?: string[];
}

export interface SearchMedicinesParams {
  keyword?: string;
  category?: string;
  prescriptionRequired?: boolean;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============ Prescription Types ============
export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  createdDate: Date;
  expiryDate: Date;
  status: 'ACTIVE' | 'EXPIRED' | 'FULFILLED' | 'REFILLED';
  items: PrescriptionItem[];
  notes?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface CreatePrescriptionRequest {
  patientEmail: string;
  items: CreatePrescriptionItemRequest[];
  notes?: string;
}

export interface CreatePrescriptionItemRequest {
  medicineId: string;
  quantity: number;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface UploadPrescriptionRequest {
  file: File;
}

// ============ Cart Types ============
export interface CartItem {
  medicineId: string;
  medicineName: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
  prescriptionId?: string;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

// ============ Order Types ============
export interface Order {
  id: string;
  patientId: string;
  orderDate: Date;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalPrice: number;
  trackingNumber?: string;
  estimatedDelivery?: Date;
}

export interface OrderItem {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateOrderRequest {
  items: OrderItemRequest[];
  shippingAddress: ShippingAddress;
}

export interface OrderItemRequest {
  medicineId: string;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ============ Inventory Types ============
export interface InventoryEntry {
  id: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  warehouseLocation: string;
  lastUpdated: Date;
}

export interface UpdateInventoryRequest {
  medicineId: string;
  quantity: number;
  warehouseLocation: string;
}

// ============ Drug Interaction Types ============
export interface DrugInteractionAlert {
  medicineId1: string;
  medicineName1: string;
  medicineId2: string;
  medicineName2: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH';
  description: string;
}

export interface CheckInteractionsRequest {
  medicineIds: string[];
}

export interface CheckInteractionsResponse {
  interactions: DrugInteractionAlert[];
  hasCriticalInteractions: boolean;
}

// ============ Refill Types ============
export interface RefillRequest {
  id: string;
  prescriptionId: string;
  patientId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  createdDate: Date;
  processedDate?: Date;
  requestedItems?: PrescriptionItem[];
}

export interface CreateRefillRequest {
  prescriptionId: string;
}

// ============ API Response Wrappers ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}
