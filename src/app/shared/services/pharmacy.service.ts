import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Medicine,
  MedicineSearchResult,
  Prescription,
  PrescriptionDTO,
  PrescriptionItem,
  Order,
  OrderDTO,
  OrderSearchResult,
  DrugInteraction,
  DrugInteractionCheck,
  Inventory,
  PharmacyRefill,
  Payment,
  CartItem,
  ShoppingCart
} from '../models/pharmacy.model';
import { environment } from '../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {
  private baseUrl = environment.apiUrl.replace(/\/+$/, '');
  private pharmacyUrl = `${this.baseUrl}/api/pharmacy`;
  private medicinesUrl = `${this.pharmacyUrl}/medicines`;
  private prescriptionsUrl = `${this.pharmacyUrl}/prescriptions`;
  private ordersUrl = `${this.pharmacyUrl}/orders`;
  private inventoryUrl = `${this.pharmacyUrl}/inventory`;

  // Local shopping cart (can be moved to state management later)
  private cartSubject = new Map<number, CartItem>();

  constructor(private http: HttpClient) {
    this.loadCartFromStorage();
  }

  // ==================== MEDICINES ====================

  /**
   * Search medicines by keyword, category, prescription requirement
   */
  searchMedicines(
    keyword?: string,
    category?: string,
    requiresPrescription?: boolean,
    page: number = 0,
    size: number = 20
  ): Observable<MedicineSearchResult> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (requiresPrescription !== undefined) {
      params = params.set('requiresPrescription', requiresPrescription.toString());
    }

    return this.http.get<MedicineSearchResult>(this.medicinesUrl, { params });
  }

  /**
   * Get all medicines (admin/pharmacist only)
   */
  getAllMedicines(page: number = 0, size: number = 20): Observable<MedicineSearchResult> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<MedicineSearchResult>(this.medicinesUrl, { params });
  }

  /**
   * Get medicine by ID
   */
  getMedicineById(id: number): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.medicinesUrl}/${id}`);
  }

  /**
   * Create medicine (pharmacist only)
   */
  createMedicine(medicine: Medicine): Observable<Medicine> {
    return this.http.post<Medicine>(this.medicinesUrl, medicine);
  }

  /**
   * Update medicine (pharmacist only)
   */
  updateMedicine(id: number, medicine: Partial<Medicine>): Observable<Medicine> {
    return this.http.put<Medicine>(`${this.medicinesUrl}/${id}`, medicine);
  }

  /**
   * Delete medicine (pharmacist only)
   */
  deleteMedicine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.medicinesUrl}/${id}`);
  }

  // ==================== PRESCRIPTIONS ====================

  /**
   * Create prescription (doctor only)
   */
  createPrescription(prescription: PrescriptionDTO): Observable<Prescription> {
    return this.http.post<Prescription>(this.prescriptionsUrl, prescription);
  }

  /**
   * Get all prescriptions (paginated)
   */
  getAllPrescriptions(page: number = 0, size: number = 20): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get(this.prescriptionsUrl, { params });
  }

  /**
   * Get prescription by ID
   */
  getPrescriptionById(id: number): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.prescriptionsUrl}/${id}`);
  }

  /**
   * Upload prescription image
   */
  uploadPrescription(file: File, doctorName?: string): Observable<any> {
    const formData = new FormData();
    formData.append('imageFile', file);
    if (doctorName) {
      formData.append('doctorName', doctorName);
    }

    return this.http.post(`${this.prescriptionsUrl}/upload`, formData);
  }

  /**
   * Request prescription refill
   */
  requestRefill(prescriptionId: number, reason?: string): Observable<PharmacyRefill> {
    const body = { reason };
    return this.http.post<PharmacyRefill>(`${this.prescriptionsUrl}/${prescriptionId}/refill`, body);
  }

  /**
   * Get patient prescriptions
   */
  getPatientPrescriptions(patientId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.prescriptionsUrl}/patient/${patientId}`);
  }

  /**
   * Get doctor prescriptions
   */
  getDoctorPrescriptions(doctorId: number): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.prescriptionsUrl}/doctor/${doctorId}`);
  }

  // ==================== ORDERS ====================

  /**
   * Create order
   */
  createOrder(order: OrderDTO): Observable<Order> {
    return this.http.post<Order>(this.ordersUrl, order);
  }

  /**
   * Get all user orders (paginated)
   */
  getAllOrders(page: number = 0, size: number = 20): Observable<OrderSearchResult> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<OrderSearchResult>(this.ordersUrl, { params });
  }

  /**
   * Get order by ID
   */
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.ordersUrl}/${id}`);
  }

  /**
   * Cancel order
   */
  cancelOrder(id: number): Observable<any> {
    return this.http.post(`${this.ordersUrl}/${id}/cancel`, {});
  }

  /**
   * Process payment for order
   */
  payForOrder(id: number, payment: Payment): Observable<any> {
    return this.http.post(`${this.ordersUrl}/${id}/pay`, payment);
  }

  /**
   * Track order
   */
  trackOrder(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.ordersUrl}/${id}/track`);
  }

  // ==================== DRUG INTERACTIONS ====================

  /**
   * Check drug interactions
   */
  checkDrugInteractions(medicineIds: number[]): Observable<DrugInteractionCheck> {
    const params = new HttpParams().set('medicineIds', medicineIds.join(','));
    return this.http.get<DrugInteractionCheck>(`${this.pharmacyUrl}/drug-interactions`, { params });
  }

  /**
   * Get interactions for a specific medicine
   */
  getMedicineInteractions(medicineId: number): Observable<DrugInteraction[]> {
    return this.http.get<DrugInteraction[]>(`${this.medicinesUrl}/${medicineId}/interactions`);
  }

  // ==================== INVENTORY ====================

  /**
   * Get inventory status (pharmacist/admin only)
   */
  getInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.inventoryUrl);
  }

  /**
   * Update inventory for a medicine
   */
  updateInventory(medicineId: number, quantity: number, lowStockThreshold: number): Observable<Inventory> {
    const body = { quantity, lowStockThreshold };
    return this.http.put<Inventory>(`${this.inventoryUrl}/${medicineId}`, body);
  }

  /**
   * Get low stock medicines
   */
  getLowStockMedicines(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.inventoryUrl}/low-stock`);
  }

  // ==================== SHOPPING CART ====================

  /**
   * Add item to cart
   */
  addToCart(item: CartItem): void {
    this.cartSubject.set(item.medicineId, item);
    this.saveCartToStorage();
  }

  /**
   * Remove item from cart
   */
  removeFromCart(medicineId: number): void {
    this.cartSubject.delete(medicineId);
    this.saveCartToStorage();
  }

  /**
   * Get all cart items
   */
  getCartItems(): CartItem[] {
    return Array.from(this.cartSubject.values());
  }

  /**
   * Get shopping cart with totals
   */
  getShoppingCart(): ShoppingCart {
    const items = this.getCartItems();
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return {
      items,
      subtotal,
      tax,
      total,
      count: items.length
    };
  }

  /**
   * Clear cart
   */
  clearCart(): void {
    this.cartSubject.clear();
    this.saveCartToStorage();
  }

  /**
   * Update cart item quantity
   */
  updateCartItem(medicineId: number, quantity: number): void {
    const item = this.cartSubject.get(medicineId);
    if (item) {
      item.quantity = quantity;
      item.subtotal = item.unitPrice * quantity;
      this.cartSubject.set(medicineId, item);
      this.saveCartToStorage();
    }
  }

  /**
   * Save cart to local storage
   */
  private saveCartToStorage(): void {
    const cartData = Array.from(this.cartSubject.values());
    localStorage.setItem('pharmacy_cart', JSON.stringify(cartData));
  }

  /**
   * Load cart from local storage
   */
  private loadCartFromStorage(): void {
    try {
      const cartData = localStorage.getItem('pharmacy_cart');
      if (cartData) {
        const items: CartItem[] = JSON.parse(cartData);
        items.forEach(item => this.cartSubject.set(item.medicineId, item));
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      this.cartSubject.clear();
    }
  }
}
