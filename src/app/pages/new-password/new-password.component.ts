import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss'],
})
export class NewPasswordComponent {
  setPasswordForm: FormGroup;
  constructor(private fb: FormBuilder, private router: Router) {
    this.setPasswordForm = this.fb.group(
      {
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(20),
            Validators.pattern(/(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/),
          ],
        ],
        confirmPassword: ['', Validators.required],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  // Custom password match validator
  passwordMatchValidator(
    control: FormGroup
  ): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      return { mismatch: true };
    }
    return null;
  }
  // Form submission logic
  onSubmit() {
    if (this.setPasswordForm.valid) {
      const password = this.setPasswordForm.value.password;
      // console.log('Password:', password);
      alert('Your password has been successfully updated!');
      this.router.navigate(['/submit']); // Redirect to login
    }
  }

  // Back button logic
  goBack() {
    this.router.navigate(['/submit']);
  }

  getErrorMessage(controlName: string): string {
    const control = this.setPasswordForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName} is required.`;
    }
    if (control?.hasError('minlength')) {
      return `${controlName} must be at least 8 characters long.`;
    }
    if (control?.hasError('pattern')) {
      return `${controlName} must contain an uppercase letter, a number, and a special character.`;
    }
    if (control?.hasError('mismatch')) {
      return 'Passwords do not match.';
    }
    return '';
  }
}
