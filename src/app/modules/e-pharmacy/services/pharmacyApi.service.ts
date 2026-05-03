import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Medicine,
  SearchMedicinesParams,
  PageResponse,
  Prescription,
  Order,
  InventoryEntry,
  UpdateInventoryRequest,
  CheckInteractionsRequest,
  CheckInteractionsResponse,
  RefillRequest,
  CreateRefillRequest,
  CreateOrderRequest,
  CreatePrescriptionRequest,
  UploadPrescriptionRequest,
} from '../../../../types/pharmacy';

@Injectable({
  providedIn: 'root'
})
export class PharmacyApiService {
  private apiUrl = 'http://localhost:8089/MediCareAI/api/pharmacy';
  private mockMedicinesStorageKey = 'pharmacy_mock_medicines';

  private defaultMockMedicines: Medicine[] = [
    {
      id: 'med-001',
      name: 'Paracetamol',
      description: 'Pain reliever and fever reducer for mild to moderate symptoms.',
      manufacturer: 'MediCare Labs',
      price: 4.5,
      strength: '500mg',
      dosageForm: 'Tablet',
      prescriptionRequired: false,
      stock: 120,
      category: 'Pain Relief'
    },
    {
      id: 'med-002',
      name: 'Ibuprofen',
      description: 'Anti-inflammatory medicine for pain and swelling.',
      manufacturer: 'HealthNova',
      price: 6.8,
      strength: '400mg',
      dosageForm: 'Tablet',
      prescriptionRequired: false,
      stock: 80,
      category: 'Pain Relief'
    },
    {
      id: 'med-003',
      name: 'Amoxicillin',
      description: 'Antibiotic used for bacterial infections.',
      manufacturer: 'BioCure',
      price: 14.2,
      strength: '250mg',
      dosageForm: 'Capsule',
      prescriptionRequired: true,
      stock: 42,
      category: 'Antibiotics'
    },
    {
      id: 'med-004',
      name: 'Cetirizine',
      description: 'Antihistamine for allergy symptoms and sneezing.',
      manufacturer: 'AllerFree',
      price: 5.9,
      strength: '10mg',
      dosageForm: 'Tablet',
      prescriptionRequired: false,
      stock: 96,
      category: 'Allergy Relief'
    },
    {
      id: 'med-005',
      name: 'Omeprazole',
      description: 'Reduces stomach acid and treats reflux.',
      manufacturer: 'GastroCare',
      price: 8.25,
      strength: '20mg',
      dosageForm: 'Capsule',
      prescriptionRequired: false,
      stock: 67,
      category: 'Antacids'
    },
    {
      id: 'med-006',
      name: 'Vitamin C',
      description: 'Daily supplement for immune support.',
      manufacturer: 'NutriPlus',
      price: 3.95,
      strength: '1000mg',
      dosageForm: 'Tablet',
      prescriptionRequired: false,
      stock: 150,
      category: 'Vitamins'
    }
  ];

  constructor(private http: HttpClient) {}

  // ============ Medicine Endpoints ============

  /**
   * Search medicines with filters
   */
  searchMedicines(params: SearchMedicinesParams): Observable<PageResponse<Medicine>> {
    let httpParams = new HttpParams();
    
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.prescriptionRequired !== undefined) {
      httpParams = httpParams.set('prescriptionRequired', params.prescriptionRequired.toString());
    }
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());

    return this.http.get<PageResponse<Medicine>>(
      `${this.apiUrl}/medicines`,
      { params: httpParams }
    ).pipe(
      catchError(() => of(this.searchMockMedicines(params)))
    );
  }

  /**
   * Get medicine details by ID
   */
  getMedicineById(id: string): Observable<Medicine> {
    return this.http.get<Medicine>(`${this.apiUrl}/medicines/${id}`).pipe(
      catchError(() => {
        const medicine = this.getMockMedicines().find((m) => m.id === id);
        if (medicine) {
          return of(medicine);
        }

        return throwError(() => new Error('Medicine not found'));
      })
    );
  }

  /**
   * Add medicine to catalog (pharmacist workflow)
   */
  addMedicine(medicine: Omit<Medicine, 'id'>): Observable<Medicine> {
    return this.http.post<Medicine>(`${this.apiUrl}/medicines`, medicine).pipe(
      catchError(() => {
        const mockMedicines = this.getMockMedicines();
        const newMedicine: Medicine = {
          ...medicine,
          id: `med-${Date.now()}`
        };

        mockMedicines.push(newMedicine);
        this.saveMockMedicines(mockMedicines);
        return of(newMedicine);
      })
    );
  }

  // ============ Prescription Endpoints ============

  /**
   * Get user's prescriptions
   */
  getPrescriptions(): Observable<Prescription[]> {
    return this.http.get<Prescription[]>(`${this.apiUrl}/prescriptions`);
  }

  /**
   * Get prescription details by ID
   */
  getPrescriptionById(id: string): Observable<Prescription> {
    return this.http.get<Prescription>(`${this.apiUrl}/prescriptions/${id}`);
  }

  /**
   * Create a new prescription (doctor only)
   */
  createPrescription(request: CreatePrescriptionRequest): Observable<Prescription> {
    return this.http.post<Prescription>(
      `${this.apiUrl}/prescriptions`,
      request
    );
  }

  /**
   * Upload prescription image (patient)
   */
  uploadPrescription(file: File): Observable<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ id: string; url: string }>(
      `${this.apiUrl}/prescriptions/upload`,
      formData
    );
  }

  // ============ Order Endpoints ============

  /**
   * Get order history for patient
   */
  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  /**
   * Get order details by ID
   */
  getOrderById(id: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  /**
   * Place a new order
   */
  createOrder(request: CreateOrderRequest): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, request);
  }

  /**
   * Cancel an order
   */
  cancelOrder(id: string): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders/${id}/cancel`, {});
  }

  /**
   * Delete an order (admin only)
   */
  deleteOrder(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/orders/${id}`);
  }

  // ============ Inventory Endpoints ============

  /**
   * Get inventory status (pharmacist only)
   */
  getInventory(): Observable<InventoryEntry[]> {
    return this.http.get<InventoryEntry[]>(`${this.apiUrl}/inventory`).pipe(
      catchError(() => {
        const mappedInventory: InventoryEntry[] = this.getMockMedicines().map((medicine) => ({
          id: `inv-${medicine.id}`,
          medicineId: medicine.id,
          medicineName: medicine.name,
          quantity: medicine.stock,
          warehouseLocation: 'Main Warehouse',
          lastUpdated: new Date()
        }));

        return of(mappedInventory);
      })
    );
  }

  /**
   * Update inventory (pharmacist only)
   */
  updateInventory(request: UpdateInventoryRequest): Observable<InventoryEntry> {
    return this.http.put<InventoryEntry>(`${this.apiUrl}/inventory`, request).pipe(
      catchError(() => {
        const mockMedicines = this.getMockMedicines();
        const index = mockMedicines.findIndex((m) => m.id === request.medicineId);

        if (index !== -1) {
          mockMedicines[index].stock = request.quantity;
          this.saveMockMedicines(mockMedicines);
        }

        return of({
          id: `inv-${request.medicineId}`,
          medicineId: request.medicineId,
          medicineName: mockMedicines[index]?.name || request.medicineId,
          quantity: request.quantity,
          warehouseLocation: request.warehouseLocation,
          lastUpdated: new Date()
        });
      })
    );
  }

  /**
   * Delete inventory entry (pharmacist only)
   */
  deleteInventoryEntry(medicineId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}/inventory/${medicineId}`
    ).pipe(
      catchError(() => {
        const filtered = this.getMockMedicines().filter((m) => m.id !== medicineId);
        this.saveMockMedicines(filtered);
        return of({ message: 'Inventory entry deleted (mock mode).' });
      })
    );
  }

  // ============ Drug Interaction Endpoints ============

  /**
   * Check for drug interactions
   */
  checkInteractions(medicineIds: string[]): Observable<CheckInteractionsResponse> {
    const request: CheckInteractionsRequest = { medicineIds };
    return this.http.post<CheckInteractionsResponse>(
      `${this.apiUrl}/interactions/check`,
      request
    );
  }

  // ============ Refill Endpoints ============

  /**
   * Get refill requests (patient: own; pharmacist: all)
   */
  getRefills(): Observable<RefillRequest[]> {
    return this.http.get<RefillRequest[]>(`${this.apiUrl}/refills`);
  }

  /**
   * Request a refill (patient)
   */
  requestRefill(prescriptionId: string): Observable<RefillRequest> {
    const request: CreateRefillRequest = { prescriptionId };
    return this.http.post<RefillRequest>(`${this.apiUrl}/refills`, request);
  }

  /**
   * Delete refill request
   */
  deleteRefillRequest(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/refills/${id}`);
  }

  private getMockMedicines(): Medicine[] {
    if (typeof window === 'undefined') {
      return this.defaultMockMedicines;
    }

    const raw = localStorage.getItem(this.mockMedicinesStorageKey);
    if (!raw) {
      this.saveMockMedicines(this.defaultMockMedicines);
      return [...this.defaultMockMedicines];
    }

    try {
      const parsed = JSON.parse(raw) as Medicine[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        this.saveMockMedicines(this.defaultMockMedicines);
        return [...this.defaultMockMedicines];
      }

      return parsed;
    } catch {
      this.saveMockMedicines(this.defaultMockMedicines);
      return [...this.defaultMockMedicines];
    }
  }

  private saveMockMedicines(medicines: Medicine[]): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.mockMedicinesStorageKey, JSON.stringify(medicines));
  }

  private searchMockMedicines(params: SearchMedicinesParams): PageResponse<Medicine> {
    const keyword = (params.keyword || '').trim().toLowerCase();
    const all = this.getMockMedicines();

    const filtered = all.filter((medicine) => {
      const matchesKeyword = !keyword ||
        medicine.name.toLowerCase().includes(keyword) ||
        medicine.description.toLowerCase().includes(keyword) ||
        medicine.manufacturer.toLowerCase().includes(keyword);

      const matchesCategory = !params.category || medicine.category === params.category;
      const matchesPrescription =
        params.prescriptionRequired === undefined ||
        medicine.prescriptionRequired === params.prescriptionRequired;

      return matchesKeyword && matchesCategory && matchesPrescription;
    });

    const page = params.page ?? 0;
    const size = params.size ?? 12;
    const start = page * size;
    const content = filtered.slice(start, start + size);
    const totalPages = Math.max(1, Math.ceil(filtered.length / size));

    return {
      content,
      totalElements: filtered.length,
      totalPages,
      currentPage: page,
      pageSize: size,
      hasNext: page + 1 < totalPages,
      hasPrevious: page > 0
    };
  }
}
