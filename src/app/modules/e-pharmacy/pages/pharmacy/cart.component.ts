import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Cart, CartItem } from '../../../../../types/pharmacy';
import { CartService } from '../../services/cart.service';
import { OrderItemComponent } from '../../components/pharmacy/order-item.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, OrderItemComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: Cart = { items: [], totalPrice: 0 };
  isProcessing = false;

  constructor(private cartService: CartService) {}

  ngOnInit(): void {
    this.cartService.cart.subscribe((cart) => {
      this.cart = cart;
    });
  }

  onQuantityChanged(medicineId: string, newQuantity: number): void {
    this.cartService.updateQuantity(medicineId, newQuantity);
  }

  onItemRemoved(medicineId: string): void {
    this.cartService.removeFromCart(medicineId);
  }

  get cartItems(): CartItem[] {
    return this.cart.items;
  }

  get itemCount(): number {
    return this.cartService.getItemCount();
  }

  get totalPrice(): number {
    return this.cartService.getTotalPrice();
  }

  get isCartEmpty(): boolean {
    return this.cartService.isCartEmpty();
  }

  clearCart(): void {
    if (confirm('Are you sure you want to clear your cart?')) {
      this.cartService.clearCart();
    }
  }

  continueShopping(): void {
    // Router navigation will be handled in the parent
  }
}
