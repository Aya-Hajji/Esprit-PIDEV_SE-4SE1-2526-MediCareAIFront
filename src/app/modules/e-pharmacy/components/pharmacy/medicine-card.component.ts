import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Medicine } from '../../../../../types/pharmacy';

@Component({
  selector: 'app-medicine-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './medicine-card.component.html',
  styleUrls: ['./medicine-card.component.css']
})
export class MedicineCardComponent {
  @Input() medicine!: Medicine;
  @Input() canOrder = true;
  @Output() addToCart = new EventEmitter<Medicine>();

  onAddToCart(): void {
    this.addToCart.emit(this.medicine);
  }

  getStockStatusClass(): string {
    if (this.medicine.stock > 10) {
      return 'stock-high';
    } else if (this.medicine.stock > 0) {
      return 'stock-low';
    } else {
      return 'stock-out';
    }
  }

  getStockStatusText(): string {
    if (this.medicine.stock > 10) {
      return 'In Stock';
    } else if (this.medicine.stock > 0) {
      return 'Low Stock';
    } else {
      return 'Out of Stock';
    }
  }
}
