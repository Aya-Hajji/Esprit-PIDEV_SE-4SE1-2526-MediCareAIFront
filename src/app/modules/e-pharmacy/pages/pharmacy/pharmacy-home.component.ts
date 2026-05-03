import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../../../services/auth.service';

interface QuickAction {
  title: string;
  description: string;
  route: string;
  icon: string;
  visible: boolean;
}

@Component({
  selector: 'app-pharmacy-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pharmacy-home.component.html',
  styleUrls: ['./pharmacy-home.component.css']
})
export class PharmacyHomeComponent implements OnInit {
  userRole = '';
  cartItems = 0;

  constructor(
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe((user) => {
      this.userRole = (user?.role || '').toUpperCase();
    });

    this.cartService.cart.subscribe(() => {
      this.cartItems = this.cartService.getItemCount();
    });
  }

  get quickActions(): QuickAction[] {
    return [
      {
        title: 'Browse Medicines',
        description: 'Search catalog and view medicine details',
        route: '/pharmacy/medicines',
        icon: '💊',
        visible: true
      },
      {
        title: 'My Cart',
        description: 'Review selected items and checkout',
        route: '/pharmacy/cart',
        icon: '🛒',
        visible: true
      },
      {
        title: 'Prescriptions',
        description: 'Track active and past prescriptions',
        route: '/pharmacy/prescriptions',
        icon: '📄',
        visible: true
      },
      {
        title: 'Refill Requests',
        description: 'Request and monitor prescription refills',
        route: '/pharmacy/refills',
        icon: '🔁',
        visible: true
      },
      {
        title: 'Inventory',
        description: 'Manage stock and warehouse quantities',
        route: '/pharmacy/inventory',
        icon: '📦',
        visible: this.userRole === 'PHARMACIST' || this.userRole === 'ADMIN'
      }
    ].filter((x) => x.visible);
  }

  get roleLabel(): string {
    if (!this.userRole) {
      return 'Guest';
    }

    return this.userRole.charAt(0) + this.userRole.slice(1).toLowerCase();
  }
}
