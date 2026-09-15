import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import {
  faEye,
  faEyeSlash,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { subscribe } from 'diagnostics_channel';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../../Services/utils.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule],
})
export class ChangePasswordComponent {
  eye = faEye;
  eyeSlash = faEyeSlash;
  checkIcon = faCheck;
  timesIcon = faTimes;
  passwordStrength = 0;
  passwordChecks = {
    length: false,
    numbers: false,
    uppercase: false,
    lowercase: false,
    special: false,
  };

  changePasswordForm: FormGroup;
  passwordVisibility: Record<string, boolean> = {
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  };

  // Regex patterns for password validation
  private readonly PASSWORD_PATTERNS = {
    length: /^.{8,}$/,
    digit: /\d/,
    uppercase: /[A-Z]/,
    specialChar: /[@#$]/,
  };
  grainBackdrop: SafeHtml = '';
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private apicall: ApiCallService,
    private ErrorHandle: ErrorhandlingService,
    private utils: UtilsService,
  ) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
      newPassword: [
        '',
        [
          Validators.required,
          Validators.pattern(this.PASSWORD_PATTERNS.length),
          Validators.pattern(this.PASSWORD_PATTERNS.digit),
          Validators.pattern(this.PASSWORD_PATTERNS.uppercase),
          Validators.pattern(this.PASSWORD_PATTERNS.specialChar),
        ],
      ],
      confirmPassword: ['', Validators.required],
    });
  }

  toggleVisibility(field: string): void {
    this.passwordVisibility[field] = !this.passwordVisibility[field];
  }

  validateGuidelines(field: string): boolean {
    const password = this.changePasswordForm.get('newPassword')?.value || '';
    const confirmPassword =
      this.changePasswordForm.get('confirmPassword')?.value || '';
    switch (field) {
      case 'length':
        return this.PASSWORD_PATTERNS.length.test(password);
      case 'digit':
        return this.PASSWORD_PATTERNS.digit.test(password);
      case 'uppercase':
        return this.PASSWORD_PATTERNS.uppercase.test(password);
      case 'specialChar':
        return this.PASSWORD_PATTERNS.specialChar.test(password);
      case 'match':
        return confirmPassword.length > 0 && password === confirmPassword; // ✅ Ensure confirmPassword is not empty
      default:
        return false;
    }
  }

  checkPasswordStrength(): void {
    const password = this.changePasswordForm.get('password')?.value || '';

    this.passwordChecks.length = password.length >= 8;
    this.passwordChecks.numbers = (password.match(/[0-9]/g) || []).length >= 2;
    this.passwordChecks.uppercase = /[A-Z]/.test(password);
    this.passwordChecks.lowercase = /[a-z]/.test(password);
    this.passwordChecks.special = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (this.allRequirementsMet()) {
      const lengthScore = Math.min((password.length - 8) * 5, 30);
      const numbersScore = Math.min(
        (password.match(/[0-9]/g) || []).length * 10,
        20,
      );
      const specialScore = Math.min(
        (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length * 10,
        20,
      );
      const uppercaseScore = Math.min(
        (password.match(/[A-Z]/g) || []).length * 10,
        15,
      );
      const lowercaseScore = Math.min(
        (password.match(/[a-z]/g) || []).length * 10,
        15,
      );

      this.passwordStrength = Math.min(
        lengthScore +
          numbersScore +
          specialScore +
          uppercaseScore +
          lowercaseScore,
        100,
      );
    } else {
      this.passwordStrength = 0;
    }
  }

  allRequirementsMet(): boolean {
    return Object.values(this.passwordChecks).every((check) => check);
  }

  getPasswordStrengthText(): string {
    if (this.passwordStrength < 40) return 'Weak';
    if (this.passwordStrength < 70) return 'Medium';
    return 'Strong';
  }

  // togglePassword(): void {
  //   this.showpassword = !this.showpassword;
  // }

  // toggleConfirmPassword(): void {
  //   this.Confirmshowpassword = !this.Confirmshowpassword;
  // }

  resetForm(): void {
    this.changePasswordForm.reset();
    this.passwordVisibility = {
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    };
  }

  //////////////////api for change pass
  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.toastr.warning(
        'Please fill out the form correctly before submitting.',
        'Error',
      );
      return;
    }

    const { newPassword, confirmPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.toastr.warning('Passwords do not match!', 'Error');
      return;
    }
    if (newPassword === this.changePasswordForm.get('oldPassword')?.value) {
      this.toastr.warning(
        'New password cannot be same as old password!',
        'Error',
      );
      return;
    }

    this.NewPasswordCAll();
    // this.toastr.success('Password changed successfully!', 'Success');
    this.resetForm();
  }

  payload() {
    return {
      oldPassword: this.changePasswordForm.get('oldPassword')?.value || '',
      newPassword: this.changePasswordForm.get('newPassword')?.value || '',
      confirmNewPassword:
        this.changePasswordForm.get('confirmPassword')?.value || '',
    };
  }

  NewPasswordCAll() {
    const payload = this.payload();
    this.apicall.PostCallWithToken(payload, 'User/ChangePassword').subscribe(
      (response: any) => {
        if (response.responseCode == 200) {
          this.toastr.success(response.responseMessage, 'Success');
        } else {
          this.ErrorHandle.handleResponseError(response);
        }
      },
      (error) => {
        this.ErrorHandle.handleHttpError(error);
      },
    );
  }
}
