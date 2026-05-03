import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CartItem, Cart } from '../../../../types/pharmacy';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartSubject: BehaviorSubject<Cart>;
  public cart: Observable<Cart>;

  constructor() {
    const initialCart = this.getCartFromLocalStorage();
    this.cartSubject = new BehaviorSubject<Cart>(initialCart);
    this.cart = this.cartSubject.asObservable();
  }

  /**
   * Get current cart value
   */
  public get cartValue(): Cart {
    return this.cartSubject.value;
  }

  /**
   * Add item to cart or update quantity
   */
  addToCart(item: CartItem): void {
    const currentCart = this.cartValue;
    const existingItem = currentCart.items.find(
      (i) => i.medicineId === item.medicineId
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      currentCart.items.push(item);
    }

    this.updateCart(currentCart);
  }

  /**
   * Remove item from cart
   */
  removeFromCart(medicineId: string): void {
    const currentCart = this.cartValue;
    currentCart.items = currentCart.items.filter(
      (item) => item.medicineId !== medicineId
    );
    this.updateCart(currentCart);
  }

  /**
   * Update item quantity
   */
  updateQuantity(medicineId: string, quantity: number): void {
    const currentCart = this.cartValue;
    const item = currentCart.items.find((i) => i.medicineId === medicineId);

    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(medicineId);
      } else {
        item.quantity = quantity;
        this.updateCart(currentCart);
      }
    }
  }

  /**
   * Clear all items from cart
   */
  clearCart(): void {
    const emptyCart: Cart = {
      items: [],
      totalPrice: 0
    };
    this.updateCart(emptyCart);
  }

  /**
   * Get cart items
   */
  getCartItems(): CartItem[] {
    return this.cartValue.items;
  }

  /**
   * Calculate and get total price
   */
  getTotalPrice(): number {
    return this.cartValue.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  /**
   * Get cart item count
   */
  getItemCount(): number {
    return this.cartValue.items.reduce((count, item) => count + item.quantity, 0);
  }

  /**
   * Check if cart is empty
   */
  isCartEmpty(): boolean {
    return this.cartValue.items.length === 0;
  }

  /**
   * Update entire cart and persist to localStorage
   */
  private updateCart(cart: Cart): void {
    cart.totalPrice = this.calculateTotal(cart.items);
    this.cartSubject.next(cart);
    this.saveCartToLocalStorage(cart);
  }

  /**
   * Calculate total price for items
   */
  private calculateTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  /**
   * Save cart to localStorage
   */
  private saveCartToLocalStorage(cart: Cart): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('pharmacy_cart', JSON.stringify(cart));
  }

  /**
   * Get cart from localStorage
   */
  private getCartFromLocalStorage(): Cart {
    if (typeof window === 'undefined') {
      return { items: [], totalPrice: 0 };
    }

    const cart = localStorage.getItem('pharmacy_cart');
    if (!cart || cart === 'undefined' || cart === 'null') {
      return { items: [], totalPrice: 0 };
    }

    try {
      const parsed = JSON.parse(cart);
      return {
        items: parsed.items || [],
        totalPrice: this.calculateTotal(parsed.items || [])
      };
    } catch (error) {
      console.error('Error parsing cart from localStorage:', error);
      return { items: [], totalPrice: 0 };
    }
  }
}
