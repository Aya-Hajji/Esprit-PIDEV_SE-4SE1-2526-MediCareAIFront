import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem, OrderItem } from '../../../../../types/pharmacy';

export type ItemType = CartItem | OrderItem;

@Component({
  selector: 'app-order-item',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.css']
})
export class OrderItemComponent {
  @Input() item!: ItemType;
  @Input() isEditable = false;
  @Input() showPrice = true;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() itemRemoved = new EventEmitter<void>();

  onQuantityChange(newQuantity: string): void {
    const quantity = parseInt(newQuantity, 10);
    if (quantity > 0) {
      this.quantityChanged.emit(quantity);
    }
  }

  onRemove(): void {
    this.itemRemoved.emit();
  }

  getItemPrice(): number {
    if ('price' in this.item) {
      return this.item.price;
    }
    return 0;
  }

  getSubtotal(): number {
    if ('price' in this.item) {
      return this.item.price * this.item.quantity;
    }
    return 0;
  }

  isCartItem(): boolean {
    return 'prescriptionRequired' in this.item;
  }
}
