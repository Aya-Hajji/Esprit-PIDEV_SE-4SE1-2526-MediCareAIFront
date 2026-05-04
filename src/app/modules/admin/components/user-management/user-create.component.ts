import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../../../shared/services/user.service';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './user-create.component.html',
  styleUrls: ['./user-create.component.css']
})
export class UserCreateComponent implements OnInit {
  userForm: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;
  roles = ['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST'];
  genders = ['MALE', 'FEMALE', 'OTHER'];

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    this.userForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      role: ['PATIENT', Validators.required],
      gender: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      premium: [false]
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.userForm.controls;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const userData = {
      username: this.userForm.value.username,
      email: this.userForm.value.email,
      password: this.userForm.value.password,
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      role: this.userForm.value.role,
      gender: this.userForm.value.gender,
      phoneNumber: this.userForm.value.phoneNumber,
      premium: this.userForm.value.premium
    };

    this.userService.createUser(userData).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/admin/users']);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        const errorMsg = error.error?.message || error.message || 'Failed to create user';
        
        // Check for role-related errors
        if (errorMsg.includes('role') || errorMsg.includes('Data truncated')) {
          this.error = 'Invalid role selected. Please check backend database schema matches allowed roles.';
        } else {
          this.error = errorMsg;
        }
        
        console.error('Error creating user:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/users']);
  }
}
