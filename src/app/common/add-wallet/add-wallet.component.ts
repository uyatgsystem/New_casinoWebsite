import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
  input,
  Input,
  signal,
} from '@angular/core';
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
import { CommonModule } from '@angular/common';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { GameService } from '../../Services/game.service';
import { UtilsService } from '../../Services/utils.service';
import { LocalTimePipe } from '../../Pipes/local-time.pipe';

import {
  faCheck,
  faCircleInfo,
  faEye,
  faEyeSlash,
  faSackDollar,
  faSurprise,
} from '@fortawesome/free-solid-svg-icons';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { paymentTypes } from '../../constants/PaymentTypes';
import { debug } from 'console';
import { KycPopupComponent } from '../kyc-popup/kyc-popup.component';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-add-wallet',
  imports: [
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    LoaderComponent,
    FontAwesomeModule,
    KycPopupComponent,
  ],
  templateUrl: './add-wallet.component.html',
  styleUrl: './add-wallet.component.scss',
})
export class AddWalletComponent implements OnInit, AfterViewInit {
  infoIcon = faCircleInfo;
  surpriseIcon = faSurprise;
  sackDollarIcon = faSackDollar;
  faCheck = faCheck;
  minAmount = '';
  maxAmount = '';
  showDateFilter: boolean = false;
  startDate: string | null = null;
  endDate: string | null = null;
  paymentForm: FormGroup;
  cashappForm: FormGroup;
  showKycPopup: boolean = false;
  grainBackdrop: SafeHtml = '';
  isWithdrawPending: boolean = false;
  showCashAppTapTap: boolean = false;
  constructor(
    private apiCallService: ApiCallService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private handleError: ErrorhandlingService,
    private GameService: GameService,
    private utilsService: UtilsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
  ) {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.paymentForm = this.fb.group({
      cardNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{13,16}$/), // 13-16 digits only, no hyphens
        ],
      ],
      month: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(0[1-9]|1[0-2])$/), // 01–12 ONLY
        ],
      ],
      year: [
        '',
        [
          Validators.required,
          Validators.pattern(/^\d{4}$/), // exactly 4 digits
        ],
      ],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
      amount: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
    });

    this.cashappForm = this.fb.group({
      amount: [
        '',
        [
          Validators.required,
          Validators.min(1),
          Validators.pattern(/^\d+(\.\d{1,2})?$/),
        ],
      ],
    });
  }

  qrCodeImage: string = '';
  onAmountInput(event: Event, target: 'payment' | 'cashapp' | 'manual' | 'googlepay') {
    const input = event.target as HTMLInputElement;
    const currentCursorPosition = input.selectionStart ?? input.value.length;
    const sanitizedValue = this.limitToTwoDecimals(input.value);

    if (input.value !== sanitizedValue) {
      input.value = sanitizedValue;
      const nextCursorPosition = Math.max(0, currentCursorPosition - 1);
      requestAnimationFrame(() => {
        input.setSelectionRange(nextCursorPosition, nextCursorPosition);
      });
    }

    if (target === 'payment') {
      this.paymentForm.get('amount')?.setValue(sanitizedValue, {
        emitEvent: false,
      });
      return;
    }

    if (target === 'cashapp') {
      this.cashappForm.get('amount')?.setValue(sanitizedValue, {
        emitEvent: false,
      });
      return;
    }

    if (target === 'googlepay') {
      this.googleApplePayAmount = sanitizedValue;
      this.newBalance = sanitizedValue === '' || sanitizedValue === '.' ? 0 : Number(sanitizedValue);
      return;
    }

    this.manualAmount = sanitizedValue;

    if (
      sanitizedValue === '' ||
      sanitizedValue === '.' ||
      sanitizedValue.endsWith('.')
    ) {
      this.newBalance = 0;
      return;
    }

    this.newBalance = Number(sanitizedValue);
  }

  quickDepositAmounts: number[] = [10, 25, 50, 100, 200];

  selectQuickAmount(amount: number): void {
    const str = amount.toString();
    this.manualAmount = str;
    this.newBalance = amount;
    this.googleApplePayAmount = str;
    this.paymentForm.get('amount')?.setValue(str);
    this.cashappForm.get('amount')?.setValue(str);
  }

  private limitToTwoDecimals(value: string): string {
    const cleanedValue = value.replace(/[^0-9.]/g, '');

    const parts = cleanedValue.split('.');
    const integerPart = parts[0] ?? '';
    const decimalPart = parts.slice(1).join('').slice(0, 2);

    if (parts.length > 1) {
      return `${integerPart}.${decimalPart}`;
    }

    return integerPart;
  }

  onCardNumberInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    let cleanedValue = input.value.replace(/[^0-9]/g, '');

    //  limit to 16 digits
    if (cleanedValue.length > 16) {
      cleanedValue = cleanedValue.slice(0, 16);
    }

    if (input.value !== cleanedValue) {
      input.value = cleanedValue;
    }

    this.paymentForm.get('cardNumber')?.setValue(cleanedValue, {
      emitEvent: false,
    });
  }
  onMonthInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    let value = input.value.replace(/\D/g, '');

    // limit to 2 digits
    value = value.substring(0, 2);

    // restrict between 01–12
    if (value.length === 2) {
      const num = parseInt(value, 10);
      if (num < 1) value = '01';
      if (num > 12) value = '12';
    }

    input.value = value;
    this.paymentForm.get('month')?.setValue(value, { emitEvent: false });
  }

  onYearInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    let value = input.value.replace(/\D/g, '');

    // limit to 4 digits
    value = value.substring(0, 4);

    input.value = value;
    this.paymentForm.get('year')?.setValue(value, { emitEvent: false });
  }

  blockInvalidPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pasted)) {
      event.preventDefault();
    }
  }
  private destroy$ = new Subject<void>();
  ngAfterViewInit() {
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Kyc Popup Close on Action and Close buttons

  showKycAction: boolean = true;
  closeKycPopup(hideWallet: boolean = false) {
    this.showKycPopup = false;
    if (hideWallet) {
      this.hideWalletModal();
    }
    this.showKycAction = false;
  }

  @ViewChild('transactionTable', { static: false })
  transactionTable!: ElementRef;

  currentSearchTerm: string = '';

  onScroll(): void {
    const element = this.transactionTable.nativeElement;
    if (element.offsetHeight + element.scrollTop + 1 >= element.scrollHeight) {
      this.currentPage++;

      this.getWalletBalance(this.currentPage, this.currentSearchTerm);
    }
  }

  onMobileScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.currentPage++;

      this.getWalletBalance(this.currentPage, this.currentSearchTerm);
    }
  }

  onScrollTop(): void { }

  onScrollBottom(): void { }

  dropdownOpen = false;
  selectedFilter = 'All Redeem';

  selectFilter(filter: string, event: Event) {
    event.preventDefault();
    this.selectedFilter = filter;
    this.dropdownOpen = false;

    console.log('Filter selected:', filter);
  }

  public totalBalance = 0;

  get privateValue(): number {
    return this.totalBalance;
  }
  transactions: any[] = [];
  Debittransactions: any[] = [];
  selectedTab: string = 'credit';
  searchControl: string = '';
  @Input() showModal = false;
  showwithdrawModal = false;
  newBalance = 0;
  manualAmount = '';
  googleApplePayAmount = '';

  showicon = faEye;
  hideicon = faEyeSlash;

  toggleData(bar: string) {
    this.selectedTab = bar;
  }

  WalletPayload() {
    return {
      customerId: localStorage.getItem('customerId') || '',
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

            if (pageNumber === 1) {
              this.transactions = newTransactions;
            } else {
              this.transactions = [...this.transactions, ...newTransactions];
            }

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
      case 'All Redeem':
      default:
        break;
    }

    return allTransactions;
  }

  performSearch() {
    this.currentSearchTerm = this.searchControl;
    this.currentPage = 1; //
    this.getWalletBalance(1, this.currentSearchTerm);
  }

  onSearchInputChange(event: any) {
    if (event.key !== 'Enter') {
      if (!this.searchControl || this.searchControl.trim() === '') {
        this.clearSearch();
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
    this.utilsService.isWithdrawPending$.subscribe((pending) => {
      this.isWithdrawPending = pending;
    });
    // this.openAddBalanceModal();
    this.getActivePaymentMethods();
  }

  openAddBalanceModal() {
    this.showModal = true;
    this.showcard = true;
    this.paymentForm.reset();
    this.showcashApp = false;
    this.showChimeZelle = false;
    this.cashappForm.reset();
    this.getAccountsDropdown();
    this.newBalance = 0;
    this.manualAmount = '';
    this.selectedAccount = 'Manual';
    this.selectedAccounttitle = '';
    this.selectedAccountType = 'Card';
    this.touchedAmount = false;
  }

  getCustomerID(): string | null {
    return localStorage.getItem('customerId');
  }
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  getUsername(): string | null {
    return localStorage.getItem('userName');
  }
  getMinimumDepositAmount(): number {
    const percentageMin = Math.round(this.totalBalance * 0.05 * 100) / 100;
    return Math.max(5, percentageMin);
  }

  addBalance() {
    if (!this.touchedAmount) {
      this.touchedAmount = true;
    }

    if (
      this.selectedAccountType === 'GooglePay' ||
      this.selectedAccountType === 'ApplePay' ||
      this.selectedAccountType === 'Paypal'
    ) {
      this.AddAppleGoogleCashApp2Pay();
      return;
    }

    const minimumDeposit = this.getMinimumDepositAmount();
    if (
      this.newBalance > 0 &&
      this.newBalance >= minimumDeposit &&
      this.newBalance <= 300
    ) {
      if (this.isShowManualEntry) {
        this.addWalletRequest();
      } else {
        this.loaderService.show();

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
      const minimumDeposit = this.getMinimumDepositAmount();
      this.toastr.info(
        `Minimum deposit is $${minimumDeposit.toFixed(2)} & maximum is $100.`,
        'Invalid Amount',
      );
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
      accountInfo: this.CustomerTag || '',
      email: this.email
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

  // filter section

  currentPage: number = 1;

  // TS Code for Pagination End
  isAccountSelected: boolean = false;
  isShowManualEntry: boolean = true;
  onAccountChange(selectedValue: any): void {
    this.selectedAccounttitle = '';
    this.isAccountSelected = true;
  }
  onAccountTypesChange(selectedValue: string): void {
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

  selectedAccountType: string = '';
  selectedAccounttitle: string = '';
  PaypalAccounts: any;
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
            this.PaypalAccounts =
              response.data.cashApp.length > 0
                ? response.data.payalApp
                : [{ accountDetail: 'No data found' }];
            this.ZelleAccounts =
              response.data.zelle.length > 0
                ? response.data.zelle
                : [{ accountDetail: 'No data found' }];
          } else {
            // this.handleError.handleResponseError(response);
            // this.hideWalletModal();

            this.ChimeAccounts = [{ accountDetail: 'No data found' }];
            this.PaypalAccounts = [{ accountDetail: 'No data found' }];
            this.ZelleAccounts = [{ accountDetail: 'No data found' }];
          }
        },
        error: (error) => {
          // this.handleError.handleHttpError(error);
          // this.hideWalletModal();
        },
      });
  }

  touchedAmount = false;
  AccountType: any = [
    // {
    //   id: 3,
    //   name: 'Card',
    //   bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/master.png',
    // },
    // {
    //   id: 1,
    //   name: 'CashApp',
    //   bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/cashapp.png',
    // },
    // {
    //   id: 2,
    //   name: 'Chime',
    //   bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/chime.png',
    // },
    // {
    //   id: 3,
    //   name: 'Zelle',
    //   bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/zelle.png',
    // },
    // {
    //   id: 3,
    //   name: 'Paypal',
    //   bg_image: 'https://cmaxv2images2.pages.dev/assets/icons/payments/paypal.svg',
    // },
  ];

  // Only show active payment methods — "Coming Soon" placeholders are hidden entirely.
  get visibleAccountTypes(): any[] {
    return this.AccountType.filter((a: any) => a.isActive);
  }

  getActivePaymentMethods() {
    this.loaderService.show();
    this.apiCallService
      .GetCallWithToken('PaymentMethod/GetAllActivePaymentMethods')
      .subscribe(
        (res) => {
          if (res && res.responseCode == 200) {
            this.AccountType = res.data.map((accType: any) => {
              const matchedType = this.getAccount(accType);
              return {
                id: accType.Id,
                name: matchedType?.name,
                isActive: accType.IsActive,
                Bonus: accType.Bonus,
                bg_image: matchedType?.bg_image,
                kycStatus: accType.kycStatus,
                minDeposit: accType.MinDeposit,
                maxDeposit: accType.MaxDeposit,
              };
            });
            this.loadFirstPaymentMethod();
            console.log('Active Payment Methods:', this.AccountType);
          } else {
            this.AccountType = [];
            this.handleError.handleResponseError(res);
          }
          this.loaderService.hide();
        },
        (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }

  getAccount(acc: any) {
    const types = paymentTypes;
    const match = Object.values(types).find(
      (type: any) => type.ApiName.toLowerCase() === acc.Value.toLowerCase(),
    );
    return match;
  }

  loadFirstPaymentMethod() {
    const FirstMethod = this.AccountType[0];
    this.selectedAccountType = FirstMethod.name;
    this.togglePayment(
      FirstMethod.name,
      FirstMethod.isActive,
      FirstMethod.kycStatus,
      undefined,
      FirstMethod,
    );
  }
  accountsTitle: any;
  accountTitleDropdownOpen = false;
  accountTitleSearchTerm = '';
  showPayPalFields: boolean = false;
  payPalDetails: any;
  CustomerTag: any = '';

  get filteredAccountTitles() {
    if (!this.accountsTitle || this.accountsTitle.length === 0) {
      return [];
    }

    if (!this.accountTitleSearchTerm) {
      return this.accountsTitle;
    }

    return this.accountsTitle.filter((account: any) =>
      account.AccountTitle?.toLowerCase().includes(
        this.accountTitleSearchTerm.toLowerCase(),
      ),
    );
  }

  selectAccountTitle(accountDetail: any) {

    this.selectedAccounttitle = accountDetail.AccountTitle;
    this.accountTitleDropdownOpen = false;
    this.accountTitleSearchTerm = '';
    this.qrCodeImage = '';

    if (this.selectedAccountType == 'Paypal') {
      this.showPayPalFields = true;
      this.payPalDetails = accountDetail;
      this.CustomerTag = accountDetail?.AccountNumber; // reset
      this.qrCodeImage = accountDetail.ImageUrl;
    } else if (this.selectedAccountType == 'Chime') {
      this.CustomerTag =
        accountDetail.CustomerTag ||
        accountDetail.customerTag ||
        accountDetail.accountDetail ||
        accountDetail?.AccountNumber ||
        '';

      this.qrCodeImage = accountDetail.ImageUrl;
      this.showPayPalFields = false;
      this.payPalDetails = null;
    } else if (this.selectedAccountType == 'Zelle') {
      this.CustomerTag =
        accountDetail.CustomerTag ||
        accountDetail.accountDetail ||
        accountDetail?.AccountNumber ||
        '';

      this.qrCodeImage = accountDetail.ImageUrl;
      this.showPayPalFields = false;
      this.payPalDetails = null;

    } else if (this.selectedAccountType == 'Venmo') {
      this.CustomerTag =
        accountDetail.CustomerTag ||
        accountDetail.accountDetail ||
        accountDetail?.AccountNumber ||
        '';

      this.qrCodeImage = accountDetail.ImageUrl;
      this.showPayPalFields = false;
      this.payPalDetails = null;
    } else {
      this.CustomerTag = '';
      this.showPayPalFields = false;
      this.payPalDetails = null;
      this.qrCodeImage = accountDetail.ImageUrl;
    }
  }
  onAccountSearchClick(event: Event) {
    event.stopPropagation();
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

        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);

        // LOGS HERE
        console.log(
          'Original Size:',
          (file.size / 1024).toFixed(2),
          'KB'
        );

        console.log(
          'Compressed Size:',
          ((compressedBase64.length * 3) / 4 / 1024).toFixed(2),
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
    this.handleError.showModalSubject.next(false);
    // this.isShowManualEntry = false;
    this.uploadProfileImage = '';
    this.selectedAccount = '';
    this.selectedAccounttitle = '';
  }

  accountTypeDropdownOpen = false;
  sourceAccount: string = '';
  isAccountTypeSelected: boolean = false;

  selectAccountType(name: string, event: Event) {
    event.stopPropagation();
    this.sourceAccount = name;
    this.accountTypeDropdownOpen = false;
    this.onAccountTypeChange({ target: { value: name } } as any);
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

  amouttowithdraw: number = 0;
  accountInfo: string = '';

  // Authorize.Net Payment Integration Start
  payCard() {
    this.loaderService.show();
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.loaderService.hide();
      return;
    }
    const minimumDeposit = this.getMinimumDepositAmount();
    const cardAmount = this.paymentForm.value.amount;
    if (cardAmount < minimumDeposit || cardAmount > 100) {
      this.toastr.info(
        `Minimum deposit is $${minimumDeposit.toFixed(2)} & maximum is $100.`,
        'Invalid Amount',
      );
      this.loaderService.hide();
      return;
    }
    const apiurl = `CashAppPayment/GetAuthorizeAccountInfo?Amount=${this.paymentForm.value.amount}&Source=AuthorizeNet`;
    this.apiCallService.GetCallWithToken(apiurl).subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.loaderService.hide();
          this.pay(
            response.data.clientKey,
            response.data.apiLoginID,
            response.data.id,
          );
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
  async pay(clientKey?: string, apiLoginID?: string, accountid?: number) {
    this.loaderService.show();
    // if (this.paymentForm.invalid) {
    //   this.paymentForm.markAllAsTouched();
    //   this.loaderService.hide();
    //   return;
    // }

    try {
      const formValue = this.paymentForm.value;
      const cardData = {
        cardNumber: formValue.cardNumber.toString(),
        month: formValue.month.toString(),
        year: formValue.year.toString().slice(-2),
        cardCode: formValue.cvv.toString(),
      };
      // These come from Authorize.Net merchant account (client key + login ID)
      // const authData = {
      //   clientKey: '8CRkkTs9N2M69SY6p6XMen7mk5xKP4khDmVwu2jTun93F3rK7VTqyq3kGZybTBC9',
      //   apiLoginID: '2aUJ4fF7U'
      // };
      const authData = {
        clientKey: clientKey,
        apiLoginID: apiLoginID,
      };

      const opaqueData = await this.getPaymentNonce(
        cardData,
        authData,
        accountid,
      );
      // console.log('Opaque Data Genrated:', opaqueData);
    } catch (err) {
      console.error('Error generating token:', err);
      this.loaderService.hide();
    }
  }

  opaquePayload: any;
  getPaymentNonce(cardData: any, authData: any, accountid: any): Promise<any> {
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
              customerId: localStorage.getItem('customerId') || '',
              amount: this.paymentForm.value.amount,
              source: 'AuthorizeNet',
              accountId: accountid,
              opaqueData: {
                dataDescriptor: response.opaqueData.dataDescriptor,
                dataValue: response.opaqueData.dataValue,
              },
            };

            // console.log('Payment nonce (opaqueData):', this.opaquePayload);
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
    const minimumDeposit = this.getMinimumDepositAmount();
    const cashappAmount = this.cashappForm.get('amount')?.value;
    if (cashappAmount < minimumDeposit || cashappAmount > 100) {
      this.toastr.info(
        `Minimum deposit is $${minimumDeposit.toFixed(2)} & maximum is $100.`,
        'Invalid Amount',
      );
      this.loaderService.hide();
      return;
    }
    // Open a new blank tab immediately to prevent browser pop-up blockers
    const newTab = window.open('', '_blank');
    // const amount = this.cashappForm.get('amount')?.value;
    const amount = this.cashappForm.get('amount')?.value * 100;
    const customerId = this.getCustomerId();
    const posturl = `PaymentIntent/CreatePaymentIntent?amount=${amount}&CustomerId=${customerId}&Source=Stripe`;

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

  // KYC for NotSubmited Popup Texts
  popupTitle = '';
  popupMessage = '';
  popupButtonText = '';
  popupRedirect: string | null = null;

  Ntitlekyc: string = 'KYC Required';
  Nmessagekyc: string = 'Please complete KYC Form for Payments.';
  Nbuttontextkyc: string = 'KYC Form';
  NredirecttoKYCform: string = '/dashboard/KYCform';
  // KYC for pending Popup Texts
  ptitlekyc: string = 'KYC Verification';
  pmessagekyc: string =
    'Your verification is currently in process. Please wait while we complete the review.';
  pbuttontextkyc: string = 'Got it';
  // KYC for declined Popup Texts
  dtitlekyc: string = 'KYC Declined';
  dmessagekyc: string =
    'Your KYC verification has been declined. Please contact support for assistance.';
  dbuttontextkyc: string = 'Close';

  // toogles payment buttons

  togglePayment(
    name: string,
    active?: boolean,
    kycCompleted?: boolean,
    event?: Event,
    paymentMethod?: any,
  ) {
    if (kycCompleted === true) {
      const kyc = localStorage.getItem('KYC');
      if (kyc === 'Pending') {
        this.popupTitle = this.ptitlekyc;
        this.popupMessage = this.pmessagekyc;
        this.popupButtonText = this.pbuttontextkyc;
        this.popupRedirect = null;
        this.showKycPopup = true;

        return;
      }
      else if (kyc === 'declined') {
        this.popupTitle = this.dtitlekyc;
        this.popupMessage = this.dmessagekyc;
        this.popupButtonText = this.dbuttontextkyc;
        this.popupRedirect = null;
        this.showKycPopup = true;
        return;
      } else if (kyc === 'Not Submitted') {
        this.popupTitle = this.Ntitlekyc;
        this.popupMessage = this.Nmessagekyc;
        this.popupButtonText = this.Nbuttontextkyc;
        this.popupRedirect = this.NredirecttoKYCform;
        this.showKycPopup = true;

        return;
      }
    }
    if (active === false) {
      return;
    } else {
      this.qrCodeImage = '';
      this.selectedAccountType = name;
      // Set min and max deposit amounts
      if (paymentMethod) {
        this.minAmount = '$' + (paymentMethod.minDeposit || 0).toFixed(2);
        this.maxAmount = '$' + (paymentMethod.maxDeposit || 0).toFixed(2);
      }
      if (event) {
        event.preventDefault();
      }
      if (name == 'Card') {
        this.showcardForm();
      } else if (name == 'CashApp') {
        this.showcashAppForm();
        this.showCashAppTapTap = false;
      } else if (name == 'Chime') {
        this.showChimeZelleForm();
        this.selectedAccount = 'Chime';
        this.loadDropDownValues();
        this.email = ''
        this.showCashAppTapTap = false;
      } else if (name == 'Zelle') {
        this.showChimeZelleForm();
        this.selectedAccount = 'Zelle';
        this.loadDropDownValues();
        this.email = ''
        this.showCashAppTapTap = false;
      } else if (name == 'Paypal') {
        this.showChimeZelleForm();
        this.newBalance = 0;
        this.email = '';
        this.selectedAccount = 'Paypal';
        this.showCashAppTapTap = false;
        this.loadDropDownValues();
      } else if (name == 'Venmo') {
        this.showChimeZelleForm();
        this.selectedAccount = 'Venmo';
        this.loadDropDownValues();
        this.email = ''
        this.showCashAppTapTap = false;
      }
      else if (name == 'GooglePay') {
        this.showChimeZelleForm();
        this.newBalance = 0;
        this.email = ''
        this.selectedAccount = 'GooglePay';
        this.showCashAppTapTap = true;
        this.loadDropDownValues();
        this.showChimeZelle = false;
        this.showcashApp = false;
        this.showcard = false;
      }
      else if (name == 'ApplePay') {
        this.showChimeZelleForm();
        this.newBalance = 0;
        this.email = ''
        this.selectedAccount = 'ApplePay';
        this.showCashAppTapTap = true;
        this.loadDropDownValues();
        this.showChimeZelle = false;
        this.showcashApp = false;
        this.showcard = false;
      }
      else if (name == 'CashApp2') {
        this.showChimeZelleForm();
        this.newBalance = 0;
        this.email = ''
        this.selectedAccount = 'CashApp2';
        this.showChimeZelle = false;
        this.showcashApp = false;
        this.showcard = false;
        this.showCashAppTapTap = true;
        this.loadDropDownValues();
      } else {
        return;
      }
    }
  }

  showcard: boolean = false;
  showcardForm() {
    this.showcard = true;
    this.showcashApp = false;
    this.showChimeZelle = false;
  }
  showcashApp: boolean = false;
  showcashAppForm() {
    this.showcashApp = true;
    this.showcard = false;
    this.showChimeZelle = false;
  }
  showChimeZelle: boolean = false;
  showChimeZelleForm() {
    this.newBalance = 0;
    this.manualAmount = '';
    this.selectedAccounttitle = '';
    this.showChimeZelle = true;
    this.showcashApp = false;
    this.showcard = false;
  }

  loadDropDownValues() {
    this.accountsTitle = [];
    const paylaod = {
      paymentName: this.selectedAccountType,
    };
    this.loaderService.show();
    this.apiCallService
      .PostCallWithToken(paylaod, 'PaymentMethod/GetManuallPaymentsAccountInfo')
      .subscribe(
        (res) => {
          if (res && res.responseCode == 200) {
            if (this.selectedAccountType == 'Paypal') {
              this.accountsTitle = res?.data?.map((acc: any) => ({
                id: acc.id,
                Value: acc.Value,
                Email: acc.Email,
                AccountTitle: acc.AccTitle || acc.AccountTitle,
                AccountNumber: acc.AccountNumber,
                Link: acc.Link,
                Bonus: acc.Bonus,
              }));
            } else {
              this.accountsTitle = res?.data;
            }
            this.loaderService.hide();
          } else {
            this.handleError.handleResponseError(res);
            this.loaderService.hide();
          }
          this.loaderService.hide();
        },
        (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }

  isCopied = signal(false);
  CopyToClipBoard(text: string) {
    navigator.clipboard.writeText(text);
    this.isCopied.set(true);
    setTimeout(() => {
      this.isCopied.set(false);
    }, 2000);
  }

  RedirectToLink(link: string) {
    window.open(link, '_blank');
  }


  // Google and Apple pay and casapp link pay

  nameMap: any = {
    ApplePay: 'ApplePay',
    GooglePay: 'G-Pay',
    CashApp2: 'CashApp'
  };

  getPaymentLink(): string {
    if (this.selectedAccountType === 'ApplePay' || this.selectedAccountType === 'GooglePay') {
      return 'https://taptapup.com/cashme/verify-studio-card';
    }
    else if (this.selectedAccountType === 'Paypal') {
      return 'https://taptapup.com/cashme/verify-studio-paytap';
    }
    return '';
  }

  email: string = '';
  amountOptions: number[] = [9.99, 14.99, 17.99, 19.99, 24.99, 29.99, 30.99, 39.99, 49.99, 59.99, 99.99];

  amountDropdownOpen = false;
  selectedAmount: number | null = null;

  selectAmount(amount: number) {
    this.selectedAmount = amount;
    this.newBalance = amount;
    this.amountDropdownOpen = false;
  }

  AddAppleGooglePayPayload() {
    return {
      customerId: this.getCustomerID(),
      balance: this.newBalance || 0,
      email: this.email || '',
      type: 'Credit',
      status: 'Pending',
      source: this.selectedAccount || '',
      accountTitle: '',
      imageUrl: this.uploadProfileImage || '',
      accountInfo: '',
    };
  }



  AddAppleGoogleCashApp2Pay() {
    const payload = this.AddAppleGooglePayPayload();
    const selectedAccountDetails = this.AccountType.find(
      (account: any) => account.name === this.selectedAccount
    );

    if (selectedAccountDetails) {
      const amount = this.newBalance || 0;
      const min = selectedAccountDetails.MinDepositLimit;
      const max = selectedAccountDetails.MaxDepositLimit;

      // 2. Perform the limit checks
      if (amount < min) {
        this.toastr.warning(`Error: Min Deposit for ${this.selectedAccount} is ${min}`, 'Invalid Amount');
        this.loaderService.hide();
        return
      }

      if (max > 0 && amount > max) {
        this.toastr.warning(`Error: Max Deposit for ${this.selectedAccount} is ${max}`, 'Invalid Amount');
        this.loaderService.hide();
        return
      }
    }

    if (payload.source === 'CashApp2') {
      payload.source = 'TapTap,CashApp';
    }
    if (payload.source === 'Card2') {
      payload.source = 'CashTap';
    }

    if (
      payload.imageUrl != '' &&
      payload.source != '' &&
      payload.email != ''
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
              this.hideWalletModal();
            }
          },
          error: (error) => {
            this.handleError.handleHttpError(error);
            this.hideWalletModal();
          },
        });
    } else {
      this.toastr.info(
        'Please Enter Amount, Upload image and Add Email',
        'Validation'
      );
    }
  }


  // CashApp TapTap Pay Api Integration


  createTapTapPayload() {
    const localEmail = localStorage.getItem('email') || '';
    const localCustomerId = localStorage.getItem('customerId') || '';

    // Logic for Source
    const source = this.selectedAccountType === 'CashApp2'
      ? 'TapTap,CashApp'
      : this.selectedAccountType;

    // Logic for Payment Provider
    let paymentProvider = "";
    const typeLower = this.selectedAccountType?.toLowerCase();

    if (typeLower === 'googlepay' || typeLower === 'applepay') {
      paymentProvider = typeLower;
    }

    return {
      amount: this.newBalance,
      source: source,
      paymentProvider: paymentProvider,
      email: localEmail,
      customerId: localCustomerId
    };
  }

  AddTapTapCashApp() {
    this.loaderService.show();
    const selectedAccountDetails = this.AccountType.find(
      (account: any) => account.name === this.selectedAccount
    );

    if (selectedAccountDetails) {
      const amount = this.newBalance || 0;
      const min = selectedAccountDetails.MinDepositLimit;
      const max = selectedAccountDetails.MaxDepositLimit;

      // 2. Perform the limit checks
      if (amount < min) {
        this.toastr.warning(`Error: Min Deposit for ${this.selectedAccount} is ${min}`, 'Invalid Amount');
        this.loaderService.hide();
        return
      }

      if (max > 0 && amount > max) {
        this.toastr.warning(`Error: Max Deposit for ${this.selectedAccount} is ${max}`, 'Invalid Amount');
        this.loaderService.hide();
        return
      }
    }
    const payload = this.createTapTapPayload();
    // Open a new blank tab immediately to prevent browser pop-up blockers
    const newTab = window.open('', '_blank');
    this.apiCallService.PostCallWithToken(payload, 'TapTapup/CreateTapTapPayment').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.toastr.success(response.responseMessage, 'Success');
          if (newTab) {
            newTab.location.href = response.data.redirect_url; // Redirect the blank tab
          } else {
            window.open(response.data.redirect_url, '_blank');
          }
        } else {
          this.handleError.handleResponseError(response);
          if (newTab) newTab.close();
        }
        this.loaderService.hide();
      },
      error: (error) => {
        this.handleError.handleHttpError(error);
        if (newTab) newTab.close();
        this.loaderService.hide();
      },
    });
  }

  showQrPopup = false;

  openQrPopup(): void {
    this.showQrPopup = true;
  }

  closeQrPopup(): void {
    this.showQrPopup = false;
  }


//   cashAppAmounts: number[] = [
//   5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 25, 30, 31, 40, 50, 60, 100, 125, 130, 150, 200, 300, 400, 500
// ];

cashAppAmounts: number[] = [
  5, 10, 15, 18, 20, 25, 30, 31, 40, 50, 60, 100, 125, 130, 150, 200, 300, 400, 500
];
// googleApplePayAmounts: number[] = [
// 4.99, 5.99, 6.99, 7.99, 8.99, 9.99, 10.99, 11.99, 12.99, 13.99, 14.99, 15.99, 17.99, 19.99, 21.99, 24.99, 29.99, 30.99, 34.99, 39.99, 41.99, 49.99, 54.99, 59.99, 69.99, 79.99, 99.99
// ];
googleApplePayAmounts: number[] = [
  5, 10, 15, 18, 20, 25, 30, 31, 40, 50, 60, 100, 125, 130, 150, 200, 300, 400, 500
];


}
