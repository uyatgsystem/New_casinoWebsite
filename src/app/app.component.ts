import { isPlatformBrowser } from '@angular/common';

import { ChangePasswordComponent } from './pages/change-password/change-password/change-password.component';
import {
  FormGroup,
  NgForm,
  NgModel,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  Inject,
  Input,
  NgModule,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  NgZone
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { NewPasswordComponent } from './pages/new-password/new-password.component';
import { ChatComponent } from '../app/components/chat/chat.component';
import { GameService } from './Services/game.service';
import { filter, Subject, Subscription, takeUntil } from 'rxjs';
import { FooterComponent } from './components/footer/footer.component';
import { CustomerReviewsComponent } from './pages/landing-page/customer-reviews/customer-reviews.component';
import { AboutUsComponent } from './pages/landing-page/about-us/about-us.component';
import { GamePromoBannerComponent } from './pages/landing-page/game-promo-banner/game-promo-banner.component';
import { OnBoardingStepsComponent } from './pages/landing-page/on-boarding-steps/on-boarding-steps.component';
import { GamesLandingComponent } from './pages/landing-page/games-landing/games-landing.component';
import { SubscribeNewslettergeComponent } from './pages/landing-page/subscribe-newsletterge/subscribe-newsletterge.component';
import { SignUpPopUpComponent } from './pages/signup/sign-up-pop-up/sign-up-pop-up.component';
import { UtilsService } from './Services/utils.service';
import { ForgotChangePasswordComponent } from './forgot-change-password/forgot-change-password.component';
import { ApiCallService } from './Services/api-call-service.service';
import { ErrorhandlingService } from './Services/error-handling.service';
import { LoaderService } from './Services/loader-service.service';
import { ActivityTrackService } from './Services/activity-track.service';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { AddWalletComponent } from './common/add-wallet/add-wallet.component';
import { UserManualComponent } from './common/user-manual/user-manual.component';
import { CasinoLandingComponent } from './pages/landing-page/casino-landing/casino-landing.component';
import { ToastrService } from 'ngx-toastr';
import { WebSocketService } from './Services/web-socket.service';
import { PwaInstallService } from './Services/pwa-install.service';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
// import { GamesLandingComponent } fro./pages/landing-page/games-landing/games-landing.componentent';
// import { HeaderLandingComponent } fro./pages/landing-page/header-landing/header-landing.componentent';

declare const gtag: (...args: unknown[]) => void;
declare const fbq: (...args: unknown[]) => void;

const GOOGLE_INTEGRATION_CONFIG = {
  analytics: {
    measurementId: 'G-TZ82X0Q91D',
  },
} as const;

const META_PIXEL_CONFIG = {
  pixelId: '1530255482066084',
} as const;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    SplashScreenComponent,
    ChatComponent,
    NgxSpinnerModule,
    AddWalletComponent,
    // ChangePasswordComponent,
    // ForgotPasswordComponent,
    // NewPasswordComponent,
    FooterComponent,
    UserManualComponent,
    FaIconComponent,
  ],

  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, AfterViewInit, OnChanges {
  showSplashScreen = true;
  isChatOpen = false;
  addBalance = false;
  showCharacterImage = false;

  private isBrowser: boolean;

  constructor(
    private router: Router,
    private gameService: GameService,
    private _utils: UtilsService,
    private apiCallService: ApiCallService,
    public ErroHandling: ErrorhandlingService,
    private _loaderService: LoaderService,
    private toastr: ToastrService,
    private _socketService: WebSocketService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private route:ActivatedRoute,
     private ngZone: NgZone
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check for token and get chat count on each route change
        if (this.token) {
          this.getChatCount();
        }
      }
    });
    this.ErroHandling.showModalSubject.subscribe((val: boolean) => {
      this.addBalance = val;
    });

    this.isBrowser = isPlatformBrowser(this.platformId);
    this.route.queryParams.subscribe(params => {
      const refCode = params['refCode'];
      const adCode = params['adCode'];

      if (refCode) {
        // Save to session storage
        sessionStorage.setItem('refCode', refCode);

        this.router.navigate([], {
          queryParams: {
            refCode: null
          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
      if(adCode){
        // Save to session storage
        sessionStorage.setItem('adCode', adCode);

        // Remove query params from URL
        this.router.navigate([], {
          queryParams: {
            adCode: null
          },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }

    });
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event: NavigationEnd) => {
        this.handleRouteChange(event.urlAfterRedirects);
        this.trackPageView(event.urlAfterRedirects);
      });

    if (this.isBrowser) {
      this.handleScreenSize();
    }
    // this.router.events.subscribe((event) => {
    //   if (event instanceof NavigationEnd) {
    //     this.handleRouting();
    //   }
    // });
  }
  cross = faXmark;
  private destroy$ = new Subject<void>();
  private subscription!: Subscription;
  ngOnInit(): void {
     this.listenToOtherTabsLogout();

     
    this._utils.showComponent$.subscribe((show) => {
      this.isChatOpen = show;
      console.log('this.isChatOpen', this.isChatOpen);
      if (!show && this.token) {
        this.getChatCount();
      }
    });
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this._utils.toggleComponentVisibility(false);
      }
    });
    if (this.token) {
      this.getChatCount();
    }
    const token = this._utils.getItem('token');
    if (token && token !== '') {
      this.getChatCount();
    }
    this.ErroHandling.showModalSubject.subscribe(
      (value: boolean) => (this.addBalance = value),
    );
    // Ensure splash screen is visible for at least 5 seconds
    setTimeout(() => {
      this.showSplashScreen = false;
    }, 5000); // Adjust the timeout duration as needed
    this.subscription = this._utils.showComponent$.subscribe((show) => {
      this.isChatOpen = show;
    });
    this.gameService
      .getTriggerObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.toggleChat();
      });

    this._utils
      .getTriggerChatUnReadCountObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getChatCount();
      });
    this._utils
      .getTriggerChatReadObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.readChatCounts();
      });
    this._utils
      .getTriggerLogoutObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this._utils.stopTokenExpiryWatcher();
        localStorage.clear();
        this._socketService.close();
        sessionStorage.clear();
        this.toastr.info('Your session has expired. Please login again.');
        this.router.navigate(['/']);
      });
    this._utils.startTokenExpiryWatcher();
  }
  ngOnDestroy(): void {
    this._utils.stopTokenExpiryWatcher();
    this.destroy$.next();
    this.destroy$.complete();

    if (this.subscription) this.subscription.unsubscribe();
  }
  handleRouting() {
    const token = localStorage.getItem('token');
    if (token && this.router.url === '/') {
      this.router.navigate(['/dashboard/home']);
    } else if (!token || this.router.url !== '/') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/login']);
    }
  }
  ngAfterViewInit(): void {
    // //get the token from local storage
    // const token = localStorage.getItem('token');
    // //if token is not null
    // if (token && this.activatedRoute.snapshot.routeConfig?.path == '/') {
    //   //navigate to the dashboard
    //   this.router.navigate(['/dashboard/home']);
    //   // console.log('token exists and navigated to dashboard');
    // } else {
    //   //navigate to the landing page
    //   this.router.navigate(['/']);
    //   // console.log('token does not exist and navigated to landing');
    // }
  }
  openChatHandler() {
    console.log('AppComponent: openChatFromHeader received');
    this.isChatOpen = true;
    this._utils.toggleComponentVisibility(true);
  }

  shouldShowChat(): boolean {
    const currentUrl = this.router.url;
    const showChat = !(
      currentUrl.includes('login') ||
      currentUrl.includes('SignUp') ||
      currentUrl.includes('ForgotPassword') ||
      currentUrl.includes('VerifyPayment') ||
      currentUrl.includes('VerifyEmail') ||
      currentUrl.includes('reset-pass') ||
      currentUrl.includes('check') ||
      currentUrl.includes('dashboard/TreasurePick') ||
      currentUrl.includes('dashboard/Avaitar') ||
      currentUrl.includes('dashboard/Baccaret') ||
      currentUrl.includes('dashboard/Roulette') ||
      currentUrl.includes('dashboard/Mines') ||
      currentUrl.includes('dashboard/StackBuilder') ||
      currentUrl.includes('dashboard/Keno') ||
      currentUrl.includes('dashboard/Plinko') ||
      currentUrl.includes('dashboard/Double') ||
      currentUrl.includes('dashboard/coin') ||
      currentUrl.includes('dashboard/rps') ||

      // currentUrl.includes('dashboard/changePass') ||
      currentUrl === '/' ||
      this.showSplashScreen
    );
    // if (showChat) {
    //   this.getChatCount();
    // }
    return showChat;
  }
  shouldshowheader(): boolean {
    const currentUrl = this.router.url;
    const showChat = !(
      currentUrl.includes('login') ||
      currentUrl.includes('SignUp') ||
      currentUrl.includes('ForgotPassword') ||
      currentUrl.includes('VerifyPayment') ||
      currentUrl.includes('VerifyEmail') ||
      currentUrl.includes('reset-pass') ||
      currentUrl.includes('dashboard/TreasurePick') ||
      currentUrl.includes('dashboard/Avaitar') ||
      currentUrl.includes('dashboard/Baccaret') ||
      currentUrl.includes('dashboard/Roulette') ||
      currentUrl.includes('dashboard/Mines') ||
      currentUrl.includes('dashboard/StackBuilder') ||
      currentUrl.includes('dashboard/Keno') ||
      currentUrl.includes('dashboard/Plinko') ||
      currentUrl.includes('dashboard/Double') ||
      currentUrl.includes('dashboard/coin') ||
      currentUrl.includes('dashboard/rps') ||

      currentUrl === '/' ||
      // currentUrl.includes('dashboard/changePass') ||
      this.showSplashScreen
    );
    return showChat;
  }
  get token(): string | null {
    // if (this.isBrowser) {
    const token = localStorage.getItem('token');
    return token;
    // }
    // return '';
  }

  ngOnChanges() {
    // if (this.token) {
    //   this.getChatCount();
    // }
  }
  // get chat count from notification men
  unreadCounts: number = 0;

  async getChatCount() {
    try {
      await this.apiCallService
        .GetCallWithToken('NotificationMessages/GetUnReadChatMessages')
        .subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              this.unreadCounts = response.data[0].UnreadCount;
            }
          },
          error: (error) => {
            // this.apiCallService.handleError(error);
          },
        });
    } catch (error: any) {
      // this.apiCallService.handleError(error);
    }
  }
  async readChatCounts() {
    try {
      await this.apiCallService
        .PostCallWithToken(null, 'NotificationMessages/ReadChatMessages')
        .subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              this.unreadCounts = 0;
            }
          },
          error: (error) => {
            // this.apiCallService.handleError(error);
          },
        });
    } catch (error: any) {
      // this.apiCallService.handleError(error);
    }
  }
  toggleChat(): void {
    const newState = !this.isChatOpen;
    this._utils.toggleComponentVisibility(newState);
    if (newState) {
      this._utils.triggerChatReadFunction();
    }
  }
  // Download App
  OpenDownload() {
    this._loaderService.show();

    this.apiCallService.GetCallWithToken('AppVersion/GetAppVersion').subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          const filePath = response?.data?.appUpdateUrl;

          // Create a temporary link element
          const link = document.createElement('a');
          link.href = filePath; // Path relative to the app's root
          link.download = 'social.apk'; // Set the downloaded file name
          link.target = '_blank'; // Open in a new tab (optional)

          // Trigger the download
          link.click();

          // Clean up the temporary link element
          link.remove();
          this._loaderService.hide();
        } else {
          this.ErroHandling.handleResponseError(response);
          this._loaderService.hide();
        }
      },
      (error) => {
        this.ErroHandling.handleHttpError(error);
      },
    );
  }

  // hide button
  showButton: boolean = true;
  hideButton() {
    this.showButton = false;
    // setTimeout(() => {
    //   this.showButton = true;
    // }, 60000);
  }

  // 👇 Resize listener
  @HostListener('window:resize')
  onResize() {
    if (this.isBrowser) {
      this.handleScreenSize();
    }
  }

  private allowedRoutes = [
    '/dashboard/home',
    '/dashboard/wallet',
    '/dashboard/account',
    '/dashboard/lottery',
    '/dashboard/redeem',
    '/dashboard/SectrechCards',
    '/dashboard/lottery-history',
    '/',
    '/dashboard/spinner',
  ];

  handleRouteChange(url: string) {
    if (!this.isBrowser) return;

    const cleanUrl = url.split('?')[0];
    const isLargeScreen = window.innerWidth >= 1024;

    this.showCharacterImage =
      this.allowedRoutes.includes(cleanUrl) && isLargeScreen;
  }

  private trackPageView(url: string) {
    if (!this.isBrowser) {
      return;
    }

    // Track with Google Analytics
    if (typeof gtag === 'function') {
      gtag('config', GOOGLE_INTEGRATION_CONFIG.analytics.measurementId, {
        page_path: url,
      });
    }

    // Track with Meta Pixel
    if (typeof fbq === 'function') {
      fbq('track', 'PageView');
    }
  }

  handleScreenSize() {
    if (!this.isBrowser) return;

    const currentUrl = this.router.url.split('?')[0];
    const isLargeScreen = window.innerWidth >= 1024;

    this.showCharacterImage =
      this.allowedRoutes.includes(currentUrl) && isLargeScreen;
  }
  isTreasurePickRoute(): boolean {
    const current = this.router.url;
    return (
      current === '/dashboard/TreasurePick' ||
      current === '/dashboard/Avaitar' ||
      current === '/dashboard/Baccaret'
    );
  }

  public pwaInstall = inject(PwaInstallService);
  public showInstallFloating: boolean = true;

  isBonusButton(): boolean {
    const currentUrl = this.router.url;
    return currentUrl === '/';
  }

  shouldShowInstallFloating(): boolean {
    return (
      this.showInstallFloating &&
      this.isBonusButton() &&
      !this.pwaInstall.isInstalled() &&
      this.pwaInstall.canInstall()
    );
  }

  async installFloating(): Promise<void> {
    try {
      if (this.pwaInstall.isInstalled()) {
        this.showInstallFloating = false;
        return;
      }

      const result = await this.pwaInstall.promptInstall();
      if (result === 'unavailable') {
        this.toastr.info(
          'To install: open your browser menu (⋮ or …) → "Install app" or "Add to Home Screen".',
          'Install Casino Maxs',
          { timeOut: 6000, positionClass: 'toast-top-center' },
        );
      } else if (result === 'accepted') {
        this.showInstallFloating = false;
        this.toastr.success('App installed successfully!', 'Casino Maxs', {
          timeOut: 3000,
        });
      }
    } catch (e) {
      // ignore
    }
  }

  hideInstallFloating(event: Event) {
    event.stopPropagation();
    this.showInstallFloating = false;
  }

    private listenToOtherTabsLogout() {
    window.addEventListener('storage', (event) => {
      if (event.key === 'user_logged_out' && event.newValue === 'true') {
        
        this.ngZone.run(() => {
          sessionStorage.clear();
          localStorage.clear();

          this.router.navigate(['/']);
        });
      }
    });
  }

  
}
