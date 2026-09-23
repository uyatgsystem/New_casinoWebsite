import {
  Component,
  AfterViewInit,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  PLATFORM_ID,
  Inject,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ApiPayloadService } from '../../Services/api-payload-service.service';
import { WebSocketService } from '../../Services/web-socket.service';
import { register } from 'swiper/element/bundle';
import { Slide } from '../../Interfaces/interfaces';
import { CookieService } from 'ngx-cookie-service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { NotificationService } from '../../Services/notification.service';
import { UtilsService } from '../../Services/utils.service';
import { GOOGLE_INTEGRATION_CONFIG } from '../../constants/google-integration.constants';
import { SafeHtml } from '@angular/platform-browser';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SignUpPopUpComponent } from '../signup/sign-up-pop-up/sign-up-pop-up.component';
import { DeviceIdService } from '../../Services/device-id.service';
import * as FingerprintJS from '@fingerprintjs/fingerprintjs';

declare let fbq: Function;

@Component({
  selector: 'app-login',
  standalone: true,
  styleUrls: ['./login.component.scss'],
  imports: [
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    LoaderComponent,
    FontAwesomeModule,
    CarouselModule,
  ],
  templateUrl: './login.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  googleAccesToken: string = '';
  redirectState: string | null = '';
  private googleVerifyRetryCount = 0;
  private readonly maxGoogleVerifyRetries = 2;
  showpassword: boolean = false;
  showicon = faEye;
  hideicon = faEyeSlash;
  private readonly _route: ActivatedRoute = inject(ActivatedRoute);
  grainBackdrop: SafeHtml = '';
  isBrowser: boolean;
  window: Window | null = null;

  constructor(
    private fb: FormBuilder,
    private apiCallService: ApiCallService,
    private router: Router,
    private apiPayloadService: ApiPayloadService,
    private toastr: ToastrService,
    public loaderService: LoaderService,
    private handleError: ErrorhandlingService,
    private _socketService: WebSocketService,
    private cookieService: CookieService,
    private notificationService: NotificationService,
    private _utils: UtilsService,
    @Inject(PLATFORM_ID) private platformId: object,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private DeviceIdService: DeviceIdService,
    private location: Location
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      userPassword: ['', Validators.required],
      rememberMe: [false],
    });
    register();
    this.grainBackdrop = this._utils.getGrainBackdrop();
    this.isBrowser = isPlatformBrowser(this.platformId);

    this._route.fragment.subscribe((fragment) => {
      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('id_token');
        const redirectState = params.get('state');
        if (accessToken) {
          this.googleAccesToken = accessToken;
          this.redirectState = redirectState;
          this.VerfiyGoogleUser(accessToken);
        }
        // Remove the fragment from the URL (without reloading)
        this.router.navigate([], {
          relativeTo: this._route,
          replaceUrl: true,
          fragment: undefined,
        });
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    const savedUsername = this.cookieService.get('rememberedUsername');
    const rememberMeStatus = this.cookieService.get('rememberMe') === 'true';

    if (rememberMeStatus && savedUsername) {
      this.loginForm.patchValue({
        username: savedUsername,
        rememberMe: true,
      });
    }
  }

  togglePassword() {
    this.showpassword = !this.showpassword;
  }

  loginUser() {
    if (this.loginForm.valid) {
      this.loaderService.show();
      const loginData = this.apiPayloadService.createLoginUserPayload(
        this.loginForm.value,
      );
      this.apiCallService
        .PostCallWithoutToken(loginData, 'User/LoginUser')
        .subscribe(
          (response) => {
            this.loaderService.hide();
            if (response && response.responseCode === 200) {
              localStorage.setItem('token', response.data.token);
              this._utils.startTokenExpiryWatcher();
              localStorage.setItem('userType', response.data.userType);
              localStorage.setItem(
                'isTempPassword',
                response.data.isTempPassword?.toString(),
              );
              localStorage.setItem(
                'isMobileUser',
                response.data.isMobileUser?.toString(),
              );
              localStorage.setItem(
                'clientId',
                response.data.clientId?.toString(),
              );
              localStorage.setItem(
                'isMultiClientExist',
                response.data.isMultiClientExist?.toString(),
              );
              localStorage.setItem('userId', response.data.userId?.toString());
              localStorage.setItem('email', response.data.email);
              localStorage.setItem(
                'customerId',
                response.data.customerId.toString(),
              );
              localStorage.setItem('deviceUId', response.data.deviceUId);
              localStorage.setItem('panelType', response.data.panelType);

              const isAlreadyLoggedIn = response.data.isAlreadyLoggedIn;

              if (isAlreadyLoggedIn === 0 || isAlreadyLoggedIn === false) {
                localStorage.setItem('showFreeSpinModal', 'true');
                this.fireLeadPixel();
              } else {
                localStorage.removeItem('showFreeSpinModal');
              }
              this.notificationService.loadNotifications(true);

              if (this.loginForm.value.rememberMe) {
                this.cookieService.set(
                  'rememberedUsername',
                  this.loginForm.value.username,
                  { expires: 360, path: '/' },
                );
                this.cookieService.set('rememberMe', 'true', {
                  expires: 360,
                  path: '/',
                });
              } else {
                this.cookieService.delete('rememberedUsername', '/');
                this.cookieService.delete('rememberMe', '/');
              }

              if (this._socketService.isConnected == false) {
                this._socketService.connect();
              }
              this.loaderService.triggerFunction();
              this.loaderService.triggerWalletFunction();
              const redirectUrl =
                this.activatedRoute.snapshot.queryParams['redirectUrl'];
              if (redirectUrl) {
                this.router.navigateByUrl(redirectUrl);
              } else {
                this.router.navigate(['/dashboard/home']);
              }
            } else if (
              response?.responseCode === 400 &&
              response?.errorMessage ==
                'Please verify your email before logging in.'
            ) {
              this.handleError?.showAlert(
                'warning',
                'A code was already sent to your email. Enter it or resend.',
              );
              const dialogRef = this.openPopup(false, response?.data);
              dialogRef.afterClosed().subscribe(() => {});
            } else {
              this.handleError.handleResponseError(response);
              this.loaderService.hide();
            }
          },
          (error) => {
            this.handleError.handleHttpError(error);
            this.loaderService.hide();
          },
        );
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  slides: Slide[] = [
    {
      id: 1,
      uniqueId: 'slide-1',
      src: '/Images/landing_1.png',
      heading: 'Welcome Back!',
      content: 'Log in to continue your journey with Crown Spin.',
    },
    {
      id: 2,
      uniqueId: 'slide-2',
      src: 'https://cmaxnewimages.pages.dev/assets/newitems/landing_2.png',
      heading: 'Exciting Games!',
      content: 'Enjoy a variety of exciting casino games and win big!',
    },
    {
      id: 3,
      uniqueId: 'slide-3',
      src: '/Images/landing_3.png',
      heading: 'Secure Transactions!',
      content:
        'Experience fast and secure transactions for a seamless gaming experience.',
    },
  ];

  trackByFn(index: number, slide: any): string {
    return `${slide.uniqueId}-${index}`;
  }

  isScreenWidthLessThan800(): boolean {
    return window.innerWidth < 800;
  }

  continueWithGoogle(event: Event) {
    event.stopPropagation();

    const redirectUri = this.buildGoogleRedirectUri();
    const nonce = this.generateNonce();
    const customRedirect =
      this.activatedRoute.snapshot.queryParams['redirectUrl'];

    let googleOAuthUrl =
      `${GOOGLE_INTEGRATION_CONFIG.oauth.endpoint}` +
      `?client_id=${GOOGLE_INTEGRATION_CONFIG.oauth.clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${GOOGLE_INTEGRATION_CONFIG.oauth.responseType}` +
      `&scope=${encodeURIComponent(GOOGLE_INTEGRATION_CONFIG.oauth.scope)}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    if (customRedirect && customRedirect.startsWith('/')) {
      googleOAuthUrl += `&state=${encodeURIComponent(customRedirect)}`;
    }

    try {
      this.loaderService.show();
    } catch (e) {
      // ignore
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

  private buildGoogleRedirectUri(): string {
    const origin = window.location.origin;
    const configuredRedirect =
      GOOGLE_INTEGRATION_CONFIG.oauth.redirectPath.trim();

    if (
      configuredRedirect.startsWith('http://') ||
      configuredRedirect.startsWith('https://')
    ) {
      const duplicatedOrigin = `${origin}${origin}`;
      if (configuredRedirect.startsWith(duplicatedOrigin)) {
        return configuredRedirect.replace(origin, '');
      }
      return configuredRedirect;
    }

    const normalizedPath = configuredRedirect.startsWith('/')
      ? configuredRedirect
      : `/${configuredRedirect}`;

    return new URL(normalizedPath, origin).toString();
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

    const referralCode =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('refCode')
        : null;
    const adCode =
      typeof sessionStorage !== 'undefined'
        ? sessionStorage.getItem('adCode')
        : null;

    const deviceId = await this.DeviceIdService.getDeviceId();
    const deviceFingerprint = await this.DeviceIdService.getDeviceFingerprint();

    let apiUrl =
      `User/ContinueWithGoogle?idToken=${encodeURIComponent(token)}` +
      `&deviceId=${encodeURIComponent(deviceId || '')}` +
      `&deviceFingerprint=${encodeURIComponent(deviceFingerprint || '')}`;

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
          if (response?.responseCode === 400) {
            this.loaderService.hide();
            this.toastr.warning(
              'Something went wrong. Please try again after some time.',
            );
            return;
          }

          if (
            response.responseCode == 200 &&
            response.responseMessage != 'Account Created Successfully'
          ) {
            this.googleVerifyRetryCount = 0;
            this.loaderService.hide();
            localStorage.setItem('token', response.data.token);
            this._utils.startTokenExpiryWatcher();
            localStorage.setItem('userType', response.data.userType);
            localStorage.setItem(
              'isTempPassword',
              response.data.isTempPassword?.toString(),
            );
            localStorage.setItem(
              'isMobileUser',
              response.data.isMobileUser?.toString(),
            );
            localStorage.setItem(
              'clientId',
              response.data.clientId?.toString(),
            );
            localStorage.setItem(
              'isMultiClientExist',
              response.data.isMultiClientExist?.toString(),
            );
            localStorage.setItem('userId', response.data.userId?.toString());
            localStorage.setItem('email', response.data.email);
            localStorage.setItem(
              'customerId',
              response.data.customerId.toString(),
            );
            localStorage.setItem('deviceUId', response.data.deviceUId);
            localStorage.setItem('panelType', response.data.panelType);
            this.notificationService.loadNotifications(true);
          } else {
            this.cookieService.delete('rememberedUsername', '/');
            this.cookieService.delete('rememberMe', '/');
          }

          const isAlreadyLoggedIn = response.data.isAlreadyLoggedIn;
          if (isAlreadyLoggedIn === 0 || isAlreadyLoggedIn === false) {
            localStorage.setItem('showFreeSpinModal', 'true');
            this.fireLeadPixel();
          } else {
            localStorage.removeItem('showFreeSpinModal');
          }

          if (response.responseMessage == 'Account Created Successfully') {
            this.VerfiyGoogleUser(this.googleAccesToken);
          } else {
            if (this._socketService.isConnected == false) {
              this._socketService.connect();
            }
            this.loaderService.triggerFunction();
            this.loaderService.triggerWalletFunction();
            const redirectUrl = this.getSafeRedirectUrl(this.redirectState);
            if (redirectUrl !== null) {
              this.router.navigateByUrl(redirectUrl);
            } else {
              this.router.navigate(['/dashboard/home']);
            }
          }
        },
        (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }

  private getSafeRedirectUrl(redirectState: string | null): string | null {
    if (!redirectState) {
      return null;
    }

    if (redirectState.startsWith('/')) {
      return redirectState;
    }

    return null;
  }

  openPopup(
    isGoogleLogin: boolean = false,
    data: any = null,
  ): MatDialogRef<SignUpPopUpComponent> {
    const email = data;
    const dialogRef = this.dialog?.open(SignUpPopUpComponent, {
      width: '400px',
      disableClose: true,
      data: { email, isGoogleLogin },
    });

    if (this.window) {
      this.window.document.body.style.overflow = 'hidden';
    }

    setTimeout(() => this.cdr.detectChanges());

    dialogRef.afterClosed().subscribe(() => {
      if (this.window) {
        this.window.document.body.style.overflow = '';
      }
    });

    return dialogRef;
  }

  fireLeadPixel() {
    if (this.isBrowser && typeof fbq === 'function') {
      fbq('track', 'Lead');
      console.log('Lead pixel fired');
    }
  }
}