import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoaderService } from '../../../Services/loader-service.service';
declare let fbq: Function;

@Component({
  selector: 'app-sign-up-pop-up',
  standalone: true,
  imports: [CommonModule, NgIf, FormsModule],
  templateUrl: './sign-up-pop-up.component.html',
  styleUrls: ['./sign-up-pop-up.component.scss'],
})
export class SignUpPopUpComponent implements OnInit, AfterViewInit {
  timer: number = 60;
  email: string | null = null;
  otp: string[] = ['', '', '', '', '', ''];
  otpArray = Array(6);

  @ViewChild('otpInput0') firstInput!: ElementRef;

  constructor(
    private dialogRef: MatDialogRef<SignUpPopUpComponent>,
    private apiCallService: ApiCallService,
    private toaster: ToastrService,
    private router: Router,
    private handleError: ErrorhandlingService,
    public loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(MAT_DIALOG_DATA)
    public data: { email: string; isGoogleLogin: boolean },
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  isBrowser: boolean;
  ngOnInit() {
    if (this.data?.email) {
      this.email = this.data.email;
    }
    this.startTimer();
  }

  ngAfterViewInit() {
    this.firstInput?.nativeElement?.focus();
  }

  startTimer() {
    const interval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  }

  // ─── OTP Input Handlers ───────────────────────────────────────────────────

  onDigitInput(event: any, index: number) {
    const input = event.target;
    let value = input.value;

    // Strip non-numeric characters
    if (/\D/g.test(value)) {
      value = value.replace(/\D/g, '');
      input.value = value;
    }

    this.otp[index] = value;

    // Move focus to next input if a digit was entered
    if (value && index < 5) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const key = event.key;

    const controlKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];

    // Allow Ctrl+V / Cmd+V for paste
    if (event.ctrlKey || event.metaKey) {
      return;
    }

    if (controlKeys.includes(key)) {
      if (key === 'Backspace' && !this.otp[index] && index > 0) {
        const prevInput = (event.target as HTMLInputElement)
          .previousElementSibling as HTMLInputElement;
        if (prevInput) {
          prevInput.focus();
        }
      }
      return;
    }

    // Block non-numeric keys
    if (!/^\d$/.test(key)) {
      event.preventDefault();
      return;
    }

    // Clear current box so new digit replaces it
    if (this.otp[index]) {
      this.otp[index] = '';
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const numericData = pastedData.replace(/\D/g, '').slice(0, 6);

    for (let i = 0; i < numericData.length; i++) {
      if (i < 6) {
        this.otp[i] = numericData[i];
      }
    }

    // Move focus to last filled or next empty input
    const inputs = document.querySelectorAll('.digit-input');
    const focusIndex = numericData.length < 6 ? numericData.length : 5;
    if (inputs[focusIndex]) {
      (inputs[focusIndex] as HTMLInputElement).focus();
    }
  }

  // ─── API Calls ────────────────────────────────────────────────────────────

  verifyCustomerOTP() {
    const finalOtp = this.otp.join('');

    if (finalOtp.length < 6) {
      this.toaster.warning('Please enter the full 6-digit OTP.', 'Warning');
      return;
    }

    const payload = {
      otp: finalOtp,
      email: this.email,
    };

    this.loaderService.show();
    this.apiCallService
      .PostCallWithoutToken(payload, 'User/UserVerify')
      .subscribe(
        (response: any) => {
          if (response?.responseCode === 200) {
            this.loaderService.hide();
            this.fireLeadPixel();
            this.toaster.success(
              response?.responseMessage ||
                'Your account has been verified successfully!',
              'Success',
            );
            this.redirectToLogin();
          } else {
            this.loaderService.hide();
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          this.loaderService.hide();
          this.handleError.handleHttpError(error);
        },
      );
  }

  resendEmail() {
    if (!this.email) {
      this.toaster.error('Email address is not available!');
      return;
    }

    this.loaderService.show();
    this.apiCallService
      .GetCallWithoutToken(`User/ResendVerificationMail?email=${this.email}`)
      .subscribe(
        (response) => {
          if (response?.responseCode === 200) {
            this.loaderService.hide();
            this.toaster.success(
              'Verification email has been resent successfully!',
              'Success',
            );
          } else {
            this.loaderService.hide();
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          this.loaderService.hide();
          this.handleError.handleHttpError(error);
        },
      );

    this.timer = 60;
    this.startTimer();
  }

  redirectToLogin() {
    this.dialogRef.close();
    this.router.navigate(['/login']);
    sessionStorage.removeItem('refCode');
  }

  fireLeadPixel() {
    if (this.isBrowser && typeof fbq === 'function') {
      fbq('track', 'Lead');
      console.log('Lead pixel fired');
    }
  }
}
