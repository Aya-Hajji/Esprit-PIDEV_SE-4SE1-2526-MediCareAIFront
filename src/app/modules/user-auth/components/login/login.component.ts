import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

export interface RoleConfig {
  id: string;
  label: string;
  subtitle: string;
  iconBg: string;
  iconColor: string;
  icon: string;
}

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @Input() modalMode = false;
  @Output() close = new EventEmitter<void>();

  selectedRole: RoleConfig | null = null;
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '/';

  roles: RoleConfig[] = [
    {
      id: 'patient',
      label: 'Patient Portal',
      subtitle: 'Login as patient',
      iconBg: '#EFF6FF',
      iconColor: '#155DFC',
      icon: 'patient'
    },
    {
      id: 'doctor',
      label: 'Provider Hub',
      subtitle: 'Login as doctor',
      iconBg: '#F0FDF4',
      iconColor: '#00A63E',
      icon: 'doctor'
    },
    {
      id: 'nurse',
      label: 'Nurse Station',
      subtitle: 'Login as nurse',
      iconBg: '#FFF7ED',
      iconColor: '#EA580C',
      icon: 'nurse'
    },
    {
      id: 'pharmacist',
      label: 'Pharmacy Hub',
      subtitle: 'Login as pharmacist',
      iconBg: '#ECFDF5',
      iconColor: '#009966',
      icon: 'pharmacist'
    },
    {
      id: 'admin',
      label: 'Administrator',
      subtitle: 'Login as admin',
      iconBg: '#FAF5FF',
      iconColor: '#9810FA',
      icon: 'admin'
    }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  selectRole(role: RoleConfig) {
    this.selectedRole = role;
    this.email = '';
    this.password = '';
    this.errorMessage = '';
  }

  goBack() {
    this.selectedRole = null;
    this.email = '';
    this.password = '';
    this.errorMessage = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSignIn() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter your email and password.';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';

    const loginData = {
      email: this.email,
      password: this.password
    };

    this.authService.login(loginData).subscribe(
      (response) => {
        if (!response?.token) {
          this.isLoading = false;
          this.errorMessage = 'Login failed: no token returned by backend.';
          return;
        }

        this.isLoading = false;
        console.log('Login response:', response);
        const targetRoute = this.resolveTargetRoute(response);
        console.log('Navigating to:', targetRoute);
        this.successMessage = `Login successful! Redirecting to ${targetRoute}...`;
        this.navigateAfterLogin(targetRoute);
      },
      (error) => {
        this.isLoading = false;
        console.error('Login error:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        this.errorMessage = error.error?.message || error.message || 'Login failed. Please check your credentials.';
      }
    );
  }

  private resolveTargetRoute(response: { role?: string; user?: { role?: string } }): string {
    const roleFromResponse = response.role || response.user?.role || '';
    const roleFromSelection = this.selectedRole?.id || '';
    const normalizedRole = (roleFromResponse || roleFromSelection).toUpperCase().replace('ROLE_', '');

    console.log('Resolving target route:');
    console.log('Role from response:', roleFromResponse);
    console.log('Role from selection:', roleFromSelection);
    console.log('Normalized role:', normalizedRole);

    // If no role found, default to the selected role or 'PATIENT'
    const finalRole = normalizedRole || roleFromSelection || 'PATIENT';

    if (this.returnUrl && this.returnUrl !== '/login' && this.returnUrl !== '/') {
      console.log('Using return URL:', this.returnUrl);
      return this.returnUrl;
    }

    const targetRoute = this.getDefaultRouteForRole(finalRole);
    console.log('Target route for role', finalRole, ':', targetRoute);
    return targetRoute;
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
        return '/patient/dashboard';
      default:
        return '/';
    }
  }

  private navigateAfterLogin(targetRoute: string): void {
    console.log('Attempting navigation to:', targetRoute);
    this.router.navigateByUrl(targetRoute).then((navigated) => {
      console.log('Navigation result:', navigated);
      if (!navigated) {
        console.warn('Angular navigation failed, trying window.location');
        if (typeof window !== 'undefined') {
          window.location.href = targetRoute;
        }
      } else {
        console.log('Navigation successful');
      }
    }).catch((error) => {
      console.error('Navigation error:', error);
      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      }
    });
  }

  navigateHome() {
    this.router.navigate(['/']);
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  closeModal() {
    this.close.emit();
  }
}
