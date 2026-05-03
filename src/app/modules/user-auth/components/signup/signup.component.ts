import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

export interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  gender: string;
  phoneNumber: string;
  agreeToTerms: boolean;
}

export interface RoleOption {
  id: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  formData: SignupFormData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    gender: '',
    phoneNumber: '',
    agreeToTerms: false
  };

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  currentStep = 1; // 1: Personal Info, 2: Credentials, 3: Role & Details

  roles: RoleOption[] = [
    { id: 'DOCTOR', label: 'Doctor', icon: 'doctor', color: '#00A63E' },
    { id: 'NURSE', label: 'Nurse', icon: 'nurse', color: '#EA580C' },
    { id: 'PHARMACIST', label: 'Pharmacist', icon: 'pharmacist', color: '#009966' },
    { id: 'PATIENT', label: 'Patient', icon: 'patient', color: '#155DFC' },
    { id: 'ADMIN', label: 'Administrator', icon: 'admin', color: '#9810FA' }
  ];

  genders = [
    { id: 'MALE', label: 'Male' },
    { id: 'FEMALE', label: 'Female' },
    { id: 'OTHER', label: 'Other' }
  ];

  constructor(private router: Router, private authService: AuthService) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  getSelectedRoleColor(): string {
    const role = this.roles.find(r => r.id === this.formData.role);
    return role?.color || '#008236';
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
    }
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.formData.firstName || !this.formData.lastName) {
        this.errorMessage = 'Please enter your first and last name.';
        return;
      }
      this.errorMessage = '';
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      if (!this.formData.email || !this.formData.password || !this.formData.confirmPassword) {
        this.errorMessage = 'Please fill in all credential fields.';
        return;
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errorMessage = 'Passwords do not match.';
        return;
      }
      if (this.formData.password.length < 8) {
        this.errorMessage = 'Password must be at least 8 characters long.';
        return;
      }
      this.errorMessage = '';
      this.currentStep = 3;
    }
  }

  onSignUp() {
    if (!this.formData.role) {
      this.errorMessage = 'Please select a role.';
      return;
    }
    if (!this.formData.gender) {
      this.errorMessage = 'Please select your gender.';
      return;
    }
    if (!this.formData.phoneNumber) {
      this.errorMessage = 'Please enter your phone number.';
      return;
    }
    if (!this.formData.agreeToTerms) {
      this.errorMessage = 'Please agree to the terms and conditions.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const signupData = {
      firstName: this.formData.firstName,
      lastName: this.formData.lastName,
      email: this.formData.email,
      password: this.formData.password,
      role: this.formData.role,
      gender: this.formData.gender,
      phoneNumber: this.formData.phoneNumber
    };

    this.authService.register(signupData).subscribe(
      (response) => {
        if (response?.token) {
          this.isLoading = false;
          this.successMessage = 'Account created successfully! Signing you in...';
          setTimeout(() => this.redirectAfterAuth(response), 1200);
          return;
        }

        this.authService.login({
          email: this.formData.email,
          password: this.formData.password
        }).subscribe({
          next: (loginResponse) => {
            this.isLoading = false;
            this.successMessage = 'Account created successfully! Signing you in...';
            setTimeout(() => this.redirectAfterAuth(loginResponse), 1200);
          },
          error: () => {
            this.isLoading = false;
            this.successMessage = 'Account created successfully. Please sign in.';
            setTimeout(() => this.router.navigate(['/login']), 1200);
          }
        });
      },
      (error) => {
        this.isLoading = false;
        console.error('Registration error:', error);
        this.errorMessage = error.error?.message || error.message || 'Registration failed. Please try again.';
      }
    );
  }

  private redirectAfterAuth(response: { role?: string; user?: { role?: string } }): void {
    const userRole = (response.role || response.user?.role || '').toUpperCase().replace('ROLE_', '');
    this.router.navigate([this.getDefaultRouteForRole(userRole)]);
  }

  private getDefaultRouteForRole(role: string): string {
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'PHARMACIST':
        return '/pharmacy/dashboard';
      case 'DOCTOR':
        return '/medical-record/dashboard';
      case 'NURSE':
        return '/appointments/dashboard';
      case 'PATIENT':
        return '/health-tracker/dashboard';
      default:
        return '/';
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  getPasswordStrength(): { strength: string; color: string; percentage: number } {
    const pwd = this.formData.password;
    let strength = 0;

    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/[0-9]/)) strength++;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength++;

    if (strength === 0) return { strength: '', color: '', percentage: 0 };
    if (strength === 1) return { strength: 'Weak', color: '#EF4444', percentage: 25 };
    if (strength === 2) return { strength: 'Fair', color: '#F97316', percentage: 50 };
    if (strength === 3) return { strength: 'Good', color: '#EAB308', percentage: 75 };
    return { strength: 'Strong', color: '#22C55E', percentage: 100 };
  }
}
