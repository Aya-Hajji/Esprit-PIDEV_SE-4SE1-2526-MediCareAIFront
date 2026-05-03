# 🎯 Phase 2 Quick Start Guide - Building Components

**Start Date:** March 29, 2026  
**Objective:** Create core UI components for authentication and pharmacy modules

---

## 🚀 IMMEDIATE NEXT STEPS (Do Today)

### Step 1: Install Additional Dependencies

```bash
cd "c:\Users\ahmed\projects\projet int\MediCareAIFront"

# Install chart library for health metrics visualization
npm install chart.js ng2-charts

# Optional: Install bootstrap for styling
npm install bootstrap

# Verify installations
npm list chart.js ng2-charts
```

**Expected Output:**
```
medi-care-aifront@0.0.0
├── chart.js@4.x.x
├── ng2-charts@4.x.x
└── bootstrap@5.x.x (optional)
```

---

## 📋 FIRST COMPONENT TO BUILD: Login

### File Structure
```
src/app/modules/user-auth/
└── components/
    └── login/
        ├── login.component.ts
        ├── login.component.html
        ├── login.component.css
        └── login.component.spec.ts
```

### Command to Generate
```bash
# Navigate to project root
cd "c:\Users\ahmed\projects\projet int\MediCareAIFront"

# Generate login component
ng generate component modules/user-auth/components/login
```

### Step 2: Implement Login Component

**File: `src/app/modules/user-auth/components/login/login.component.ts`**

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;

    const loginRequest: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.error = error?.error?.message || 'Invalid email or password';
        console.error('Login error:', error);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
```

**File: `src/app/modules/user-auth/components/login/login.component.html`**

```html
<div class="login-container">
  <div class="login-card">
    <h2>Login to MediCare AI</h2>
    
    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <!-- Email Field -->
      <div class="form-group">
        <label for="email">Email Address</label>
        <input
          type="email"
          id="email"
          class="form-control"
          formControlName="email"
          placeholder="Enter your email"
          [class.is-invalid]="submitted && f['email'].errors"
        />
        <div class="invalid-feedback" *ngIf="submitted && f['email'].errors">
          <span *ngIf="f['email'].errors['required']">Email is required</span>
          <span *ngIf="f['email'].errors['email']">Please enter a valid email</span>
        </div>
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          id="password"
          class="form-control"
          formControlName="password"
          placeholder="Enter your password"
          [class.is-invalid]="submitted && f['password'].errors"
        />
        <div class="invalid-feedback" *ngIf="submitted && f['password'].errors">
          <span *ngIf="f['password'].errors['required']">Password is required</span>
          <span *ngIf="f['password'].errors['minlength']">Password must be at least 6 characters</span>
        </div>
      </div>

      <!-- Error Message -->
      <div class="alert alert-danger" role="alert" *ngIf="error">
        {{ error }}
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn btn-primary btn-block"
        [disabled]="loading"
      >
        <span *ngIf="!loading">Login</span>
        <span *ngIf="loading">
          <span class="spinner-border spinner-border-sm mr-2"></span>
          Logging in...
        </span>
      </button>
    </form>

    <!-- Links -->
    <div class="links">
      <a href="/forgot-password">Forgot Password?</a>
      <span>|</span>
      <a href="/register">Create Account</a>
    </div>
  </div>
</div>
```

**File: `src/app/modules/user-auth/components/login/login.component.css`**

```css
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-card h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-weight: 600;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-control:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #5568d3;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: 12px 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-danger {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.links {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
}

.links a {
  color: #667eea;
  text-decoration: none;
  margin: 0 10px;
}

.links a:hover {
  text-decoration: underline;
}

.links span {
  color: #ddd;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.25em;
}
```

---

## 📝 Component Checklist for Phase 2

### Authentication Module (6 components)

- [ ] **Login** (⚡ START HERE)
  ```
  Status: Skeleton provided
  Next: Implement, test, deploy
  ```

- [ ] **Register**
  ```
  Similar to login, add: firstName, lastName, role selection, phone
  Use: AuthService.register()
  ```

- [ ] **Forgot Password**
  ```
  Step 1: Email input
  Step 2: Verification code
  Use: AuthService.requestPasswordReset() then resetPassword()
  ```

- [ ] **Verify Email**
  ```
  6-digit code verification
  Use: AuthService.verifyEmail()
  ```

- [ ] **Password Reset**
  ```
  New password confirmation
  Use: AuthService.resetPassword()
  ```

- [ ] **User Profile**
  ```
  Edit fullName, phone, address, avatar
  Use: UserService methods
  ```

### E-Pharmacy Module (9 components)

- [ ] **Medicine Search**
  ```
  Search bar, filters (category, price), results grid
  Use: PharmacyService.searchMedicines()
  ```

- [ ] **Medicine Detail**
  ```
  Full medicine info, interactions, reviews, add to cart
  Use: PharmacyService.getMedicineById()
  Use: PharmacyService.checkDrugInteractions()
  ```

- [ ] **Shopping Cart**
  ```
  List items, update quantities, calculate totals
  Use: PharmacyService.getShoppingCart()
  ```

- [ ] **Checkout**
  ```
  Shipping address, payment method, order confirmation
  Use: PharmacyService.createOrder()
  ```

- [ ] **Prescription List**
  ```
  View prescriptions, status, expiry date
  Use: PharmacyService.getAllPrescriptions()
  ```

- [ ] **Prescription Upload**
  ```
  Upload prescription image, verify
  Use: PharmacyService.uploadPrescription()
  ```

- [ ] **Order Tracking**
  ```
  View past orders, status, delivery tracking
  Use: PharmacyService.getOrderById()
  ```

- [ ] **Drug Interaction Checker**
  ```
  Input medicines, check interactions before ordering
  Use: PharmacyService.checkDrugInteractions()
  ```

- [ ] **Inventory Dashboard** (Pharmacist Only)
  ```
  View inventory, low stock alerts, update stock
  Use: PharmacyService.getInventory()
  ```

---

## 🧪 TESTING CHECKLIST

For each component:
- [ ] Form validation works (required, email, minlength)
- [ ] Loading state shows during API call
- [ ] Error messages display properly
- [ ] Success redirects to correct page
- [ ] Error cases are handled
- [ ] API calls use correct endpoint
- [ ] Data is bound correctly to form
- [ ] Mobile responsive design

---

## 📊 DEPENDENCY MAPPING

```
Services Being Used:
├── auth.service.ts          ✅ Ready
├── pharmacy.service.ts      ✅ Ready
├── appointment.service.ts   ✅ Ready
├── medical.service.ts       ✅ Ready
└── allergy.service.ts       ✅ Ready

Components to Create:
├── Auth Components          6 components
├── Pharmacy Components      9 components
├── Appointment Components   6 components
├── Medical Records          4 components
└── Health Tracking         6 components

Total: ~31 components to create

Priority Order:
1. Login → Unblocks entire app
2. Register → User onboarding
3. Dashboard → Home page
4. Medicine Search → Core feature
5. Shopping Cart → E-commerce
6. Checkout → Revenue generation
```

---

## 🎨 STYLING APPROACH

### Option 1: Custom CSS (Recommended for Now)
- Write custom CSS in component .css files
- Simple, no dependencies
- Full control over styling

### Option 2: Bootstrap (When Ready)
```bash
npm install bootstrap
```

Then in `angular.json`:
```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

### Option 3: Angular Material
```bash
ng add @angular/material
```

More complex but provides professional UI components.

---

## 🚀 READY TO START?

### Run This Command to Generate Login Component:
```bash
cd "c:\Users\ahmed\projects\projet int\MediCareAIFront"
ng generate component modules/user-auth/components/login
```

### Then Copy the Implementation Above

### Test It:
```bash
npm start
```

Navigate to: `http://localhost:4200/login`

---

## 📞 HELPFUL RESOURCES

- Angular Forms: https://angular.dev/guide/forms
- Reactive Forms: https://angular.dev/guide/forms/reactive-forms
- HttpClient: https://angular.dev/guide/http
- RxJS: https://angular.dev/guide/observables
- Routing: https://angular.dev/guide/router

---

**Status:** 🟢 Ready to build Phase 2 components

**Next Action:** Generate login component and implement it
