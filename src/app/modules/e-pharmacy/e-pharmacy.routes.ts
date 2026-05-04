import { Routes } from '@angular/router';
import { AuthGuard } from '../../services/auth.guard';
import { DashboardShellComponent } from '../../shared/components/dashboard-shell/dashboard-shell.component';

export const E_PHARMACY_ROUTES: Routes = [
  {
    path: 'pharmacy',
    component: DashboardShellComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'PATIENT'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/pharmacy/pharmacy-home.component').then((m) => m.PharmacyHomeComponent)
      },
      {
        path: 'medicines',
        loadComponent: () => import('./pages/pharmacy/medicine-catalog.component').then((m) => m.MedicineCatalogComponent)
      },
      {
        path: 'medicines/:id',
        loadComponent: () => import('./pages/pharmacy/medicine-detail.component').then((m) => m.MedicineDetailComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/pharmacy/cart.component').then((m) => m.CartComponent)
      },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/pharmacy/checkout.component').then((m) => m.CheckoutComponent)
      },
      {
        path: 'order-confirmation',
        loadComponent: () => import('./pages/pharmacy/order-confirmation.component').then((m) => m.OrderConfirmationComponent)
      },
      {
        path: 'prescriptions',
        loadComponent: () => import('./pages/pharmacy/prescriptions-list.component').then((m) => m.PrescriptionsListComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./pages/pharmacy/inventory.component').then((m) => m.InventoryComponent)
      },
      {
        path: 'refills',
        loadComponent: () => import('./pages/pharmacy/refills.component').then((m) => m.RefillsComponent)
      }
    ]
  }
];
