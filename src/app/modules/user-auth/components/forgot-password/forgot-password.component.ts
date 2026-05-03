import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  step = 1; // 1: Email, 2: Verification Code, 3: New Password
  email = '';
  verificationCode = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private authService: AuthService) {}

  /**
   * Step 1: Request password reset
   */
  onRequestReset() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.requestPasswordReset({ email: this.email }).subscribe(
      (response) => {
        this.isLoading = false;
        this.successMessage = 'Password reset code sent to your email.';
        this.step = 2;
      },
      (error) => {
        this.isLoading = false;
        console.error('Password reset request error:', error);
        this.errorMessage = error.error?.message || 'Failed to send reset code. Please try again.';
      }
    );
  }

  /**
   * Step 2: Verify code (just move to next step, code will be verified when resetting)
   */
  onVerifyCode() {
    if (!this.verificationCode) {
      this.errorMessage = 'Please enter the verification code.';
      return;
    }
    this.errorMessage = '';
    this.step = 3;
  }

  /**
   * Step 3: Reset password with code
   */
  onResetPassword() {
    if (!this.newPassword) {
      this.errorMessage = 'Please enter a new password.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters long.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      email: this.email,
      code: this.verificationCode,
      newPassword: this.newPassword
    }).subscribe(
      (response) => {
        this.isLoading = false;
        this.successMessage = 'Password reset successfully! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      (error) => {
        this.isLoading = false;
        console.error('Password reset error:', error);
        this.errorMessage = error.error?.message || 'Password reset failed. Please try again.';
      }
    );
  }

  /**
   * Go back to login
   */
  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  /**
   * Go to previous step
   */
  previousStep() {
    if (this.step > 1) {
      this.step--;
      this.errorMessage = '';
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Get password strength
   */
  getPasswordStrength(): { strength: string; color: string; percentage: number } {
    const pwd = this.newPassword;
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
