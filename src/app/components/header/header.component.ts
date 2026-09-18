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
import { UtilsService } from '../../Services/utils.service';
import { MusicService } from '../../Services/music.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { NotificationService } from '../../Services/notification.service';
import { EventEmitter, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SafeHtml } from '@angular/platform-browser';
import { PwaInstallService } from '../../Services/pwa-install.service';
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
    TranslateModule,
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
  notifications: any[] = [];
  showAlert: boolean = true;
  @Output() openChatFromHeader = new EventEmitter<void>();

  closeAlert() {
    this.showAlert = false;
  }
  grainBackdrop: SafeHtml = '';
  
  serverFees: number = 0;

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
  ) {
    this.grainBackdrop = this._utils.getGrainBackdrop();
    this.isDashboardRoute();
    this.isLandingRoute();
    this.isMuted = this.musicService.isMusicMuted();
    if (this.router.url.startsWith('/VerifyPayment')) {
      this.isNotLoginBtnShown = true;
    }
    this.getKYCVerification();
  }

  isNotLoginBtnShown: boolean = false;
  toggleMusic() {
    this.musicService.muteUnmute();
    this.isMuted = this.musicService.isMusicMuted();
  }

  get actualWithdrawAmount(): number {
    const amount = Number(this.amouttowithdraw) || 0;
    const tip = Number(this.tipAmount) || 0;
    const serverFeePercent = Number(this.serverFees) || 0;
    const serverFeeAmount = (amount * serverFeePercent) / 100;
    const finalAmount = amount - tip - serverFeeAmount;
    return finalAmount > 0 ? parseFloat(finalAmount.toFixed(2)) : 0;
  }

  toggleSidebar(event: MouseEvent) {
    event.stopPropagation();
    this.updateChatComponent(false);
    this.sidebarService.toggleSidebar();
    this.showNotifications = false;
    this.isDropdownOpen = false;
    this.Ref.detectChanges();
  }

  private destroy$ = new Subject<void>();
  ngOnInit() {
    this.previousUrl = this.router.url;
    this.detectIpAddress();
    this.getCustomerLevel();
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

    const currentUrl = this.router.url;
    if (currentUrl !== '/dashboard' && currentUrl !== '/') {
      this.notificationService.loadNotifications(true);
    }

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

    this.translate.setDefaultLang('en');
    const savedLang = this.utilService.getItem('language') || 'en';
    this.currentLanguage = savedLang;

    this.http.get(`/i18n/${savedLang}.json`).subscribe((translations: any) => {
      this.translate.setTranslation(savedLang, translations);
      this.translate.use(savedLang);
    });
  }

  walletAmount: number = 0;
  bonusWalletAmount: number = 0;

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
    this._socketService.close();
    this.utilService.toggleComponentVisibility(false);
    this.closeLogoutModal();

    localStorage.setItem('user_logged_out', 'true');
    sessionStorage.clear();
    localStorage.clear();
    this.toastr.success('You have been securely signed out.', 'Signed Out');
    this.router.navigate(['/login']);
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
          }
          this.loaderService.hide();
        },
        (error) => {
          this._errorHandleService.handleHttpError(error);
          this.loaderService.hide();
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
    this.showNotifications = false;
    this.showwithdrawModal = false;
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  isAuthRoute(): boolean {
    const currentRoute = this.router.url;
    return currentRoute.includes('/login') || currentRoute === '/SignUp';
  }
  showNotifications = false;

  notificationCount: number = 0;

  removeNotification(index: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.notifications.splice(index, 1);
    this.notificationCount = this.notifications.length;
    this.Ref.detectChanges();
  }

  toggleNotifications() {
    this.isDropdownOpen = false;
    this.showwithdrawModal = false;
    this.updateChatComponent(false);

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
          this.headervalue = response.data || '';
          this.profileImage = response.data.profileImage
            ? response.data.profileImage
            : 'https://cmaxv2images2.pages.dev/assets/avatars/profileimage.png';

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

          this.utilService.setCompleteProfileData({
            referralCode: response.data.referralCode,
            fullName: response.data.fullName,
            email: response.data.userEmail,
          });
        } else {
          this.loaderService.hide();
        }
      },
      (error) => {
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
          this.loaderService.show();
          const base64Image = await this.convertFileToBase64(file);
          const payload: any = { base64Image: base64Image };

          this.apiCallService
            .PostCallWithToken(payload, 'User/SaveUserProfileImage')
            .subscribe(
              (response) => {
                if (response && response.responseCode === 200) {
                  this.profileImage = base64Image;
                  this.utilService.setProfileImage(base64Image);
                  this.getHeaderValue();
                  this.isDropdownOpen = false;
                }
                this.loaderService.hide();
              },
              (error) => {
                this.loaderService.hide();
              },
            );
        } catch (error) {
          this.loaderService.hide();
        }
      }
    };
    fileInput.click();
  }

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

  // DEPOSIT / ADD BALANCE MODAL METHODS
  RedirectToWallet() {
    this.updateChatComponent(false);
    this._errorHandleService.showModalSubject.next(true);
  }

  openWalletHistory() {
    this.updateChatComponent(false);
    this.router.navigate(['/dashboard/wallet'], { queryParams: { view: 'wallet' } });
  }

  openBonusWallet() {
    this.updateChatComponent(false);
    this.router.navigate(['/dashboard/wallet'], { queryParams: { view: 'bonus' } });
  }

  redirectToLogin() {
    this.router.navigate(['login']);
  }

  isShowBanner(): boolean {
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
          const link = document.createElement('a');
          link.href = filePath;
          link.download = 'social.apk';
          link.target = '_blank';
          link.click();
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
    this.openChatFromHeader.emit();
  }

  WalletPayload() {
    return {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
  }

  getWalletBalance(pageNumber: number = 1) {
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

            this.bonusWalletAmount =
              response.data.totalBonusBalance === '' ||
              response.data.totalBonusBalance == null
                ? this.bonusWalletAmount
                : parseFloat(response.data.totalBonusBalance);
          } else {
            this._errorHandleService.handleResponseError(response);
          }
        },
        (error) => {
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
    const allowedKeys = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab', 'Delete'];
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
      input.value = this.totalBalance.toString();
      this.amouttowithdraw = this.totalBalance;
    }
  }

  openWithdrawBalanceModal() {
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
    this.apiCallService
      .GetCallWithToken('WalletRequest/GetTransactionfee')
      .subscribe(
        (response) => {
          if (response && response.responseCode == 200) {
            this.serverFees = Number(response?.data) || 0;
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
  manualAccounts: any = [];

  getAccountsDropdown() {
    this.apiCallService
      .GetCallWithToken('CashTag/GetAccountsDropdown')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
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
            this.ChimeAccounts = [{ accountDetail: 'No data found' }];
            this.CashtagAccounts = [{ accountDetail: 'No data found' }];
          }
        },
        error: (error) => {},
      });
  }

  withdrawPaymentMethods = [
    { id: 1, name: 'Chime', bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/chime.png', isActive: true },
    { id: 2, name: 'Zelle', bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/zelle.png', isActive: true },
    { id: 3, name: 'CashApp', bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/cashapp.png', isActive: true },
    { id: 4, name: 'Card', bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/master.png', isActive: false },
    { id: 5, name: 'Paypal', bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/paypal.svg', isActive: false },
  ];

  accountTypeDropdownOpen = false;
  sourceAccount: string = '';
  isAccountTypeSelected: boolean = false;

  selectAccountType(name: string, event: Event) {
    event.stopPropagation();
    this.selectedAccountType = name;
    this.accountInfo = '';
    this.Customertag = '';
  }

  onAccountTypeChange(event: Event) {
    this.isAccountTypeSelected = true;
    this.sourceAccount = (event.target as HTMLSelectElement).value;
  }

  accountTypeData: any = [
    { id: 1, name: 'CashApp' },
    { id: 2, name: 'Chime' },
    { id: 3, name: 'Zelle' },
  ];

  updateChatComponent(value: boolean) {
    this._utils.toggleComponentVisibility(value);
  }

  createWithdrawRequest() {
    const withdrawAmount = Number(this.amouttowithdraw) || 0;
    const tipAmount = Number(this.tipAmount) || 0;

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
      customerId: localStorage.getItem('customerId') || '',
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
    this.isDropdownOpen = false;
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

  KycValues: any;
  getKYCVerification() {
    const CustomerID = typeof localStorage !== 'undefined' ? localStorage.getItem('customerId') : null;
    if (!CustomerID) return;
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

  isLangOpen = false;
  currentLanguage = 'en';
  languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ur', name: 'Urdu' }
  ];
  searchText: string = '';

  filteredLanguages() {
    if (!this.searchText) return this.languages;
    return this.languages.filter(lang =>
      lang.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  dropdownStyle: any = {};

  toggleLangDropdown(btn: HTMLElement) {
    this.isLangOpen = !this.isLangOpen;
    if (this.isLangOpen) {
      const rect = btn.getBoundingClientRect();
      this.dropdownStyle = {
        position: 'fixed',
        top: rect.bottom + 'px',
        left: rect.right - 180 + 'px'
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
    if (result === 'accepted') {
      this.toastr.success('App installed successfully!', 'Casino Maxs');
    }
  }

  detectIpAddress() {
    this.http.get<any>('https://api.country.is/')
      .subscribe({
        next: (res) => {
          this.locationService.setCountry(res.country);
        },
        error: (err) => {}
      });
  }

  playerLevel: string = '';
  levelRank: number = 0;

  getLevelImage(levelName: string): string {
    const name = (levelName || '').toLowerCase();
    if (name.includes('bronze')) return '/BrornzeLevel.png';
    if (name.includes('silver')) return '/SilverLevel.png';
    if (name.includes('gold')) return '/GoldLevel.png';
    if (name.includes('platinum')) return '/PlatinumLevel.png';
    if (name.includes('diamond')) return '/DiamondLevel.png';
    return '/BrornzeLevel.png';
  }

  getCustomerLevel() {
    const customerId = localStorage.getItem('customerId') || '';
    this.apiCallService
      .GetCallWithToken(`Customer/GetCustomerLevel?CustomerId=${customerId}`)
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            const data = response.data;
            this.playerLevel = data.playerLevel || '';
            const sortedLevels = (data.levels || [])
              .slice()
              .sort((a: any, b: any) => (a.MinDepositRange || 0) - (b.MinDepositRange || 0));
            const rankIndex = sortedLevels.findIndex(
              (lvl: any) =>
                (lvl?.LevelName || '').toLowerCase() ===
                this.playerLevel.toLowerCase(),
            );
            this.levelRank = rankIndex >= 0 ? rankIndex + 1 : 0;
          }
        },
        error: () => {},
      });
  }
}