import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { ApiCallService } from '../Services/api-call-service.service';
import { ErrorhandlingService } from '../Services/error-handling.service';
import {ActivatedRoute, Router} from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoaderComponent } from '../components/loader/loader.component';
import { LoaderService } from '../Services/loader-service.service';



@Component({
  selector: 'app-forgot-change-password',
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule,LoaderComponent],
  templateUrl: './forgot-change-password.component.html',
  styleUrl: './forgot-change-password.component.scss',
})
export class ForgotChangePasswordComponent implements OnInit {
  eye = faEye;
  eyeSlash = faEyeSlash;

  changePasswordForm: FormGroup;
  passwordVisibility: Record<string, boolean> = {
    newPassword: false,
    confirmPassword: false,
  };

  private readonly PASSWORD_PATTERNS = {
    length: /^.{8,}$/,
    digit: /\d/,
    uppercase: /[A-Z]/,
    specialChar: /[@#$]/,
  };

  email: string = '';

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private apicall: ApiCallService,
    private ErrorHandle: ErrorhandlingService,
      private loaderService: LoaderService,
    private route: ActivatedRoute, // Inject ActivatedRoute
    private router : Router,
  ) {
    this.changePasswordForm = this.fb.group({
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

  ngOnInit(): void {
    
    const token = this.route.snapshot.queryParams['token'];
    if (token) {
      this.email = token;
    } else {
      // this.toastr.error('Invalid or missing token. Please try again.');
    }
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

  resetForm(): void {
    this.changePasswordForm.reset();
    this.passwordVisibility = { newPassword: false, confirmPassword: false };
  }

  onSubmit() {
    if (
      this.changePasswordForm.invalid ||
      this.changePasswordForm.value.newPassword !==
        this.changePasswordForm.value.confirmPassword
     ) {
      this.loaderService.hide();
      this.toastr.error('Passwords do not match!', 'Error');
      return;
    }
    this.NewPasswordCall(); // Call the API function
    this.resetForm();
  }

  NewPasswordCall() {
    const newPassword = this.changePasswordForm.get('newPassword')?.value || '';
    // const url = `User/NewPassword?token=${this.email}&NewPassword=${newPassword}`;
        const url = `User/NewPassword?token=${encodeURIComponent(this.email)}&NewPassword=${encodeURIComponent(newPassword)}`;
      this.loaderService.show();

    this.apicall.PostCallWithoutToken(null, url).subscribe(
      (response) => {
        if (response.responseCode === 200) {
          
          this.router.navigate(['login']);
          this.toastr.success(response.responseMessage, 'Success');
          this.loaderService.hide();
        } else {
          this.ErrorHandle.handleResponseError(response);
        }
      },
      (error) => {
           this.loaderService.hide();

        this.ErrorHandle.handleHttpError(error);
      }
    );
  }
}
