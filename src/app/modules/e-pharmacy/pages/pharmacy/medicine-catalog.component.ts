import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Medicine, SearchMedicinesParams } from '../../../../../types/pharmacy';
import { PharmacyApiService } from '../../services/pharmacyApi.service';
import { CartService } from '../../services/cart.service';
import { MedicineCardComponent } from '../../components/pharmacy/medicine-card.component';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-medicine-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MedicineCardComponent],
  templateUrl: './medicine-catalog.component.html',
  styleUrls: ['./medicine-catalog.component.css']
})
export class MedicineCatalogComponent implements OnInit {
  medicines: Medicine[] = [];
  isLoading = false;
  error: string | null = null;
  userRole = '';

  // Search filters
  searchKeyword = '';
  selectedCategory = '';
  prescriptionRequired = false;
  currentPage = 0;
  pageSize = 12;
  totalPages = 0;
  totalElements = 0;

  // Available categories (can be fetched from API)
  categories = [
    'Pain Relief',
    'Cold & Flu',
    'Antibiotics',
    'Vitamins',
    'Antacids',
    'Allergy Relief',
    'Cough Suppressant',
    'Antihistamine'
  ];

  constructor(
    private pharmacyApi: PharmacyApiService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.userRole = (user?.role || '').toUpperCase();
    });

    this.loadMedicines();
  }

  loadMedicines(): void {
    this.isLoading = true;
    this.error = null;

    const params: SearchMedicinesParams = {
      keyword: this.searchKeyword || undefined,
      category: this.selectedCategory || undefined,
      prescriptionRequired: this.prescriptionRequired || undefined,
      page: this.currentPage,
      size: this.pageSize
    };

    this.pharmacyApi.searchMedicines(params).subscribe({
      next: (response) => {
        this.medicines = response.content;
        this.totalPages = response.totalPages;
        this.totalElements = response.totalElements;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load medicines. Please try again.';
        console.error('Error loading medicines:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadMedicines();
  }

  onCategoryChange(): void {
    this.currentPage = 0;
    this.loadMedicines();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadMedicines();
  }

  onAddToCart(medicine: Medicine): void {
    if (this.isPharmacist()) {
      return;
    }

    this.cartService.addToCart({
      medicineId: medicine.id,
      medicineName: medicine.name,
      price: medicine.price,
      quantity: 1,
      prescriptionRequired: medicine.prescriptionRequired
    });
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadMedicines();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadMedicines();
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadMedicines();
  }

  get displayPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(5, this.totalPages);
    let startPage = Math.max(0, this.currentPage - Math.floor(maxPages / 2));

    if (startPage + maxPages > this.totalPages) {
      startPage = Math.max(0, this.totalPages - maxPages);
    }

    for (let i = 0; i < maxPages; i++) {
      pages.push(startPage + i);
    }

    return pages;
  }

  clearFilters(): void {
    this.searchKeyword = '';
    this.selectedCategory = '';
    this.prescriptionRequired = false;
    this.currentPage = 0;
    this.loadMedicines();
  }

  isPharmacist(): boolean {
    return this.userRole === 'PHARMACIST' || this.userRole === 'ADMIN';
  }
}
