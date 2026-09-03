import {
  Component,
  Inject,
  AfterViewInit,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  PLATFORM_ID,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiPayloadService } from '../../Services/api-payload-service.service';
import { ApiCallService } from '../../Services/api-call-service.service';
import { CreateUser, Slide } from '../../Interfaces/interfaces';
import {
  CommonModule,
  isPlatformBrowser,
  ViewportScroller,
} from '@angular/common';
import {
  passwordMatchValidator,
  passwordValidator,
} from '../../Services/password-match.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import {
  faEye,
  faEyeSlash,
  faCheck,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { register } from 'swiper/element/bundle';
import { SignUpPopUpComponent } from './sign-up-pop-up/sign-up-pop-up.component';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { NotificationService } from '../../Services/notification.service';
import { CookieService } from 'ngx-cookie-service';
import { GOOGLE_INTEGRATION_CONFIG } from '../../constants/google-integration.constants';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../Services/utils.service';
import { DeviceIdService } from '../../Services/device-id.service';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    LoaderComponent,
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    FontAwesomeModule,
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SignupComponent implements OnInit, AfterViewInit {
  faBars = faBars;
  signupForm!: FormGroup;
  errorMessage: string | null = null;
  showpassword = false;
  Confirmshowpassword = false;
  showicon = faEye;
  hideicon = faEyeSlash;
  checkIcon = faCheck;
  timesIcon = faTimes;
  isPasswordFocused = false;
  passwordStrength = 0;
  passwordChecks = {
    length: false,
    numbers: false,
    uppercase: false,
    lowercase: false,
    special: false,
  };
  grainBackdrop: SafeHtml = '';
  // slides: Slide[] = [
  //   {
  //     id: 2,
  //     src: '/Images/landing_1.png',
  //     heading: 'Spin and Win Big!',
  //     content:
  //       'Take a spin and grab your chance to win exciting prizes instantly!',
  //   },
  //   {
  //     id: 3,
  //     src: '/Images/landing_2.png',
  //     heading: 'Explore Games!',
  //     content:
  //       'Choose from a variety of exciting casino games and start your winning streak today!',
  //   },
  //   {
  //     id: 4,
  //     src: '/Images/landing_3.png',
  //     heading: 'Fast and Secure Transactions!',
  //     content:
  //       'Deposit and withdraw your funds with ease, ensuring a seamless gaming experience!',
  //   },
  // ];

  window: Window | null = null;

  constructor(
    private fb: FormBuilder,
    private apiPayloadService: ApiPayloadService,
    private apiCallService: ApiCallService,
    private router: Router,
    // @Inject(LoaderService) private loaderService: LoaderService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private handleErrror: ErrorhandlingService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private cookieService: CookieService,
    private viewPortScroller: ViewportScroller,
    private notificationService: NotificationService,
    private utils: UtilsService,
    private DeviceIdService: DeviceIdService,

    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.window = this.isBrowser ? window : null;
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }

  ngOnInit(): void {
    //    this.loaderService.show(); // Show loader immediately
    // setTimeout(() => {
    //   this.loaderService.hide(); // Hide loader after 2 seconds
    // }, 1000);
    this.initForm();
    register(); // Initialize Swiper
  }
  isBrowser: boolean;
  ngAfterViewInit(): void {
    // Swiper is handled automatically; no additional logic needed
    if(this.referralCode !== null ){
      this.signupForm.patchValue({
        referralCode : this.referralCode,
      })
    }
  }
get referralCode(): string|null {
   return sessionStorage.getItem('refCode');
}
  private initForm(): void {
    this.signupForm = this.fb.group(
      {
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        username: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, passwordValidator()]],
        confirmPassword: ['', Validators.required],
        acceptTerms: [false],
        acceptOffers: [true],
        referralCode: [''],
      },
      { validators: passwordMatchValidator() },
    );
  }

  checkPasswordStrength(): void {
    const password = this.signupForm.get('password')?.value || '';

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

  togglePassword(): void {
    this.showpassword = !this.showpassword;
  }

  toggleConfirmPassword(): void {
    this.Confirmshowpassword = !this.Confirmshowpassword;
  }

async createUser(): Promise<void> {
  setTimeout(() => {
    this.scrollToTop();
  }, 500);

  if (
    !this.signupForm.value.acceptTerms ||
    !this.signupForm.value.acceptOffers
  ) {
    this.signupForm.get('acceptTerms')?.markAsTouched();
    this.signupForm.get('acceptOffers')?.markAsTouched();
    return;
  }

  if (this.signupForm.invalid) {
    // Mark all controls as touched to show validation errors
    this.signupForm.markAllAsTouched();
    return;
  }
 const resolvedDeviceId = await this.DeviceIdService.getDeviceId();
    const resolvedFingerprint = await this.DeviceIdService.getDeviceFingerprint(); 

    
    const userData: Partial<CreateUser> = {
      ...this.signupForm.value,
      DeviceId: resolvedDeviceId,
      deviceFingerprint: resolvedFingerprint || '' 
    };


  // Create payload
  const payload = this.apiPayloadService.createCreateUserPayload(userData);

  this.loaderService.show();

  this.apiCallService
    .PostCallWithoutToken(payload, 'User/CreateUser')
    .subscribe({
      next: (response) => {
        this.loaderService.hide();

        if (response?.responseCode === 200) {
          // Open popup and handle redirection
          const dialogRef = this.openPopup();

          dialogRef.afterClosed().subscribe(() => {
            // this.router.navigate(['/login']);
          });
        } else {
          this.handleErrror.handleResponseError(response);
        }
      },
      error: (err) => {
        this.loaderService.hide();
        this.handleErrror.handleHttpError(err);
      },
    });
}
  openPopup(
    isGoogleLogin: boolean = false,
  ): MatDialogRef<SignUpPopUpComponent> {
    const email = this.signupForm.get('email')?.value;

    const dialogRef = this.dialog.open(SignUpPopUpComponent, {
      width: '400px',
      disableClose: true,
      data: { email, isGoogleLogin },
    });

    // Hide overflow on body to prevent scrolling issues
    if (this.window) {
      this.window.document.body.style.overflow = 'hidden';
    }

    setTimeout(() => this.cdr.detectChanges()); // Ensure UI updates

    dialogRef.afterClosed().subscribe(() => {
      if (this.window) {
        this.window.document.body.style.overflow = ''; // Restore overflow
      }
    });

    return dialogRef;
  }

  restrictWhiteSpaces(): void {
    //
    const usernameControl = this.signupForm.get('username');
    const usernameValue = usernameControl?.value || '';

    if (/\s/.test(usernameValue)) {
      //
      this.toastr.error('Username cannot contain white spaces.');
      usernameControl?.setValue(usernameValue.replace(/\s/g, ''));
    }
  }
  trackByFn(index: number, slide: Slide): string {
    return `${slide.id}-${index}`;
  }
  isScreenWidthLessThan800(): boolean {
    return window.innerWidth < 800;
  }

  scrollToTop() {
    const element = document.getElementById('formContainer');
    if (element) {
      element.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  continueWithGoogle() {
    const redirectPath = GOOGLE_INTEGRATION_CONFIG.oauth.redirectPath;
    const isAbsoluteRedirectPath =
      redirectPath.startsWith('http://') || redirectPath.startsWith('https://');
    const redirectUri = isAbsoluteRedirectPath
      ? redirectPath
      : `${window.location.origin}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`
      }`;
    const nonce = this.generateNonce();

    const googleOAuthUrl =
      `${GOOGLE_INTEGRATION_CONFIG.oauth.endpoint}` +
      `?client_id=${GOOGLE_INTEGRATION_CONFIG.oauth.clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${GOOGLE_INTEGRATION_CONFIG.oauth.responseType}` +
      `&scope=${encodeURIComponent(GOOGLE_INTEGRATION_CONFIG.oauth.scope)}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    try {
      this.loaderService.show();
    } catch (e) {
      // ignore if loader service isn't available
    }

    setTimeout(() => {
      try {
        this.loaderService.hide();
      } catch (e) {
        // ignore
      }
      window.location.href = googleOAuthUrl;
    }, 1000);
  }

  generateNonce() {
    if (this.isBrowser && window.crypto?.getRandomValues) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    return Math.random().toString(36).substring(2);
  }

 async VerfiyGoogleUser(token: string) {
  this.loaderService.show();

  const referralCode = sessionStorage.getItem('refCode');
  const adCode = sessionStorage.getItem('adCode');

  const deviceId = await this.DeviceIdService.getDeviceId();
  const deviceFingerprint = await this.DeviceIdService.getDeviceFingerprint();

  let apiUrl =
    `User/ContinueWithGoogle?idToken=${encodeURIComponent(token)}` +
    `&DeviceId=${encodeURIComponent(deviceId)}` +
    `&DeviceFingerprint=${encodeURIComponent(deviceFingerprint)}`;

  if (referralCode) {
    apiUrl += `&RefferCode=${encodeURIComponent(referralCode)}`;
  }

  if (adCode) {
    apiUrl += `&ad=${encodeURIComponent(adCode)}`;
  }

  this.apiCallService
    .PostCallWithoutToken(null, apiUrl)
    .subscribe(
      (response) => {
        if (response.responseCode == 200) {
          const dialogRef = this.openPopup(true);
          dialogRef.afterClosed().subscribe(() => {});
          this.loaderService.hide();
        } else {
          this.handleErrror.handleResponseError(response);
          this.loaderService.hide();
        }
      },
      (error) => {
        this.loaderService.hide();
        this.handleErrror.handleHttpError(error);
      }
    );
}


  // Open Term And Condintion Modal


  showTermsModal = false;

  openTermsModal() {
    this.showTermsModal = true;
  }

  closeTermsModal() {
    this.showTermsModal = false;
  }
}
