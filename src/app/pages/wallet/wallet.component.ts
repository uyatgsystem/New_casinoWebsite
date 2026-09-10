import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import Swal from 'sweetalert2';
import { ActivatedRoute } from '@angular/router';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { Transaction } from '../../Interfaces/interfaces';
import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { GameService } from '../../Services/game.service';
import { UtilsService } from '../../Services/utils.service';
import { LocalTimePipe } from '../../Pipes/local-time.pipe';

import {
  faCircleInfo,
  faEye,
  faEyeSlash,
  faSurprise,
  faSackDollar,
  faArrowLeft,
  faSearch,
  faFilter,
  faEdit,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { AuthorizeNetService } from '../../Services/authorize-net.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    LoaderComponent,
    FontAwesomeModule,
    LocalTimePipe,
  ],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.scss',
})
export class WalletComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dateFilterWrapper') wrapper!: ElementRef;

  infoIcon = faCircleInfo;
  surpriseIcon = faSurprise;
  sackDollarIcon = faSackDollar;
  faArrowLeft = faArrowLeft;
  showDateFilter: boolean = false;
  startDate: string | null = null;
  endDate: string | null = null;

  paymentForm: FormGroup;
  cashappForm: FormGroup;

  isSearchOpen = false;

  faSearch = faSearch;
  faFilter = faFilter;
  faEdit = faEdit;
  faTrash = faTrash;

  grainBackdrop: SafeHtml = '';
  constructor(
    private apiCallService: ApiCallService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private handleError: ErrorhandlingService,
    private GameService: GameService,
    private utilsService: UtilsService,
    private cdr: ChangeDetectorRef,
    private authorizeService: AuthorizeNetService,
    private fb: FormBuilder,
    private location: Location,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.paymentForm = this.fb.group({
      cardNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{13,16}$/), // Basic pattern for 13-16 digits
        ],
      ],
      month: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.max(12),
          Validators.pattern(/^\d{1,2}$/),
        ],
      ],
      year: [
        '',
        [
          Validators.required,
          Validators.min(new Date().getFullYear()), // Min year is current year
          Validators.max(2099),
          Validators.pattern(/^\d{4}$/), // Enforce 4-digit year
        ],
      ],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      amount: [
        '',
        [
          // Amount is now dynamic with a default value
          Validators.required,
          Validators.min(1),
        ],
      ],
    });

    this.cashappForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
    });
  }

  private destroy$ = new Subject<void>();
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  @ViewChild('transactionTable', { static: false })
  transactionTable!: ElementRef;

  currentSearchTerm: string = '';

  openFilter(event: Event) {
    event.stopPropagation();
    this.showDateFilter = !this.showDateFilter;
  }

  closeFilter() {
    this.showDateFilter = false;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.showDateFilter = false;
  }

  onScroll(): void {
    const element = this.transactionTable.nativeElement;
    if (element.offsetHeight + element.scrollTop + 1 >= element.scrollHeight) {
      this.currentPage++;
      this.getWalletBalance(this.currentPage, this.currentSearchTerm);
    }
  }

  onMobileScroll(event: any) {
    const element = event.target;
    const threshold = 100;
    if (element.scrollHeight - (element.scrollTop + element.clientHeight) <= threshold) {
      if (!this.isLoadingMore) {
        this.isLoadingMore = true;
        this.currentPage++;
        this.getWalletBalance(this.currentPage, this.currentSearchTerm);
        setTimeout(() => {
          this.isLoadingMore = false;
        }, 500);
      }
    }
  }

  onScrollTop(): void {}
  onScrollBottom(): void {}

  dropdownOpen = false;
  selectedFilter = 'All Transactions';
  filterSearchTerm = '';

  filterOptions = ['All Transactions', 'Credited', 'Debited'];

  get filteredOptions() {
    if (!this.filterSearchTerm) {
      return this.filterOptions;
    }
    return this.filterOptions.filter((option) =>
      option.toLowerCase().includes(this.filterSearchTerm.toLowerCase()),
    );
  }

  selectFilter(filter: string, event: Event) {
    event.preventDefault();
    this.selectedFilter = filter;
    this.dropdownOpen = false;
    this.filterSearchTerm = '';
  }
  onSearchClick(event: Event) {
    event.stopPropagation();
  }

  public totalBalance = 0;

  get privateValue(): number {
    return this.totalBalance;
  }
  transactions: any[] = [];
  Debittransactions: any[] = [];
  selectedTab: string = 'credit';
  searchControl: string = '';
  showModal = false;
  showwithdrawModal = false;

  showicon = faEye;
  hideicon = faEyeSlash;

  toggleData(bar: string) {
    this.selectedTab = bar;
  }

  public totalBonusBalance = 0;
  bonusTransactions: any[] = [];
  walletView: 'wallet' | 'bonus' = 'wallet';

  toggleWalletView(view: 'wallet' | 'bonus') {
    this.walletView = view;
  }

  showMoveToWalletModal = false;
  isMoveToWalletLoading = false;
  isMovingToWallet = false;
  redeemPercentageOnBonusWallet = 0;

  get moveToWalletAmount(): number {
    return (this.totalBonusBalance * this.redeemPercentageOnBonusWallet) / 100;
  }

  openMoveToWalletModal() {
    this.showMoveToWalletModal = true;
    this.redeemPercentageOnBonusWallet = 0;
    this.isMoveToWalletLoading = true;

    const customerId = this.getCustomerID() || '';

    this.apiCallService
      .GetCallWithToken(`Customer/GetCustomerLevel?CustomerId=${customerId}`)
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            const data = response.data;
            const levels = data?.levels || [];
            const currentLevel = levels.find(
              (lvl: any) => lvl.LevelName === data?.playerLevel,
            );
            this.redeemPercentageOnBonusWallet =
              Number(currentLevel?.RedeemPercentageOnBonusWallet) || 0;
          } else {
            this.handleError.handleResponseError(response);
          }
          this.isMoveToWalletLoading = false;
        },
        error: (error) => {
          this.handleError.handleHttpError(error);
          this.isMoveToWalletLoading = false;
        },
      });
  }

  closeMoveToWalletModal() {
    this.showMoveToWalletModal = false;
  }

  confirmMoveToWallet() {
    if (this.isMovingToWallet || this.moveToWalletAmount <= 0) {
      return;
    }

    const customerId = this.getCustomerID() || '';
    this.isMovingToWallet = true;
    this.loaderService.show();

    this.apiCallService
      .PostCallWithToken(
        {},
        `Wallet/TransferBonusBalanceToTotalBalance?CustomerID=${customerId}`,
      )
      .subscribe({
        next: (response) => {
          this.isMovingToWallet = false;
          this.loaderService.hide();

          if (response && response.responseCode === 200) {
            this.toastr.success(response.responseMessage, 'Success');
            this.totalBalance =
              response.data?.currentBalance ?? this.totalBalance;
            this.totalBonusBalance =
              response.data?.currentBonusBalance ?? this.totalBonusBalance;
            this.closeMoveToWalletModal();
            this.getWalletBalance();
          } else {
            this.handleError.handleResponseError(response);
          }
        },
        error: (error) => {
          this.isMovingToWallet = false;
          this.loaderService.hide();
          this.handleError.handleHttpError(error);
        },
      });
  }

  WalletPayload() {
    let customerIdVal = '';
    if (isPlatformBrowser(this.platformId)) {
      customerIdVal = localStorage.getItem('customerId') || '';
    }
    return {
      customerId: customerIdVal,
      pageNumber: this.currentPage,
      pageSize: 10,
      searchText: this.currentSearchTerm || '',
      startDate: this.startDate || '',
      endDate: this.endDate || '',
    };
  }

  getWalletBalance(pageNumber: number = 1, searchText: string = '') {
    this.loaderService.show();
    let payload = this.WalletPayload();

    this.apiCallService
      .PostCallWithToken(payload, 'Wallet/GetWalletBalance')
      .subscribe(
        (response) => {
          if (response && response.responseCode == 200) {
            this.loaderService?.triggerWalletFunction();
            this.updateBalance(response.data.totalBalance);
            this.totalBalance =
              response.data.totalBalance === ''
                ? this.totalBalance
                : parseFloat(response.data.totalBalance);

            this.totalBonusBalance =
              response.data.totalBonusBalance === '' ||
              response.data.totalBonusBalance == null
                ? this.totalBonusBalance
                : parseFloat(response.data.totalBonusBalance);

            const creditTransactions = response.data.creditWallets.map(
              (transaction: any) => ({
                ...transaction,
                type: 'credit',
                balance: transaction.creditBalance,
                time: transaction.creditTime,
              }),
            );

            const debitTransactions = response.data.debitWallets.map(
              (transaction: any) => ({
                ...transaction,
                type: 'debit',
                balance: transaction.debitAmount,
                time: transaction.debitDate,
              }),
            );

            const newTransactions = [
              ...creditTransactions,
              ...debitTransactions,
            ].sort(
              (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
            );

            const newBonusTransactions = newTransactions.filter(
              (transaction) => transaction.typesofRequest === 'bonus',
            );

            if (pageNumber === 1) {
              this.transactions = newTransactions;
              this.bonusTransactions = newBonusTransactions;
            } else {
              this.transactions = [...this.transactions, ...newTransactions];
              this.bonusTransactions = [
                ...this.bonusTransactions,
                ...newBonusTransactions,
              ];
            }

            const isAnyTransactionPending = this.transactions.some(
              (transaction) =>
                transaction.source == 'Withdraw' &&
                transaction.status === 'Pending',
            );
            this.utilsService.setWithdrawPending(isAnyTransactionPending);

            this.loaderService.hide();
          } else {
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          this.handleError.handleHttpError(error);
        },
      );
  }

  updateBalance(newBalance: number): void {
    this.GameService.balance = newBalance;
  }

  get filteredTransactions() {
    let allTransactions = this.transactions;

    switch (this.selectedFilter) {
      case 'Credited':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'credit',
        );
        break;
      case 'Debited':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'debit',
        );
        break;
      case 'All Transactions':
      default:
        break;
    }

    return allTransactions;
  }

  get filteredBonusTransactions() {
    let allBonusTransactions = this.bonusTransactions;

    switch (this.selectedFilter) {
      case 'Credited':
        allBonusTransactions = allBonusTransactions.filter(
          (transaction) => transaction.type === 'credit',
        );
        break;
      case 'Debited':
        allBonusTransactions = allBonusTransactions.filter(
          (transaction) => transaction.type === 'debit',
        );
        break;
      case 'All Transactions':
      default:
        break;
    }

    return allBonusTransactions;
  }

  performSearch() {
    this.currentSearchTerm = this.searchControl;
    this.currentPage = 1;
    this.getWalletBalance(1, this.currentSearchTerm);
  }

  onSearchInputChange(event: any) {
    if (event.key !== 'Enter') {
      if (!this.searchControl || this.searchControl.trim() === '') {
        this.clearSearch();
        this.closeFilter();
      }
    }
  }

  clearSearch() {
    this.searchControl = '';
    this.currentSearchTerm = '';
    this.currentPage = 1;
    this.getWalletBalance(1, '');
  }

  ngOnInit() {
    this.getWalletBalance();
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params && (params['view'] === 'wallet' || params['view'] === 'bonus')) {
          this.walletView = params['view'];
        }
        if (params && params['openWithdraw']) {
          this.showwithdrawModal = true;
          this.getAccountsDropdown();
          this.selectedAccountType = '';
          this.amouttowithdraw = null;
          this.tipAmount = null;
          this.accountInfo = '';
          this.Customertag = '';
        }
        if (params && params['openDeposit']) {
          this.openAddBalanceModal();
        }
      });
    this.utilsService
      .getTriggerWalletObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getWalletBalance();
      });
  }

  onStartDateChange(date: string) {
    if (this.endDate && new Date(this.endDate) < new Date(date)) {
      this.endDate = null;
    }
  }

  resetDates() {
    this.startDate = null;
    this.endDate = null;
  }

  openAddBalanceModal() {
    const isAnyTransactionPending = this.filteredTransactions.some(
      (transaction) =>
        transaction.source == 'Withdraw' && transaction.status === 'Pending',
    );
    this.utilsService.setWithdrawPending(isAnyTransactionPending);
    this.handleError.showModalSubject.next(true);
  }

  openWithdrawBalanceModal() {
    this.showwithdrawModal = true;
    this.getPlatformFees();
    this.getAccountsDropdown();
    this.editingTransactionId = null;
    this.selectedAccountType = '';
    this.amouttowithdraw = null;
    this.tipAmount = null;
    this.accountInfo = '';
    this.Customertag = '';
  }

  getCustomerID(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('customerId') || '';
    }
    return null;
  }
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }
  getUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('userName');
    }
    return null;
  }

  showBalance: boolean = false;

  toggleBalance() {
    this.showBalance = !this.showBalance;
    if (isPlatformBrowser(this.platformId)) {
      const balanceElement = document.getElementById('balance');
      if (balanceElement) {
        balanceElement.textContent = this.showBalance
          ? `$${this.totalBalance.toLocaleString()}`
          : '•••••';
      }
    }
  }

  viewMode: 'grid' | 'table' = 'grid';

  toggleView() {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  currentPage: number = 1;
  isLoadingMore: boolean = false;

  isAccountSelected: boolean = false;
  isShowManualEntry: boolean = true;
  isAcountDropDownSelected: boolean = false;

  onAccountChange(selectedValue: any): void {
    this.isAcountDropDownSelected = true;
    this.selectedAccounttitle = '';
    this.selectedAccount = selectedValue?.name || '';
    this.accountsTitle = selectedValue?.accounts || [];
    this.isAccountSelected = true;
  }

  onAccountTypesChange(selectedValue: string): void {
    this.isAcountDropDownSelected = false;
    this.selectedAccountType = selectedValue;
  }

  accountDropdownOpen = false;
  selectedAccount: string = '';
  selectAccount(account: any, event: Event) {
    event.preventDefault();
    this.selectedAccount = account?.name || '';
    this.accountDropdownOpen = false;
    this.onAccountChange(account || '');
  }

  selectAccountTypes(name: string, event: Event) {
    event.preventDefault();
    this.selectedAccountType = name;
    if (name == 'Manual') {
      this.accountDropdownOpen = true;
    }
  }

  @HostListener('document:click')
  closeDropdown() {
    this.accountDropdownOpen = false;
  }

  toggleManualEntry() {
    this.isShowManualEntry = !this.isShowManualEntry;
  }

  manualEntry(event: Event) {
    event.stopPropagation();
    this.isShowManualEntry = true;
    this.selectedAccountType = '';
    this.selectedAccounttitle = '';
    this.uploadProfileImage = '';
  }

  autoEntry(event: Event) {
    event.stopPropagation();
    this.isShowManualEntry = false;
  }

  selectedAccountType: string = 'Manual';
  selectedAccounttitle: string = '';
  CashtagAccounts: any;
  ChimeAccounts: any;
  ZelleAccounts: any;
  Customertag: any = '';

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

  goBack() {
    this.location.back();
  }
  accountsTitle: any;
  accountTitleDropdownOpen = false;
  selectAccountTitle(accountDetail: string) {
    this.selectedAccounttitle = accountDetail;
    this.accountTitleDropdownOpen = false;
  }

  uploadProfileImage: string = '';

  async onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement)?.files?.[0];

    if (file) {
      try {
        this.loaderService.show();
        const base64Image = await this.convertFileToBase64(file);
        this.uploadProfileImage = base64Image;
        this.loaderService.hide();
      } catch (error) {
        this.loaderService.hide();
        console.error(error);
      }
    }
  }

  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        if (!isPlatformBrowser(this.platformId)) {
          resolve('');
          return;
        }
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          canvas.width = img.width;
          canvas.height = img.height;

          ctx?.drawImage(img, 0, 0);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedBase64);
        };

        img.onerror = reject;
        img.src = e.target.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  clearSelection() {
    this.uploadProfileImage = '';
  }

  hideWalletModal() {
    this.showModal = false;
    this.uploadProfileImage = '';
    this.selectedAccount = '';
    this.selectedAccounttitle = '';
    this.handleError.showModalSubject.next(false);
  }

  hideWithdrawModal() {
    this.showwithdrawModal = false;
  }

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

  amouttowithdraw: number | null = null;
  tipAmount: number | null = null;
  serverFees: number = 0;
  accountInfo: string = '';

  get actualWithdrawAmount(): number {
    const amount = Number(this.amouttowithdraw) || 0;
    const tip = Number(this.tipAmount) || 0;
    const serverFeePercent = Number(this.serverFees) || 0;

    const serverFeeAmount = (amount * serverFeePercent) / 100;
    const finalAmount = amount - tip - serverFeeAmount;

    return finalAmount > 0 ? parseFloat(finalAmount.toFixed(2)) : 0;
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
          this.handleError.handleHttpError(error);
        },
      );
  }

  createUpdateWithdrawRequest() {
    if (this.editingTransactionId) {
      this.updateWalletWithdrawRequest();
    } else {
      this.createWithdrawRequest();
    }
  }

  createWithdrawRequest() {
    const withdrawAmount = Number(this.amouttowithdraw) || 0;
    const tipAmount = Number(this.tipAmount) || 0;

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

    let customerIdVal = '';
    if (isPlatformBrowser(this.platformId)) {
      customerIdVal = localStorage.getItem('customerId') || '';
    }

    const payload: any = {
      customerId: customerIdVal,
      balance: withdrawAmount,
      tip: tipAmount,
      source: this.selectedAccountType,
      accountTitle: this.accountInfo,
      requestType: 'Withdraw',
      accountInfo: this.Customertag,
    };

    if (this.editingTransactionId) {
      payload.id = this.editingTransactionId;
    }

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
            this.editingTransactionId = null;
            this.getWalletBalance();
            this.loaderService.hide();
            this.loaderService?.triggerWalletFunction();
          } else {
            this.handleError.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        error: (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        },
      });
  }

  updateWalletWithdrawRequest() {
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

    let customerIdVal = '';
    if (isPlatformBrowser(this.platformId)) {
      customerIdVal = localStorage.getItem('customerId') || '';
    }

    const payload: any = {
      customerId: customerIdVal,
      balance: withdrawAmount,
      tip: tipAmount,
      source: this.selectedAccountType,
      accountTitle: this.accountInfo,
      requestType: 'Withdraw',
      accountInfo: this.Customertag,
    };

    payload.requestId = this.editingTransactionId;

    this.loaderService.show();
    this.apiCallService
      .PostCallWithToken(payload, 'WalletRequest/UpdateWalletWithdrawRequest')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.toastr.success(response.responseMessage, 'Success');
            this.showwithdrawModal = false;
            this.selectedAccountType = '';
            this.amouttowithdraw = null;
            this.tipAmount = null;
            this.editingTransactionId = null;
            this.getWalletBalance();
            this.loaderService.hide();
            this.loaderService?.triggerWalletFunction();
          } else {
            this.handleError.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        error: (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        },
      });
  }

  async pay() {
    this.loaderService.show();
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.loaderService.hide();
      return;
    }

    try {
      const formValue = this.paymentForm.value;
      const cardData = {
        cardNumber: formValue.cardNumber.toString(),
        month: formValue.month.toString(),
        year: formValue.year.toString().slice(-2),
        cardCode: formValue.cvv.toString(),
      };
      const authData = {
        clientKey:
          '8CRkkTs9N2M69SY6p6XMen7mk5xKP4khDmVwu2jTun93F3rK7VTqyq3kGZybTBC9',
        apiLoginID: '2aUJ4fF7U',
      };

      const opaqueData = await this.getPaymentNonce(cardData, authData);
      console.log('Opaque Data Genrated:', opaqueData);
    } catch (err) {
      console.error('Error generating token:', err);
      this.loaderService.hide();
    }
  }

  opaquePayload: any;
  getPaymentNonce(cardData: any, authData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!isPlatformBrowser(this.platformId) || !(window as any).Accept) {
        console.error('Authorize.Net Accept.js library not loaded or SSR environment.');
        this.loaderService.hide();
        return;
      }
      (window as any).Accept.dispatchData(
        {
          authData,
          cardData,
        },
        (response: any) => {
          if (response.messages.resultCode === 'Error') {
            reject(response.messages.message[0].text);
            this.loaderService.hide();
          } else {
            resolve(response.opaqueData);
            let customerIdVal = '';
            if (isPlatformBrowser(this.platformId)) {
              customerIdVal = localStorage.getItem('customerId') || '';
            }
            this.opaquePayload = {
              customerId: customerIdVal,
              amount: this.paymentForm.value.amount,
              source: 'Card',
              opaqueData: {
                dataDescriptor: response.opaqueData.dataDescriptor,
                dataValue: response.opaqueData.dataValue,
              },
            };

            this.sendDatatoApi();
          }
        },
      );
    });
  }

  sendDatatoApi() {
    this.apiCallService
      .PostCallWithToken(
        this.opaquePayload,
        'CashAppPayment/AuthorizeCardPaymentProcessor',
      )
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.toastr.success(response.responseMessage, 'Success');
            this.paymentForm.reset();
            this.loaderService.hide();
          } else {
            this.handleError.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        error: (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        },
      });
  }

  paycashApp() {
    this.loaderService.show();

    if (this.cashappForm.invalid) {
      this.cashappForm.markAllAsTouched();
      this.loaderService.hide();
      return;
    }

    let newTab: Window | null = null;
    if (isPlatformBrowser(this.platformId)) {
      newTab = window.open('', '_blank');
    }

    const amount = this.cashappForm.get('amount')?.value * 100;
    const customerId = this.getCustomerID();
    const posturl = `PaymentIntent/CreatePaymentIntent?amount=${amount}&CustomerId=${customerId}`;

    this.apiCallService.PostCallWithToken(null, posturl).subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.toastr.success(response.responseMessage, 'Success');
          if (newTab) {
            newTab.location.href = response.data.mobile_auth_url;
          } else if (isPlatformBrowser(this.platformId)) {
            window.open(response.data.mobile_auth_url, '_blank');
          }
        } else {
          this.handleError.handleResponseError(response);
          if (newTab) newTab.close();
        }
        this.loaderService.hide();
        this.hideWalletModal();
      },
      error: (error) => {
        this.handleError.handleHttpError(error);
        if (newTab) newTab.close();
        this.loaderService.hide();
        this.hideWalletModal();
      },
    });
  }

  togglePayment(name: string, event: Event) {
    event.preventDefault();
    if (name == 'Card') {
      this.showcardForm();
    } else if (name == 'CashApp') {
      this.showcashAppForm();
    } else {
      return;
    }
  }

  showcard: boolean = false;
  showcardForm() {
    this.showcard = true;
    this.showcashApp = false;
  }
  showcashApp: boolean = false;
  showcashAppForm() {
    this.showcashApp = true;
    this.showcard = false;
  }

  editingTransactionId: number | null = null;
  editWithdrawTransaction(transaction: any, event: Event) {
    this.getPlatformFees();
    event.stopPropagation();
    this.editingTransactionId = transaction.id || transaction.orderID || null;
    this.showwithdrawModal = true;
    this.getAccountsDropdown();
    this.selectedAccountType = transaction.accountType || '';
    this.accountInfo = transaction.accountTitle || '';
    this.Customertag = transaction.accountInfo || '';
    this.amouttowithdraw = transaction.balance;
    this.tipAmount = transaction.tip || 0;
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

  deleteWithdrawTransaction(transaction: any, event: Event) {
    event.stopPropagation();
    const transId = transaction.id || transaction.orderID;

    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to delete this withdraw request?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F3A630',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loaderService.show();
        this.apiCallService
          .PostCallWithToken(
            {},
            `WalletRequest/DeleteWalletWithdrawRequest?RequestId=${transId}`,
          )
          .subscribe({
            next: (response) => {
              if (response && response.responseCode === 200) {
                this.toastr.success(response.responseMessage, 'Success');
                this.getWalletBalance();
              } else {
                this.handleError.handleResponseError(response);
              }
              this.loaderService.hide();
            },
            error: (error) => {
              this.handleError.handleHttpError(error);
              this.loaderService.hide();
            },
          });
      }
    });
  }

  onAmountInput(event: any) {
    let value = event.target.value;
    value = value.replace(/[^0-9.]/g, '');

    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts[1];
    }

    if (parts[1]) {
      parts[1] = parts[1].substring(0, 2);
      value = parts[0] + '.' + parts[1];
    }

    this.amouttowithdraw = value;
  }
}