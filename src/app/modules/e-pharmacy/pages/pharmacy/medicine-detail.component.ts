import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Medicine, CartItem } from '../../../../../types/pharmacy';
import { PharmacyApiService } from '../../services/pharmacyApi.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-medicine-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medicine-detail.component.html',
  styleUrls: ['./medicine-detail.component.css']
})
export class MedicineDetailComponent implements OnInit {
  medicine: Medicine | null = null;
  isLoading = true;
  error: string | null = null;
  quantity = 1;
  addedToCart = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private pharmacyApi: PharmacyApiService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadMedicineDetails(id);
      }
    });
  }

  private loadMedicineDetails(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.pharmacyApi.getMedicineById(id).subscribe({
      next: (medicine) => {
        this.medicine = medicine;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Failed to load medicine details. Please try again.';
        console.error('Error loading medicine:', err);
        this.isLoading = false;
      }
    });
  }

  onAddToCart(): void {
    if (!this.medicine) return;

    const cartItem: CartItem = {
      medicineId: this.medicine.id,
      medicineName: this.medicine.name,
      price: this.medicine.price,
      quantity: this.quantity,
      prescriptionRequired: this.medicine.prescriptionRequired
    };

    this.cartService.addToCart(cartItem);
    this.addedToCart = true;

    // Reset message after 3 seconds
    setTimeout(() => {
      this.addedToCart = false;
    }, 3000);
  }

  increaseQuantity(): void {
    if (this.medicine && this.quantity < this.medicine.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  onQuantityChange(value: string): void {
    const newQuantity = parseInt(value, 10);
    if (newQuantity > 0 && this.medicine && newQuantity <= this.medicine.stock) {
      this.quantity = newQuantity;
    }
  }

  getStockStatusClass(): string {
    if (!this.medicine) return '';
    if (this.medicine.stock > 10) return 'in-stock';
    if (this.medicine.stock > 0) return 'low-stock';
    return 'out-of-stock';
  }

  getStockStatusText(): string {
    if (!this.medicine) return '';
    if (this.medicine.stock > 10) return 'In Stock';
    if (this.medicine.stock > 0) return `Low Stock (${this.medicine.stock} available)`;
    return 'Out of Stock';
  }
}
