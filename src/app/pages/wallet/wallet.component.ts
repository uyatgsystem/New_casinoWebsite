import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
  OnDestroy,
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
import { CommonModule, Location } from '@angular/common';
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
    // console.log('scrolling');
    const element = this.transactionTable.nativeElement;
    if (element.offsetHeight + element.scrollTop + 1 >= element.scrollHeight) {
      this.currentPage++;
      // console.log('Scrolled to the bottom');
      this.getWalletBalance(this.currentPage, this.currentSearchTerm);
    }
  }

  onMobileScroll(event: any) {
    const element = event.target;
    // Use a threshold of 100px instead of exact equality to handle fractional pixels
    const threshold = 100;
    if (element.scrollHeight - (element.scrollTop + element.clientHeight) <= threshold) {
      // Prevent multiple simultaneous requests
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

  onScrollTop(): void {
    // console.log('Scrolled to the top');
  }

  onScrollBottom(): void {
    // console.log('Scrolled to the bottom');
  }

  dropdownOpen = false;
  selectedFilter = 'All Transactions';
  filterSearchTerm = '';

  filterOptions = ['All Transactions', 'Credited', 'Debited']; // NEW

  // Add filtered options getter
  get filteredOptions() {
    if (!this.filterSearchTerm) {
      return this.filterOptions;
    }
    return this.filterOptions.filter((option) =>
      option.toLowerCase().includes(this.filterSearchTerm.toLowerCase()),
    );
  }

  selectFilter(filter: string, event: Event) {
    event.preventDefault(); // prevent page jump
    this.selectedFilter = filter;
    this.dropdownOpen = false;
    this.filterSearchTerm = '';

    // Filter logic will be handled in the filteredTransactions getter
    console.log('Filter selected:', filter);
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
  newBalance = 0;

  showicon = faEye;
  hideicon = faEyeSlash;

  toggleData(bar: string) {
    this.selectedTab = bar;
  }
  WalletPayload() {
    return {
      customerId: Number(localStorage.getItem('customerId')),
      pageNumber: this.currentPage,
      pageSize: 10,
      searchText: this.currentSearchTerm || '',
      startDate: this.startDate || '',
      endDate: this.endDate || '',
    };
  }
  getWalletBalance(pageNumber: number = 1, searchText: string = '') {
    this.loaderService.show();
    const CustomerID = localStorage.getItem('customerId');
    // let payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=${pageNumber}&PageSize=${10}`;
    let payload = this.WalletPayload();

    // if (searchText.trim()) {
    //   payload += `&SearchText=${encodeURIComponent(searchText.trim())}`;
    // }

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

            // Combine and transform creditWallets and debitWallets
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

            // Combine and sort by time in descending order
            const newTransactions = [
              ...creditTransactions,
              ...debitTransactions,
            ].sort(
              (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
            );

            // Reset transactions for new search or append for pagination
            if (pageNumber === 1) {
              this.transactions = newTransactions;
            } else {
              this.transactions = [...this.transactions, ...newTransactions];
            }

            // Update withdraw pending flag
            const isAnyTransactionPending = this.transactions.some(
              (transaction) =>
                transaction.source == 'Withdraw' &&
                transaction.status === 'Pending',
            );
            this.utilsService.setWithdrawPending(isAnyTransactionPending);

            this.loaderService.hide();
          } else {
            // console.log('Data fetch failed', response);
            // this.loaderService.hide();
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          // console.error('Data fetch error', error);
          // this.loaderService.hide();
          this.handleError.handleHttpError(error);
        },
      );
  }

  updateBalance(newBalance: number): void {
    this.GameService.balance = newBalance;
  }

  get filteredTransactions() {
    let allTransactions = this.transactions;

    // Filter by dropdown selection only
    switch (this.selectedFilter) {
      case 'Credited': // ✅ Changed from 'Credit'
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'credit',
        );
        break;
      case 'Debited': // ✅ Changed from 'Debit'
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'debit',
        );
        break;
      case 'All Transactions': // ✅ Changed from 'All'
      default:
        // Show all transactions
        break;
    }

    return allTransactions;
  }

  // Search method to handle search button click
  performSearch() {
    this.currentSearchTerm = this.searchControl;
    this.currentPage = 1; // Reset to first page for new search
    this.getWalletBalance(1, this.currentSearchTerm);
  }

  // Handle search input changes
  onSearchInputChange(event: any) {
    // Only handle if it's not the Enter key (Enter key is handled separately)
    if (event.key !== 'Enter') {
      // If search input is empty, automatically show all data
      if (!this.searchControl || this.searchControl.trim() === '') {
        this.clearSearch();
        this.closeFilter();
      }
    }
  }

  // Clear search and reset to show all transactions
  clearSearch() {
    this.searchControl = '';
    this.currentSearchTerm = '';
    this.currentPage = 1;
    this.getWalletBalance(1, '');
  }

  ngOnInit() {
    this.getWalletBalance();
    // Listen for query param to auto-open withdraw modal (header triggers navigation with ?openWithdraw=1)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params && params['openWithdraw']) {
          this.showwithdrawModal = true;
          this.getAccountsDropdown();
          this.selectedAccountType = '';
          this.amouttowithdraw = null;
          this.tipAmount = null;
          this.accountInfo = '';
          this.Customertag = '';
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
    // this.showModal = true;
    // this.showcard=true;
    // this.paymentForm.reset();
    // this.showcashApp=false;
    // this.cashappForm.reset();
    // this.getAccountsDropdown();
    // this.isAcountDropDownSelected = true;
    // this.newBalance = 0;
    // this.selectedAccount = 'Manual';
    // this.selectedAccounttitle = '';
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

  getCustomerID(): number | null {
    return Number(localStorage.getItem('customerId'));
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getUsername(): string | null {
    return localStorage.getItem('userName');
  }
  addBalance() {
    if (this.newBalance > 0 && this.newBalance >= 5 && this.newBalance <= 300) {
      if (this.isShowManualEntry) {
        this.addWalletRequest();
      } else {
        // window.open(
        //   `http://5.189.131.230:8079/?amount=${
        //     this.newBalance
        //   }&userid=${this.getCustomerID()}&token=${this.getToken()}`,
        //   '_blank'
        // );

        this.loaderService.show();
        // const posturl = `Wallet/CreateWhopPayment?Payment=${
        //   this.newBalance
        // }&JToken=${this.getToken()}`;

        // // Open a new blank tab immediately to prevent browser pop-up blockers
        // const newTab = window.open('', '_blank');

        // this.apiCallService.PostCallWithToken(null, posturl).subscribe({
        //   next: (response) => {
        //     if (response && response.responseCode === 200) {
        //       this.toastr.success(response.responseMessage, 'Success');
        //       if (newTab) {
        //         newTab.location.href = response.data.purchaseURL; // Redirect the blank tab
        //       } else {
        //         window.open(response.data.purchaseURL, '_blank'); // Fallback in case tab is blocked
        //       }
        //     } else {
        //       this.handleError.handleResponseError(response);
        //       if (newTab) newTab.close(); // Close the tab if API fails
        //     }
        //     this.loaderService.hide();
        //     this.hideWalletModal();
        //   },
        //   error: (error) => {
        //     this.handleError.handleHttpError(error);
        //     if (newTab) newTab.close(); // Close the tab on error
        //     this.loaderService.hide();
        //     this.hideWalletModal();
        //   },
        // });

        // coral payment
        const apiurl = `Wallet/CreateCoralPayment?Payment=${this.newBalance
          }&Username=${this.getUsername()}`;

        // Open a new blank tab immediately to prevent browser pop-up blockers
        const newTab = window.open('', '_blank');

        this.apiCallService.GetCallWithToken(apiurl).subscribe({
          next: (response) => {
            if (response && response.responseCode === 200) {
              this.toastr.success(response.responseMessage, 'Success');
              if (newTab) {
                newTab.location.href = response.data.purchaseURL; // Redirect the blank tab
              } else {
                window.open(response.data.purchaseURL, '_blank'); // Fallback in case tab is blocked
              }
            } else {
              this.handleError.handleResponseError(response);
              if (newTab) newTab.close(); // Close the tab if API fails
            }
            this.loaderService.hide();
            this.hideWalletModal();
          },
          error: (error) => {
            this.handleError.handleHttpError(error);
            if (newTab) newTab.close(); // Close the tab on error
            this.loaderService.hide();
            this.hideWalletModal();
          },
        });
      }
    } else {
      this.toastr.info('Amount must be within 5 to 300', 'Invalid Amount');
    }
  }
  showBalance: boolean = false;

  addWalletRequestPayload() {
    return {
      customerId: this.getCustomerID(),
      balance: this.newBalance || 0,
      type: 'Credit',
      status: 'Pending',
      source: this.selectedAccount || '',
      accountTitle: this.selectedAccounttitle || '',
      imageUrl: this.uploadProfileImage || '',
    };
  }
  addWalletRequest() {
    const payload = this.addWalletRequestPayload();
    if (
      payload.imageUrl != '' &&
      payload.source != '' &&
      payload.accountTitle != ''
    ) {
      this.loaderService.show();
      this.apiCallService
        .PostCallWithToken(payload, 'Wallet/CreateWalletPaymentRequest')
        .subscribe({
          next: (response) => {
            if (response && response.responseCode === 200) {
              this.toastr.success(response.responseMessage, 'Success');
              this.getWalletBalance();
              this.loaderService.hide();
              this.hideWalletModal();
            } else {
              this.handleError.handleResponseError(response);
              // this.loaderService.hide();
              this.hideWalletModal();
            }
          },
          error: (error) => {
            this.handleError.handleHttpError(error);
            // this.loaderService.hide();
            this.hideWalletModal();
          },
        });
    } else {
      this.toastr.info(
        'Please Select Account Details and Upload image',
        'Validation',
      );
    }
  }

  toggleBalance() {
    this.showBalance = !this.showBalance; // Toggle the visibility state
    const balanceElement = document.getElementById('balance');
    balanceElement!.textContent = this.showBalance
      ? `$${this.totalBalance.toLocaleString()}`
      : '•••••';
  }

  // filter section

  viewMode: 'grid' | 'table' = 'grid';

  toggleView() {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  // filter section

  currentPage: number = 1;
  isLoadingMore: boolean = false;

  // TS Code for Pagination Start
  // pages: (number | string)[] = [];

  // totalRecords: number = 0;
  // itemsPerPage: number = 10;
  // maxVisiblePages: number = 1;

  // calculatePages(): void {
  //   const totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
  //   this.pages = [];
  //   if (totalPages <= this.maxVisiblePages) {
  //     this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  //   } else {
  //     const startPage = Math.max(
  //       this.currentPage - Math.floor(this.maxVisiblePages / 2),
  //       1
  //     );
  //     const endPage = Math.min(
  //       startPage + this.maxVisiblePages - 1,
  //       totalPages
  //     );

  //     if (startPage > 1) {
  //       this.pages.push(1);
  //       if (startPage > 2) {
  //         this.pages.push('...');
  //       }
  //     }

  //     for (let i = startPage; i <= endPage; i++) {
  //       this.pages.push(i);
  //     }

  //     if (endPage < totalPages) {
  //       if (endPage < totalPages - 1) {
  //         this.pages.push('...');
  //       }
  //       this.pages.push(totalPages);
  //     }
  //   }
  // }

  // navigateToPage(page: any): void {
  //   if (
  //     (page >= 1 && page <= this.pages.length) ||
  //     (page >= 1 && page >= this.pages.length)
  //   ) {
  //     this.currentPage = page;
  //     this.filteredTransactions;
  //   }
  // }

  // navigatePage(direction: 'prev' | 'next'): void {
  //   if (direction === 'prev' && this.currentPage > 1) {
  //     this.currentPage--;
  //   } else if (
  //     direction === 'next' &&
  //     this.currentPage < Math.ceil(this.totalRecords / this.itemsPerPage)
  //   ) {
  //     this.currentPage++;
  //   }
  //   this.filteredTransactions;
  // }

  // getDisplayRange(): string {
  //   const start = (this.currentPage - 1) * this.itemsPerPage + 1;
  //   const end = Math.min(start + this.itemsPerPage - 1, this.totalRecords);
  //   return `${start} – ${end}`;
  // }
  // TS Code for Pagination End
  isAccountSelected: boolean = false;
  isShowManualEntry: boolean = true;
  isAcountDropDownSelected: boolean = false;
  onAccountChange(selectedValue: any): void {
    this.isAcountDropDownSelected = true;
    this.selectedAccounttitle = '';
    this.selectedAccount = selectedValue?.name || '';
    this.accountsTitle = selectedValue?.accounts || [];
    this.isAccountSelected = true;
    // if (selectedValue === 'Chime') {
    //   this.accountsTitle = this.ChimeAccounts;
    // } else if (selectedValue === 'CashApp') {
    //   this.accountsTitle = this.CashtagAccounts;
    // } else if (selectedValue === 'Zelle') {
    //   this.accountsTitle = this.ZelleAccounts;
    // }
  }
  onAccountTypesChange(selectedValue: string): void {
    this.isAcountDropDownSelected = false;
    this.selectedAccountType = selectedValue;

    // if (selectedValue === 'Chime') {
    //   this.accountsTitle = this.ChimeAccounts;
    // } else if (selectedValue === 'CashApp') {
    //   this.accountsTitle = this.CashtagAccounts;
    // } else if (selectedValue === 'Zelle') {
    //   this.accountsTitle = this.ZelleAccounts;
    // }
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
    // this.onAccountChange(name);
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
  // async onFileSelected(event: Event) {
  //   const file = (event.target as HTMLInputElement)?.files?.[0];

  //   if (file) {
  //     try {
  //       //? Show loader while processing
  //       this.loaderService.show();

  //       //? Convert the file to a base64 string
  //       const base64Image = await this.convertFileToBase64(file);

  //       //? Create the API payload
  //       const payload: any = {
  //         base64Image: base64Image,
  //       };
  //       this.uploadProfileImage = base64Image;
  //       this.loaderService.hide();
  //     } catch { }
  //   }
  // }
  // private convertFileToBase64(file: File): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.onload = () => resolve(reader.result as string);
  //     reader.onerror = (error) => reject(error);
  //     reader.readAsDataURL(file);
  //   });
  // }
  
async onFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement)?.files?.[0];

  if (file) {
    try {
      this.loaderService.show();

      const base64Image = await this.convertFileToBase64(file);

      const payload: any = {
        base64Image: base64Image,
      };

      this.uploadProfileImage = base64Image;
      // this.withdrawImage = base64Image;

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
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Keep original dimensions
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        // Compress quality (0.1 - 1)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

        // Logs
        console.log(
          'Original Size:',
          (file.size / 1024).toFixed(2),
          'KB'
        );

        const byteString = atob(compressedBase64.split(',')[1]);

        console.log(
          'Compressed Size:',
          (byteString.length / 1024).toFixed(2),
          'KB'
        );

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
    // this.isShowManualEntry = false;
    this.uploadProfileImage = '';
    this.selectedAccount = '';
    this.selectedAccounttitle = '';
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

  amouttowithdraw: number | null = null;
  tipAmount: number | null = null;
  serverFees: number = 0;
  accountInfo: string = '';

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
    const totalRequestedAmount = withdrawAmount + tipAmount;

    // if (withdrawAmount > this.totalBalance) {
    //   this.toastr.error(
    //     'Withdraw amount + tip cannot be greater than available balance.',
    //     'Insufficient Balance',
    //   );
    //   return;
    // }
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

    const payload: any = {
      customerId: Number(localStorage.getItem('customerId')),
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

    const payload: any = {
      customerId: Number(localStorage.getItem('customerId')),
      balance: withdrawAmount,
      tip: tipAmount,
      source: this.selectedAccountType,
      accountTitle: this.accountInfo,
      requestType: 'Withdraw',
      accountInfo: this.Customertag,
    };

    // if (this.editingTransactionId) {
    payload.requestId = this.editingTransactionId;
    // }

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

  // Authorize.Net Payment Integration Start
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
      // These come from Authorize.Net merchant account (client key + login ID)
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
      if (!(window as any).Accept) {
        console.error('Authorize.Net Accept.js library not loaded.');
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
            // this.opaquePayload = { opaqueData: response.opaqueData };
            this.opaquePayload = {
              customerId: Number(localStorage.getItem('customerId')),
              amount: this.paymentForm.value.amount,
              source: 'Card',
              opaqueData: {
                dataDescriptor: response.opaqueData.dataDescriptor,
                dataValue: response.opaqueData.dataValue,
              },
            };

            console.log('Payment nonce (opaqueData):', this.opaquePayload);
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
  // Authorize.Net Payment Integration End

  // Cash aApp Payment Integration Start
  getCustomerId(): string | null {
    return localStorage.getItem('customerId');
  }
  paycashApp() {
    this.loaderService.show();

    if (this.cashappForm.invalid) {
      this.cashappForm.markAllAsTouched();
      this.loaderService.hide();
      return;
    }
    // Open a new blank tab immediately to prevent browser pop-up blockers
    const newTab = window.open('', '_blank');
    // const amount = this.cashappForm.get('amount')?.value;
    const amount = this.cashappForm.get('amount')?.value * 100;
    const customerId = this.getCustomerId();
    const posturl = `PaymentIntent/CreatePaymentIntent?amount=${amount}&CustomerId=${customerId}`;

    this.apiCallService.PostCallWithToken(null, posturl).subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.toastr.success(response.responseMessage, 'Success');
          if (newTab) {
            newTab.location.href = response.data.mobile_auth_url; // Redirect the blank tab
          } else {
            window.open(response.data.mobile_auth_url, '_blank'); // Fallback in case tab is blocked
          }
        } else {
          this.handleError.handleResponseError(response);
          if (newTab) newTab.close(); // Close the tab if API fails
        }
        this.loaderService.hide();
        this.hideWalletModal();
      },
      error: (error) => {
        this.handleError.handleHttpError(error);
        if (newTab) newTab.close(); // Close the tab on error
        this.loaderService.hide();
        this.hideWalletModal();
      },
    });
  }

  // Cash aApp Payment Integration end

  // toogles payment buttons

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

    // // Mapping back based on create payload format
    // this.accountInfo = transaction.accountTitle || '';
    // this.Customertag = transaction.accountInfo || '';
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

  ///////// Format amount with commas and 2 decimal places

  onAmountInput(event: any) {
    let value = event.target.value;

    // Allow only numbers and decimal
    value = value.replace(/[^0-9.]/g, '');

    // Prevent multiple dots
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts[1];
    }

    // Limit to 2 decimal places
    if (parts[1]) {
      parts[1] = parts[1].substring(0, 2);
      value = parts[0] + '.' + parts[1];
    }

    this.amouttowithdraw = value;
  }
}
