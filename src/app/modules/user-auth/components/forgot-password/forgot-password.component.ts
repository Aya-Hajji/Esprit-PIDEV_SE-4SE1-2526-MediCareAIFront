import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  email: string = '';
  code: string = '';
  newPassword: string = '';
  step: 'request' | 'verify' = 'request';

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Étape 1 : Demander le code
  requestReset(): void {
    if (!this.email) {
      this.errorMessage = 'Veuillez entrer votre email';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestPasswordReset({ email: this.email }).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.successMessage = response.message || 'Un code a été envoyé à votre email.';
        this.step = 'verify';
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Erreur lors de l\'envoi du code.';
        console.error(error);
      }
    });
  }

  // Étape 2 : Réinitialiser le mot de passe
  resetPassword(): void {
    if (!this.email || !this.code || !this.newPassword) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword({
      email: this.email,
      code: this.code,
      newPassword: this.newPassword
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.successMessage = response.message || 'Mot de passe réinitialisé avec succès !';
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Code invalide ou expiré.';
        console.error(error);
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}