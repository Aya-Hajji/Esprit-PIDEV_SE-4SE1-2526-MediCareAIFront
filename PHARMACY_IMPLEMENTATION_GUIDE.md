# E-Pharmacy Module Implementation Guide

## Completed Files

### Types & Services
- ✅ `src/types/pharmacy.ts` - All TypeScript type definitions
- ✅ `src/app/services/pharmacyApi.service.ts` - API service with all endpoints
- ✅ `src/app/services/cart.service.ts` - Cart state management

### Components
- ✅ `src/app/components/pharmacy/drug-interaction-modal.component.ts|html|css`
- ✅ `src/app/components/pharmacy/medicine-card.component.ts|html|css`
- ✅ `src/app/components/pharmacy/order-item.component.ts|html|css`

### Pages
- ✅ `src/app/pages/pharmacy/medicine-catalog.component.ts|html|css` - Browse medicines with search/filter
- ✅ `src/app/pages/pharmacy/cart.component.ts|html|css` - Shopping cart
- ✅ `src/app/pages/pharmacy/checkout.component.ts|html|css` - Checkout with drug interaction check

---

## Remaining Pages to Create

### 1. Medicine Detail Page
**File:** `src/app/pages/pharmacy/medicine-detail.component.ts`

Shows detailed information about a single medicine with add-to-cart functionality.

**Key Features:**
- Display medicine details (description, manufacturer, side effects, contraindications, interactions)
- Add to cart with quantity selector
- Related medicines suggestion
- Prescription requirement indicator

### 2. Order Confirmation Page
**File:** `src/app/pages/pharmacy/order-confirmation.component.ts`

Displays order success message with order ID and next steps.

**Key Features:**
- Order ID display
- Total amount
- Estimated delivery date
- "Continue Shopping" button
- Download invoice button

### 3. Order History Page
**File:** `src/app/pages/pharmacy/order-history.component.ts`

Lists all patient orders with status, date, and total.

**Key Features:**
- Orders list with pagination
- Filter by status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- Search by order ID
- Click to view details
- Cancel order button (if applicable)

### 4. Order Detail Page
**File:** `src/app/pages/pharmacy/order-detail.component.ts`

Detailed view of a single order including items and shipping address.

**Key Features:**
- Order items with quantities and prices
- Shipping address
- Order timeline/status
- Cancel order functionality
- Tracking number (if shipped)

### 5. Prescriptions List Page
**File:** `src/app/pages/pharmacy/prescriptions-list.component.ts`

Lists user's prescriptions (available to both patients and doctors).

**Key Features:**
- Prescriptions list with status indicator
- Filter by status (ACTIVE, EXPIRED, FULFILLED, REFILLED)
- Search prescriptions
- Click to view details
- For doctors: "Create Prescription" button

### 6. Prescription Detail Page
**File:** `src/app/pages/pharmacy/prescription-detail.component.ts`

Displays prescription items, dosage information, and instructions.

**Key Features:**
- Prescription items table (medicine, dosage, frequency, duration)
- Doctor notes
- Status badge
- "Request Refill" button (for active prescriptions)
- "Upload Prescription" link (for patients)

### 7. Prescription Upload Page
**File:** `src/app/pages/pharmacy/prescription-upload.component.ts`

File upload form for patients to upload physical prescriptions.

**Key Features:**
- File input for prescription image
- File preview
- Drag-and-drop support
- Submit button
- Success confirmation

### 8. Create Prescription Page
**File:** `src/app/pages/pharmacy/create-prescription.component.ts`

Form for doctors to create prescriptions for patients.

**Key Features:**
- Patient search (by name or email)
- Add prescription items (search medicines, set dosage, frequency, duration)
- Add instructions/notes
- Submit button
- Success message with prescription ID

### 9. Inventory Page
**File:** `src/app/pages/pharmacy/inventory.component.ts`

Inventory management for pharmacists only.

**Key Features:**
- Table of medicines with stock levels
- Search/filter medicines
- Inline edit for stock quantity and warehouse location
- Delete inventory entry (with confirmation)
- Bulk update functionality (optional)
- Stock alerts for low inventory

### 10. Refills Page
**File:** `src/app/pages/pharmacy/refills.component.ts`

Manage refill requests (different views for patients and pharmacists).

**Key Features:**
- For Patients: View own refill requests
- For Pharmacists: View all refill requests and status
- Filter by status (PENDING, APPROVED, REJECTED, EXPIRED)
- Delete refill request
- Approve/Reject functionality (if endpoint exists)

---

## Routing Setup Required

Add these routes to your `app-routing-module.ts`:

```typescript
// Medicine Catalog & Shopping
{
  path: 'pharmacy/medicines',
  component: MedicineCatalogComponent
},
{
  path: 'pharmacy/medicines/:id',
  component: MedicineDetailComponent
},
{
  path: 'pharmacy/cart',
  component: ProtectedRoute,
  data: { roles: ['PATIENT', 'DOCTOR', 'PHARMACIST', 'ADMIN'] },
  children: [{ path: '', component: CartComponent }]
},
{
  path: 'pharmacy/checkout',
  component: ProtectedRoute,
  data: { roles: ['PATIENT'] },
  children: [{ path: '', component: CheckoutComponent }]
},
{
  path: 'pharmacy/order-confirmation',
  component: ProtectedRoute,
  data: { roles: ['PATIENT'] },
  children: [{ path: '', component: OrderConfirmationComponent }]
},

// Orders
{
  path: 'pharmacy/orders',
  component: ProtectedRoute,
  data: { roles: ['PATIENT'] },
  children: [{ path: '', component: OrderHistoryComponent }]
},
{
  path: 'pharmacy/orders/:id',
  component: ProtectedRoute,
  data: { roles: ['PATIENT'] },
  children: [{ path: '', component: OrderDetailComponent }]
},

// Prescriptions
{
  path: 'pharmacy/prescriptions',
  component: ProtectedRoute,
  data: { roles: ['PATIENT', 'DOCTOR'] },
  children: [{ path: '', component: PrescriptionsListComponent }]
},
{
  path: 'pharmacy/prescriptions/:id',
  component: ProtectedRoute,
  data: { roles: ['PATIENT', 'DOCTOR'] },
  children: [{ path: '', component: PrescriptionDetailComponent }]
},
{
  path: 'pharmacy/prescriptions/upload',
  component: ProtectedRoute,
  data: { roles: ['PATIENT'] },
  children: [{ path: '', component: PrescriptionUploadComponent }]
},
{
  path: 'pharmacy/prescriptions/create',
  component: ProtectedRoute,
  data: { roles: ['DOCTOR'] },
  children: [{ path: '', component: CreatePrescriptionComponent }]
},

// Inventory
{
  path: 'pharmacy/inventory',
  component: ProtectedRoute,
  data: { roles: ['PHARMACIST', 'ADMIN'] },
  children: [{ path: '', component: InventoryComponent }]
},

// Refills
{
  path: 'pharmacy/refills',
  component: ProtectedRoute,
  data: { roles: ['PATIENT', 'PHARMACIST', 'ADMIN'] },
  children: [{ path: '', component: RefillsComponent }]
}
```

---

## Common Patterns Used

All components follow these patterns:

### Component Structure
```typescript
@Component({
  selector: 'app-component-name',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CustomComponents],
  templateUrl: './component-name.component.html',
  styleUrls: ['./component-name.component.css']
})
export class ComponentNameComponent implements OnInit {
  // Properties
  // Methods
}
```

### State Management
- Use `CartService` for cart state (Observable pattern with BehaviorSubject)
- Use `PharmacyApiService` for API calls (returns Observables)
- Subscribe in components with `.subscribe()` pattern

### Error Handling
- Display error banner with error message
- Log errors to console
- Set `isLoading` and `isSubmitting` flags
- Disable buttons during processing

### Form Validation
- Use Angular's `ReactiveFormsModule` and `FormBuilder`
- Implement custom `isFieldInvalid()` and `getFieldError()` methods
- Disable submit button when form is invalid

---

## Styling Guidelines

All components use:
- **Tailwind-inspired CSS** with custom classes
- **Color Scheme:**
  - Primary: `#3B82F6` (Blue)
  - Success: `#10B981` (Green)
  - Warning: `#F59E0B` (Amber)
  - Error: `#DC2626` (Red)
  - Text: `#111827` (Dark Gray)
  - Borders: `#E5E7EB` (Light Gray)

- **Responsive Design:** Mobile-first approach with `@media (max-width: 768px)` and `@media (max-width: 480px)`
- **Spacing:** 8px base unit (8px, 12px, 16px, 20px, 24px, 32px)
- **Typography:**
  - Titles: `font-size: 32px; font-weight: 700;`
  - Section Titles: `font-size: 20px; font-weight: 600;`
  - Labels: `font-size: 13px; font-weight: 600;`
  - Body: `font-size: 14px; color: #6B7280;`

---

## API Considerations

All API calls use the `PharmacyApiService` with the base URL `http://localhost:8089/MediCareAI/api/pharmacy`.

The HttpClient is already configured with:
- Base URL in auth service pattern
- JWT token interceptor (if implemented)
- Error handling

To use API in components:
```typescript
constructor(private pharmacyApi: PharmacyApiService) {}

this.pharmacyApi.searchMedicines(params).subscribe({
  next: (response) => { /* handle success */ },
  error: (err) => { /* handle error */ }
});
```

---

## Next Steps

1. Create the remaining 10 page components following the patterns established
2. Add routing configuration to `app-routing-module.ts`
3. Create any additional reusable components as needed (e.g., `StatusBadge`, `PaginationComponent`)
4. Test all pages with the backend API
5. Add navigation menu links to pharmacy module
6. Implement role-based navigation guards if needed

---

## Notes

- All phone numbers should be 10 digits
- All ZIP codes should be 5-6 digits
- Dates are handled as Date objects (ISO 8601 format in API)
- Images use placeholder URLs - replace with actual medicine images
- Prices always display with 2 decimal places
- Currency symbol is `&#36;` (HTML entity) to avoid @ conflicts in Angular templates
