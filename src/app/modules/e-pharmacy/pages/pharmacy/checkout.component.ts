import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  Cart,
  CreateOrderRequest,
  DrugInteractionAlert,
  ShippingAddress,
  CheckInteractionsResponse
} from '../../../../../types/pharmacy';
import { CartService } from '../../services/cart.service';
import { PharmacyApiService } from '../../services/pharmacyApi.service';
import { DrugInteractionModalComponent } from '../../components/pharmacy/drug-interaction-modal.component';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DrugInteractionModalComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  checkoutForm!: FormGroup;
  cart: Cart = { items: [], totalPrice: 0 };
  isLoading = false;
  isSubmitting = false;
  error: string | null = null;

  // Drug interactions
  interactions: DrugInteractionAlert[] = [];
  showInteractionModal = false;
  hasCriticalInteractions = false;
  interactionsChecked = false;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private pharmacyApi: PharmacyApiService,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.cartService.cart.subscribe((cart) => {
      this.cart = cart;
    });

    // Redirect if cart is empty
    if (this.cartService.isCartEmpty()) {
      this.router.navigate(['/pharmacy/cart']);
    }
  }

  private initializeForm(): void {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      street: ['', [Validators.required, Validators.minLength(5)]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      state: ['', [Validators.required, Validators.minLength(2)]],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5,6}$/)]],
      country: ['United States', Validators.required],
      terms: [false, Validators.requiredTrue]
    });
  }

  checkInteractions(): void {
    if (this.interactionsChecked) {
      // Already checked, proceed to submit
      this.submitOrder();
      return;
    }

    this.isLoading = true;
    const medicineIds = this.cart.items.map((item) => item.medicineId);

    this.pharmacyApi.checkInteractions(medicineIds).subscribe({
      next: (response: CheckInteractionsResponse) => {
        this.interactions = response.interactions;
        this.hasCriticalInteractions = response.hasCriticalInteractions;
        this.isLoading = false;

        if (this.interactions.length > 0) {
          this.showInteractionModal = true;
        } else {
          this.interactionsChecked = true;
          this.submitOrder();
        }
      },
      error: (err) => {
        this.error = 'Failed to check drug interactions. Please try again.';
        console.error('Error checking interactions:', err);
        this.isLoading = false;
      }
    });
  }

  onInteractionConfirm(): void {
    this.showInteractionModal = false;
    this.interactionsChecked = true;
    this.submitOrder();
  }

  onInteractionCancel(): void {
    this.showInteractionModal = false;
  }

  private submitOrder(): void {
    if (!this.checkoutForm.valid) {
      this.error = 'Please fill out all required fields correctly.';
      return;
    }

    this.isSubmitting = true;
    this.error = null;

    const formValue = this.checkoutForm.value;
    const shippingAddress: ShippingAddress = {
      fullName: formValue.fullName,
      phoneNumber: formValue.phoneNumber,
      street: formValue.street,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode,
      country: formValue.country
    };

    const orderRequest: CreateOrderRequest = {
      items: this.cart.items.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity
      })),
      shippingAddress
    };

    this.pharmacyApi.createOrder(orderRequest).subscribe({
      next: (order) => {
        this.isSubmitting = false;
        this.cartService.clearCart();
        this.router.navigate(['/pharmacy/order-confirmation'], {
          queryParams: { orderId: order.id }
        });
      },
      error: (err) => {
        this.error = 'Failed to place order. Please try again.';
        console.error('Error placing order:', err);
        this.isSubmitting = false;
      }
    });
  }

  onSubmit(): void {
    this.checkInteractions();
  }

  get totalPrice(): number {
    return this.cartService.getTotalPrice();
  }

  get cartItems() {
    return this.cart.items;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getFieldError(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return 'This field is required';
      if (field.errors['minlength']) return `Minimum length is ${field.errors['minlength'].requiredLength}`;
      if (field.errors['pattern']) return 'Invalid format';
    }
    return '';
  }
}
