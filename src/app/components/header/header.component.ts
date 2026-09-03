import {
  Component,
  ElementRef,
  Renderer2,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  Output,
  inject,
  ChangeDetectionStrategy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faList,
  faXmark,
  faWallet,
  faEllipsisV,
  faBell,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { SidebarService } from '../../Services/sidebar-service.service';
import { LogoutmodelComponent } from './logoutmodel/logoutmodel.component';
import { deleteaccountmodelComponent } from './deleteaccountmodel/deleteaccountmodel.component';
import { WebSocketService } from '../../Services/web-socket.service';
import { NotificationsComponent } from '../notifications/notifications.component';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderService } from '../../Services/loader-service.service';
import { Subject, filter, takeUntil } from 'rxjs';
import { json } from 'stream/consumers';
import { UtilsService } from '../../Services/utils.service';
import { LoaderComponent } from '../loader/loader.component';
import { MusicService } from '../../Services/music.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { NotificationService } from '../../Services/notification.service';
import { EventEmitter, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { KycPopupComponent } from '../../common/kyc-popup/kyc-popup.component';
import { SafeHtml } from '@angular/platform-browser';
import { PwaInstallService } from '../../Services/pwa-install.service';
import { GamesLandingComponent } from '../../pages/landing-page/games-landing/games-landing.component';
import { LocationService } from '../../Services/ip-check.service';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FontAwesomeModule,
    LogoutmodelComponent,
    NotificationsComponent,
    deleteaccountmodelComponent,
    LoaderComponent,
    KycPopupComponent,
    TranslateModule,
    GamesLandingComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private previousUrl = '';
  private readonly gameRoutes = new Set<string>([
    '/dashboard/TreasurePick',
    '/dashboard/Avaitar',
    '/dashboard/Baccaret',
    '/dashboard/Roulette',
    '/dashboard/Mines',
    '/dashboard/Plinko',
    '/dashboard/StackBuilder',
    '/dashboard/Keno',
    '/dashboard/coin',
    '/dashboard/spinner',
  ]);

  selectedNav: 'Games' | 'Quick' | 'Upcoming' = 'Games';
  isMuted: boolean = false;
  private clickListener!: () => void;
  username: string | null = '';
  dots = faEllipsisV;
  user = faUser;
  cross = faXmark;
  bell = faBell;
  Wallet = faWallet;
  CrossIcon = false;
  isOpen = false;
  isLogoutModalOpen = false;
  isdeleteaccountmodelopen = false;
  islogin = false;
  isDropdownOpen = false;
  kycVerfication: string | null = '';
  showKycPopup = false;
  Deposit = 'Deposit';
  Withdraw = 'Withdraw';

  profileImage =
    'https://cmaxv2images2.pages.dev/assets/avatars/profileimage.png';
  notifications: any[] = []; // Ensure notifications is an array
  showAlert: boolean = true; // Flag to control alert visibility
  @Output() openChatFromHeader = new EventEmitter<void>();

  closeAlert() {
    this.showAlert = false; // Set the flag to false to hide the alert
  }
  grainBackdrop: SafeHtml = '';
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private router: Router,
    private toastr: ToastrService,
    private sidebarService: SidebarService,
    private _socketService: WebSocketService,
    private apiCallService: ApiCallService,
    private loaderService: LoaderService,
    private utilService: UtilsService,
    private Ref: ChangeDetectorRef,
    private musicService: MusicService,
    private _errorHandleService: ErrorhandlingService,
    private notificationService: NotificationService,
    private _utils: UtilsService,
    private locationService: LocationService,
    @Inject(TranslateService) private translate: TranslateService,
    private http: HttpClient
    // private GameService: GameService,
  ) {
    // if (typeof window !== 'undefined' && window.localStorage) {
    // }
    //check the router for dashboard route and landing route
    this.grainBackdrop = this._utils.getGrainBackdrop();
    this.isDashboardRoute();
    this.isLandingRoute();
    this.isMuted = this.musicService.isMusicMuted();
    if (this.router.url.startsWith('/VerifyPayment')) {
      this.isNotLoginBtnShown = true;
    }
    // this.walletAmount = this.GameService.balance;
    this.getKYCVerification();
  }
  isNotLoginBtnShown: boolean = false;
  toggleMusic() {
    this.musicService.muteUnmute();
    this.isMuted = this.musicService.isMusicMuted();
  }

  // amouttowithdraw: number | null = null;
  // tipAmount: number | null = null;
  serverFees: number = 0;
  // accountInfo: string = '';

  // get actualWithdrawAmount(): number {
  //   const amount = Number(this.amouttowithdraw) || 0;
  //   const tip = Number(this.tipAmount) || 0;
  //   const finalAmount = amount - tip - this.serverFees;
  //   return finalAmount > 0 ? parseFloat(finalAmount.toFixed(2)) : 0;
  // }

  get actualWithdrawAmount(): number {
    const amount = Number(this.amouttowithdraw) || 0;
    const tip = Number(this.tipAmount) || 0;
    const serverFeePercent = Number(this.serverFees) || 0;

    const serverFeeAmount = (amount * serverFeePercent) / 100;

    const finalAmount = amount - tip - serverFeeAmount;

    return finalAmount > 0 ? parseFloat(finalAmount.toFixed(2)) : 0;
  }

  toggleSidebar(event: MouseEvent) {
    // this.sidebarService.toggleSidebar();
    event.stopPropagation(); // Prevent the click from bubbling up
    this.updateChatComponent(false);
    this.sidebarService.toggleSidebar(); // Use the service to toggle the sidebar

    this.showNotifications = false;
    this.isDropdownOpen = false;
    // this.CrossIcon = !this.CrossIcon;
    this.Ref.detectChanges();
  }

  private destroy$ = new Subject<void>();
  ngOnInit() {
    this.previousUrl = this.router.url;
    this.detectIpAddress();
    // this is handlined by local storage
    //     const storedNotifications = localStorage.getItem('notifications');
    // if (storedNotifications) {
    //   this.notifications = JSON.parse(storedNotifications);
    //   this.notificationCount = this.notifications.length;
    // }
    this.loaderService
      .getTriggerWalletObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getWalletBalance();
      });

    this.utilService
      .getTriggerWalletObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getWalletBalance();
      });

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      )
      .subscribe((event: NavigationEnd) => {
        const currentUrl = event.urlAfterRedirects;
        if (
          this.isGameRoute(this.previousUrl) &&
          currentUrl.startsWith('/dashboard') &&
          !!localStorage.getItem('token')
        ) {
          this.getWalletBalance();
        }
        this.previousUrl = currentUrl;
      });
    this.notificationService.notifications$.subscribe((notifs) => {
      this.notifications = notifs;
      this.notificationCount = notifs.length;
      this.Ref.detectChanges();
    });
    // Load notifications on login/dashboard
    const currentUrl = this.router.url;
    if (currentUrl !== '/dashboard' && currentUrl !== '/') {
      this.notificationService.loadNotifications(true);
    }

    //? Profile Image Dynamic Update
    this.utilService.profileImage$.subscribe((image) => {
      this.profileImage = image;
    });

    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      if (this._socketService.isConnected == false && token) {
        this._socketService.connect();
        this.getHeaderValue();
        this.getWalletBalance();
      }
    }
    this.loaderService
      .getTriggerObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getHeaderValue();
      });
    this.utilService
      .getTriggerLogoutObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.logout();
      });
    this.utilService
      .getTriggerKYCHeaders()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getHeaderValue();
        this.getKYCVerification();
      });
    this.clickListener = this.renderer.listen('window', 'click', (e: Event) => {
      const target = e.target as Node;
      if (
        target instanceof Node &&
        !this.elementRef.nativeElement.contains(target)
      ) {
        this.isDropdownOpen = false;
      }
    });
    this.kycVerfication = localStorage.getItem('KYC');

    // Initialize translation
    this.translate.setDefaultLang('en');
    const savedLang = this.utilService.getItem('language') || 'en';
    this.currentLanguage = savedLang;

    // Load translation file
    this.http.get(`/i18n/${savedLang}.json`).subscribe((translations: any) => {
      this.translate.setTranslation(savedLang, translations);
      this.translate.use(savedLang);
    });

    this.UpdateCustomerLevel();
  }
  walletAmount: number = 0; // Example - you’ll set this dynamically from API

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.clickListener) {
      this.clickListener();
    }
  }

  private isGameRoute(url: string): boolean {
    const routeOnly = url.split('?')[0];
    return this.gameRoutes.has(routeOnly);
  }

  selectNav(nav: 'Games' | 'Quick' | 'Upcoming') {
    this.selectedNav = nav;
  }

  login() {
    this.islogin = !this.islogin;
    if (this._socketService.isConnected == false) {
      this._socketService.connect();
    }
  }
  logout() {
    this._utils.stopTokenExpiryWatcher();
    // localStorage.clear();
    this._socketService.close();
    // this.router.navigate(['/']);
    this.utilService.toggleComponentVisibility(false);
    // if (this._socketService.isConnected) {
    // }
    this.closeLogoutModal();

    // New Logic
    localStorage.setItem('user_logged_out', 'true');
    sessionStorage.clear();
    localStorage.clear();

    this.router.navigate(['/']);


  }

  showLogoutModal() {
    this.isLogoutModalOpen = true;
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  showComletePorfile() {
    this.router.navigate(['dashboard/complete-profile']);
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  showDeleteaccountmodel() {
    this.isdeleteaccountmodelopen = true;
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeLogoutModal() {
    this.isLogoutModalOpen = false;
  }

  closedeleteaccountmodal() {
    this.isdeleteaccountmodelopen = false;
  }
  closeKycPopup() {
    this.showKycPopup = false;
  }
  deleteaccount(userpassword: string) {
    this.loaderService.show();
    const payload = {
      email: localStorage.getItem('email'),
      password: userpassword,
    };
    this.apiCallService
      .PostCallWithToken(payload, 'User/DeleteMoblieUser')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.logout();
            this.closeLogoutModal();
            this.loaderService.hide();
          } else {
            this._errorHandleService.handleResponseError(response);
            // console.log('User Deletion Failed', response);
          }
          this.loaderService.hide();
        },
        (error) => {
          // console.error('User Deletion Failed', error);
          this._errorHandleService.handleHttpError(error);
          this.loaderService.hide();
          // this.toastr.error('An error occurred during login. Please try again.');
        },
      );
  }

  isDashboardRoute(): boolean {
    return (
      this.router.url.includes('dashboard') &&
      !this.router.url.includes('login') &&
      !this.router.url.includes('SignUp')
    );
  }
  isMobileMenuOpen = false;

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  isLandingRoute(): boolean {
    return (
      this.router.url.includes('login') ||
      this.router.url.includes('SignUp') ||
      this.router.url === '/'
    );
  }
  toggleDropdown(event: Event) {
    event.stopPropagation();

    // Close other panels
    this.showNotifications = false;
    this.showwithdrawModal = false;

    // Toggle profile
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  isAuthRoute(): boolean {
    const currentRoute = this.router.url;
    return currentRoute.includes('/login') || currentRoute === '/SignUp';
  }
  showNotifications = false;

  // toggleNotifications() {
  //   this.showNotifications = !this.showNotifications;
  // }

  // toggleNotifications() {
  //   if (!this.showNotifications) {
  //     this.showNotifications = true;
  //     this.isDropdownOpen = false;
  //     // this.sidebarService.toggleSidebar();
  //   } else {
  //     this.showNotifications = false;
  //   }
  // }

  notificationCount: number = 0; // Store notification count
  receiveNotificationCount(event: number) {
    this.notificationCount = event;
  }

  // toggleNotifications() {
  //   if (!this.showNotifications) {
  //     this.showNotifications = true;
  //     this.isDropdownOpen = false;
  //     // Optionally refresh notifications here
  //     this.apiCallService.GetCallWithToken('NotificationMessages/GetAllNotifications?PageNumber=1&PageSize=10')
  //       .subscribe((notifResponse) => {
  //         if (notifResponse && notifResponse.responseCode === 200) {
  //           this.notifications = notifResponse.data;
  //           this.notificationCount = this.notifications.length;
  //           localStorage.setItem('notifications', JSON.stringify(this.notifications));
  //         }
  //       });
  //   } else {
  //     this.showNotifications = false;
  //   }
  // }
  // Update notification count from child component
  updateNotificationCount(count: number) {
    this.notificationCount = count;
  }
  toggleNotifications() {
    // Close other panels
    this.isDropdownOpen = false;
    this.showwithdrawModal = false;
    this.updateChatComponent(false);

    // Toggle notifications
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.notifications.length === 0) {
      this.notificationService.loadNotifications(true);
    }
  }
  headervalue: any;
  getHeaderValue() {
    const payload = `User/GetHeaderValues`;
    this.apiCallService.GetCallWithToken(payload).subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          // Bind the header values from the API response
          // this.nameInitials = response.data.nameInitals || '';
          // this.profileImage = response.data.profileImage || '';
          this.headervalue = response.data || '';
          this.profileImage = response.data.profileImage
            ? response.data.profileImage
            : 'https://cmaxv2images2.pages.dev/assets/avatars/profileimage.png';

          //? Set Profile Image For Dynamic Update
          this.utilService.setProfileImage(this.profileImage);

          this.username = response.data.userName || '';
          localStorage.setItem('userName', response.data.userName);
          localStorage.setItem('profileImage', this.profileImage);
          localStorage.setItem('KYC', response.data.kycStatus);
          localStorage.setItem('referralCode', response.data.referralCode || '');
          this.kycVerfication = response.data.kycStatus;
          this.utilService.setHeaderData({
            referralCode: response.data.referralCode,
          });

          // pass data for completeprofile
          this.utilService.setCompleteProfileData({
            referralCode: response.data.referralCode,
            fullName: response.data.fullName,
            email: response.data.userEmail,
          });
        } else if (response && response.responseCode === 400) {
          // console.error(
          //   'Failed to fetch header values',
          //   response.responseMessage
          // );
          this.loaderService.hide();
        } else {
          // console.error('Unexpected response', response);
          this.loaderService.hide();
        }
      },
      (error) => {
        // console.error('Error fetching header values', error);
        this.loaderService.hide();
      },
    );
  }

  saveUserProfileImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];

      if (file) {
        try {
          // Show loader while processing
          this.loaderService.show();

          // Convert the file to a base64 string
          const base64Image = await this.convertFileToBase64(file);

          // Create the API payload
          const payload: any = {
            base64Image: base64Image,
          };

          // Make the API call
          this.apiCallService
            .PostCallWithToken(payload, 'User/SaveUserProfileImage')
            .subscribe(
              (response) => {
                if (response && response.responseCode === 200) {
                  this.profileImage = base64Image;

                  //? Set Profile Image for Dynamic Update
                  this.utilService.setProfileImage(base64Image);

                  this.getHeaderValue();
                  this.isDropdownOpen = false;
                  // console.log(
                  //   'Profile image saved successfully:',
                  //   response.responseMessage
                  // );
                } else {
                  // console.error(
                  //   'Failed to save profile image:',
                  //   response.responseMessage
                  // );
                }
                this.loaderService.hide();
              },
              (error) => {
                // console.error('Error saving profile image:', error);
                this.loaderService.hide();
              },
            );
        } catch (error) {
          // console.error('Error processing image file:', error);
          this.loaderService.hide();
        }
      }
    };

    // Trigger the file picker dialog
    fileInput.click();
  }

  // Delete User Profile Image
  deleteUserProfileImage() {
    this.loaderService.show();

    this.apiCallService
      .PostCallWithToken({}, 'User/DeleteUserProfileImage')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.profileImage = '';
            this.utilService.setProfileImage('');
            this.loaderService.triggerFunction();
          } else {
            this._errorHandleService.handleResponseError(response);
          }
        },
        error: (error) => {
          this._errorHandleService.handleHttpError(error);
        },
        complete: () => {
          this.loaderService.hide();
        },
      });
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  redirecttochngPass() {
    this.router.navigate(['dashboard/changePass']);
  }

  redirecttoTermsConditions() {
    this.router.navigate(['dashboard/Terms&Conditions']);
  }
  redirectToHelpSupport() {
    this.router.navigate(['dashboard/help-support']);
  }
  redirectToKYCform() {
    this.router.navigate(['dashboard/KYCform']);
  }

  RedirectToWallet() {
    this.updateChatComponent(false);
    this._errorHandleService.showModalSubject.next(true);
    // this.loaderService?.triggerWalletFunction();
    // this.router.navigate(['dashboard/wallet']);
  }

  redirectToLogin() {
    this.router.navigate(['login']);
  }

  isShowBanner(): boolean {
    // this.router.url == '/';
    return false;
  }
  isShowBannerExceptHome(): boolean {
    return this.router.url != '/';
  }
  openDeleteLink() {
    window.open('http://154.38.171.150:8046/Delete-Customer', '_blank');
  }

  isScreenWidthLessThan800(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 800;
  }

  OpenDownload() {
    this.loaderService.show();

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
          this.loaderService.hide();
        } else {
          this._errorHandleService.handleResponseError(response);
          this.loaderService.hide();
        }
      },
      (error) => {
        this._errorHandleService.handleHttpError(error);
      },
    );
  }
  handleOpenChat() {
    console.log('Header: openChatFromHeader emitted');
    this.openChatFromHeader.emit();
  }

  WalletPayload() {
    return {
      customerId: Number(localStorage.getItem('customerId')),
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
  }
  //   getWalletBalance(pageNumber: number = 1, searchText: string = '') {
  //     this.loaderService.show();
  //     const CustomerID = localStorage.getItem('customerId');
  //     // let payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=${pageNumber}&PageSize=${10}`;
  //     let payload = this.WalletPayload();

  //     // if (searchText.trim()) {
  //     //   payload += `&SearchText=${encodeURIComponent(searchText.trim())}`;
  //     // }

  //     this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe(

  getWalletBalance(pageNumber: number = 1) {
    const CustomerID = localStorage.getItem('customerId');
    // const payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=${pageNumber}&PageSize=${10}`;
    const payload = this.WalletPayload();
    this.apiCallService
      .PostCallWithToken(payload, 'Wallet/GetWalletBalance')
      .subscribe(
        (response) => {
          if (response && response.responseCode == 200) {
            const balance =
              response.data.totalBalance === ''
                ? this.walletAmount
                : parseFloat(response.data.totalBalance);

            this.walletAmount = balance;
            this.totalBalance = balance;
          } else {
            // console.log('Data fetch failed', response);
            // this.loaderService.hide();
            this._errorHandleService.handleResponseError(response);
          }
        },
        (error) => {
          // console.error('Data fetch error', error);
          // this.loaderService.hide();
          this._errorHandleService.handleHttpError(error);
        },
      );
  }
  isTreasurePickRoute(): boolean {
    const current = this.router.url;
    const hiddenHeaderRoutes = [
      '/dashboard/TreasurePick',
      '/dashboard/Avaitar',
      '/dashboard/Baccaret',
      '/dashboard/Roulette',
      '/dashboard/Mines',
      '/dashboard/Plinko',
      '/dashboard/StackBuilder',
      '/dashboard/Keno',
      'dashboard/coin'
    ];

    return hiddenHeaderRoutes.some((route) => current.startsWith(route));
  }

  // WithDraw Methods

  showwithdrawModal = false;
  selectedAccountType: string = 'Manual';
  amouttowithdraw: number | null = null;
  tipAmount: number | null = null;
  accountInfo: string = '';
  Customertag: any = '';
  public totalBalance = 0;
  get privateValue(): number {
    return this.totalBalance;
  }
  blockInvalidInput(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
      'Delete',
    ];

    if (allowedKeys.includes(event.key) || /^[0-9]$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }
  limitDecimals(field: 'amouttowithdraw' | 'tipAmount', event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        input.value = parts[0] + '.' + parts[1].slice(0, 2);
        (this as any)[field] = parseFloat(input.value);
      }
    }
  }
  limitToBalance(event: Event) {
    const input = event.target as HTMLInputElement;
    let value = Number(input.value);

    if (!value || value < 0) {
      this.amouttowithdraw = null;
      return;
    }

    if (value > this.totalBalance) {
      // Update both the input element AND the model
      input.value = this.totalBalance.toString();
      this.amouttowithdraw = this.totalBalance;
    }
  }
  openWithdrawBalanceModal() {
    // Close other panels
    this.isDropdownOpen = false;
    this.showNotifications = false;

    this.getPlatformFees();
    this.showwithdrawModal = true;
    this.getAccountsDropdown();
    this.selectedAccountType = '';
    this.amouttowithdraw = null;
    this.tipAmount = null;
    this.accountInfo = '';
    this.Customertag = '';
  }
  hideWithdrawModal() {
    this.showwithdrawModal = false;
  }

  getPlatformFees() {
    this.apiCallService.GetCallWithToken('Wallet/GetLookupsettings').subscribe(
      (response) => {
        if (response && response.responseCode == 200) {
          const platformFees = response?.data?.find(
            (x: any) => x.Type === 'Plateformfee',
          );
          this.serverFees = platformFees?.Value || 0;
        }
      },
      (error) => {
        this._errorHandleService.handleHttpError(error);
      },
    );
  }
  selectedAccounttitle: string = '';
  CashtagAccounts: any;
  ChimeAccounts: any;
  ZelleAccounts: any;

  // api/

  manualAccounts: any = [];
  getAccountsDropdown() {
    this.apiCallService
      .GetCallWithToken('CashTag/GetAccountsDropdown')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            // this.ChimeAccounts = response.data.chime;
            // this.CashtagAccounts = response.data.cashApp;
            this.manualAccounts = Object.keys(response.data).map((key) => ({
              name: key,
              accounts: response.data[key],
            }));
            this.ChimeAccounts =
              response.data.chime.length > 0
                ? response.data.chime
                : [{ accountDetail: 'No data found' }];
            this.CashtagAccounts =
              response.data.cashApp.length > 0
                ? response.data.cashApp
                : [{ accountDetail: 'No data found' }];
            this.ZelleAccounts =
              response.data.zelle.length > 0
                ? response.data.zelle
                : [{ accountDetail: 'No data found' }];
          } else {
            // this.handleError.handleResponseError(response);
            // this.hideWalletModal();

            this.ChimeAccounts = [{ accountDetail: 'No data found' }];
            this.CashtagAccounts = [{ accountDetail: 'No data found' }];
          }
        },
        error: (error) => {
          // this.handleError.handleHttpError(error);
          // this.hideWalletModal();
        },
      });
  }
  AccountType = [
    // {
    //   id: 0,
    //   name: 'Manual',
    //   bg_image: '/payments/manual.png',
    // },
    {
      id: 3,
      name: 'Card',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/master.png',
    },
    {
      id: 1,
      name: 'CashApp',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/cashapp.png',
    },
    {
      id: 2,
      name: 'Chime',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/chime.png',
    },
    {
      id: 3,
      name: 'Zelle',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/zelle.png',
    },
    {
      id: 3,
      name: 'Paypal',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/paypal.svg',
    },
  ];

  withdrawPaymentMethods = [
    {
      id: 1,
      name: 'Chime',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/chime.png',
      isActive: true,
    },
    {
      id: 2,
      name: 'Zelle',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/zelle.png',
      isActive: true,
    },
    {
      id: 3,
      name: 'CashApp',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/cashapp.png',
      isActive: true,
    },
    {
      id: 4,
      name: 'Card',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/master.png',
      isActive: false,
    },
    {
      id: 5,
      name: 'Paypal',
      bg_image:
        'https://cmaxv2images2.pages.dev/assets/icons/payments/paypal.svg',
      isActive: false,
    },
  ];

  accountTypeDropdownOpen = false;
  sourceAccount: string = '';
  isAccountTypeSelected: boolean = false;

  selectAccountType(name: string, event: Event) {
    event.stopPropagation();
    this.selectedAccountType = name;
    this.accountInfo = '';
    this.Customertag = '';
    // Clear fields when switching payment method
  }

  onAccountTypeChange(event: Event) {
    this.isAccountTypeSelected = true;
    this.sourceAccount = (event.target as HTMLSelectElement).value;
  }
  accountTypeData: any = [
    {
      id: 1,
      name: 'CashApp',
    },
    {
      id: 2,
      name: 'Chime',
    },
    {
      id: 3,
      name: 'Zelle',
    },
    // {
    //   id: 4,
    //   name: 'Transic (payment link)',
    // },
  ];

  updateChatComponent(value: boolean) {
    this._utils.toggleComponentVisibility(value);
  }
  createWithdrawRequest() {
    const withdrawAmount = Number(this.amouttowithdraw) || 0;
    const tipAmount = Number(this.tipAmount) || 0;
    const totalRequestedAmount = withdrawAmount + tipAmount;

    if (withdrawAmount > this.totalBalance + withdrawAmount) {
      this.toastr.error(
        'Withdraw amount + tip cannot be greater than available balance.',
        'Insufficient Balance',
      );
      return;
    }
    if (
      !withdrawAmount ||
      withdrawAmount <= 0 ||
      tipAmount < 0 ||
      !this.selectedAccountType ||
      !this.accountInfo ||
      !this.Customertag
    ) {
      this.toastr.info(
        'Please enter a valid amount and provide account details.',
        'Validation',
      );
      return;
    }

    const payload = {
      customerId: Number(localStorage.getItem('customerId')),
      balance: withdrawAmount,
      tip: tipAmount,
      source: this.selectedAccountType,
      accountTitle: this.accountInfo,
      requestType: 'Withdraw',
      accountInfo: this.Customertag,
    };

    this.loaderService.show();
    this.apiCallService
      .PostCallWithToken(payload, 'WalletRequest/CreateWalletWithdrawRequest')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.toastr.success(response.responseMessage, 'Success');
            this.showwithdrawModal = false;
            this.selectedAccountType = '';
            this.amouttowithdraw = null;
            this.tipAmount = null;
            this.getWalletBalance();
            this.loaderService.hide();
            this.loaderService?.triggerWalletFunction();
          } else {
            this._errorHandleService.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        error: (error) => {
          this._errorHandleService.handleHttpError(error);
          this.loaderService.hide();
        },
      });
  }
  onDropdownItemClick(action: string) {
    // Close the profile dropdown
    this.isDropdownOpen = false;

    // Optional: perform the action
    switch (action) {
      case 'upload':
        this.saveUserProfileImage();
        break;
      case 'remove':
        this.deleteUserProfileImage();
        break;
      case 'updatePass':
        this.redirecttochngPass();
        break;
      case 'terms':
        this.redirecttoTermsConditions();
        break;
      case 'logout':
        this.logout();
        break;
    }
  }

  // ///////////Api Call For KYC Form Header Value/////////

  KycValues: any;
  getKYCVerification() {
    const CustomerID = localStorage.getItem('customerId');
    this.apiCallService
      .GetCallWithToken('KYC/GetCustomerKYCStatus?CustomerId=' + CustomerID)
      .subscribe(
        (response) => {
          if (response && response.responseCode == 200) {
            this.KycValues = response.data;
            this.utilService.setCompletekycData({
              kycStatus: response.data || '',
            });
            this.utilService.setData(this.KycValues, true);
          } else {
            this._errorHandleService.handleResponseError(response);
          }
        },
        (error) => {
          this._errorHandleService.handleHttpError(error);
        },
      );
  }
  public pwaInstall = inject(PwaInstallService);

  ////////////Api Call For Language Form Header Value/////////

  isLangOpen = false;
  currentLanguage = 'en';
  languages = [
    { code: 'en', name: 'English' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'sq', name: 'Albanian' },
    { code: 'am', name: 'Amharic' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hy', name: 'Armenian' },
    { code: 'az', name: 'Azerbaijani' },
    { code: 'eu', name: 'Basque' },
    { code: 'be', name: 'Belarusian' },
    { code: 'bn', name: 'Bengali' },
    { code: 'bs', name: 'Bosnian' },
    { code: 'bg', name: 'Bulgarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'ceb', name: 'Cebuano' },
    { code: 'ny', name: 'Chichewa' },
    { code: 'zh', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'co', name: 'Corsican' },
    { code: 'hr', name: 'Croatian' },
    { code: 'cs', name: 'Czech' },
    { code: 'da', name: 'Danish' },
    { code: 'nl', name: 'Dutch' },
    { code: 'eo', name: 'Esperanto' },
    { code: 'et', name: 'Estonian' },
    { code: 'tl', name: 'Filipino' },
    { code: 'fi', name: 'Finnish' },
    { code: 'fr', name: 'French' },
    { code: 'fy', name: 'Frisian' },
    { code: 'gl', name: 'Galician' },
    { code: 'ka', name: 'Georgian' },
    { code: 'de', name: 'German' },
    { code: 'el', name: 'Greek' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'ht', name: 'Haitian Creole' },
    { code: 'ha', name: 'Hausa' },
    { code: 'haw', name: 'Hawaiian' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'hmn', name: 'Hmong' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'is', name: 'Icelandic' },
    { code: 'ig', name: 'Igbo' },
    { code: 'id', name: 'Indonesian' },
    { code: 'ga', name: 'Irish' },
    { code: 'it', name: 'Italian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'jw', name: 'Javanese' },
    { code: 'kn', name: 'Kannada' },
    { code: 'kk', name: 'Kazakh' },
    { code: 'km', name: 'Khmer' },
    { code: 'rw', name: 'Kinyarwanda' },
    { code: 'ko', name: 'Korean' },
    { code: 'ku', name: 'Kurdish' },
    { code: 'ky', name: 'Kyrgyz' },
    { code: 'lo', name: 'Lao' },
    { code: 'la', name: 'Latin' },
    { code: 'lv', name: 'Latvian' },
    { code: 'lt', name: 'Lithuanian' },
    { code: 'lb', name: 'Luxembourgish' },
    { code: 'mk', name: 'Macedonian' },
    { code: 'mg', name: 'Malagasy' },
    { code: 'ms', name: 'Malay' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'mt', name: 'Maltese' },
    { code: 'mi', name: 'Maori' },
    { code: 'mr', name: 'Marathi' },
    { code: 'mn', name: 'Mongolian' },
    { code: 'my', name: 'Myanmar (Burmese)' },
    { code: 'ne', name: 'Nepali' },
    { code: 'no', name: 'Norwegian' },
    { code: 'or', name: 'Odia' },
    { code: 'ps', name: 'Pashto' },
    { code: 'fa', name: 'Persian' },
    { code: 'pl', name: 'Polish' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
    { code: 'sm', name: 'Samoan' },
    { code: 'gd', name: 'Scots Gaelic' },
    { code: 'sr', name: 'Serbian' },
    { code: 'st', name: 'Sesotho' },
    { code: 'sn', name: 'Shona' },
    { code: 'sd', name: 'Sindhi' },
    { code: 'si', name: 'Sinhala' },
    { code: 'sk', name: 'Slovak' },
    { code: 'sl', name: 'Slovenian' },
    { code: 'so', name: 'Somali' },
    { code: 'es', name: 'Spanish' },
    { code: 'su', name: 'Sundanese' },
    { code: 'sw', name: 'Swahili' },
    { code: 'sv', name: 'Swedish' },
    { code: 'tg', name: 'Tajik' },
    { code: 'ta', name: 'Tamil' },
    { code: 'tt', name: 'Tatar' },
    { code: 'te', name: 'Telugu' },
    { code: 'th', name: 'Thai' },
    { code: 'tr', name: 'Turkish' },
    { code: 'tk', name: 'Turkmen' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ur', name: 'Urdu' },
    { code: 'ug', name: 'Uyghur' },
    { code: 'uz', name: 'Uzbek' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'cy', name: 'Welsh' },
    { code: 'xh', name: 'Xhosa' },
    { code: 'yi', name: 'Yiddish' },
    { code: 'yo', name: 'Yoruba' },
    { code: 'zu', name: 'Zulu' }

  ];
  searchText: string = '';

  // FILTER FUNCTION
  filteredLanguages() {
    if (!this.searchText) return this.languages;

    return this.languages.filter(lang =>
      lang.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // your existing function (unchanged)
  dropdownStyle: any = {};

  toggleLangDropdown(btn: HTMLElement) {
    this.isLangOpen = !this.isLangOpen;

    if (this.isLangOpen) {
      const rect = btn.getBoundingClientRect();

      this.dropdownStyle = {
        position: 'fixed',
        top: rect.bottom + 'px',
        left: rect.right - 160 + 'px'
      };
    }
  }

  selectLanguage(langCode: string) {
    this.currentLanguage = langCode;
    this.loaderService.show();

    const interval = setInterval(() => {
      const select: any = document.querySelector('.goog-te-combo');

      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));

        clearInterval(interval);
        this.loaderService.hide();
      }
    }, 300);

    this.isLangOpen = false;
    this.searchText = '';
  }

  async installApp(): Promise<void> {
    const result = await this.pwaInstall.promptInstall();

    if (result === 'unavailable') {
      this.toastr.info(
        'To install: open your browser menu (⋮ or …) → "Install app" or "Add to Home Screen".',
        'Install Casino Maxs',
        { timeOut: 6000, positionClass: 'toast-top-center' },
      );
    } else if (result === 'accepted') {
      this.toastr.success('App installed successfully!', 'Casino Maxs', {
        timeOut: 3000,
      });
    }
  }


  // Detect Ip Address and Block Access

  detectIpAddress() {
    this.http.get<any>('https://api.country.is/')
      .subscribe({
        next: (res) => {
          this.locationService.setCountry(res.country);
        },
        error: (err) => {
          console.log(err);
        }
      });
  }


  // User Level UpDate Api Call

  profileLevel: any;
  getLevelImage(level: number): string {
    switch (level) {
      case 1: return '/BrornzeLevel.png';
      case 2: return '/SilverLevel.png';
      case 3: return '/GoldLevel.png';
      case 4: return '/PlatinumLevel.png';
      case 5: return '/DiamondLevel.png';
      default: return '/default.png';
    }
  }

  UpdateCustomerLevel() {
    const customerId = localStorage.getItem('customerId');

    this.locationService.UpdateCustomerLevel(customerId).subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          const level = response.data.level;
          this.profileLevel = level;
        } else {
          this._errorHandleService.handleResponseError(response);
        }
      },
      error: (error) => {
        this._errorHandleService.handleHttpError(error);
      }
    });
  }

}
