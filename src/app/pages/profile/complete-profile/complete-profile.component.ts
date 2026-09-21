import { Component, input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../Services/loader-service.service';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  faEye,
  faEyeSlash,
  faCheck,
  faTimes,
  faCrown,
  faCheckCircle,
  faLock,
  faSyncAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LocationService } from '../../../Services/ip-check.service';

import { RouterModule } from '@angular/router';
import { DocumentTypes, KycApiResponse } from '../../../Interfaces/kyc.interface';
import { KycPopupComponent } from '../../../common/kyc-popup/kyc-popup.component';

@Component({
  standalone: true,
  selector: 'app-complete-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule, RouterModule, KycPopupComponent],
  templateUrl: './complete-profile.component.html',
  styleUrls: ['./complete-profile.component.scss'],
})
export class CompleteProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Profile Image Modal
  isProfileImageModalOpen = false;

  eye = faEye;
  eyeSlash = faEyeSlash;
  checkIcon = faCheck;
  timesIcon = faTimes;
  passwordStrength = 0;
  passwordChecks = {
    length: false,
    numbers: false,
    uppercase: false,
    lowercase: false,
    special: false,
  };

  changePasswordForm: FormGroup;
  passwordVisibility: Record<string, boolean> = {
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  };

  private readonly PASSWORD_PATTERNS = {
    length: /^.{8,}$/,
    digit: /\d/,
    uppercase: /[A-Z]/,
    specialChar: /[@#$]/,
  };
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private loaderService: LoaderService,
    private apiCallService: ApiCallService,
    private handleerror: ErrorhandlingService,
    private toastr: ToastrService,
    private utilsService: UtilsService,
    private fb: FormBuilder,
    private UpdateCustomerService: LocationService,
    private elementRef: ElementRef
  ) {

    this.changePasswordForm = this.fb.group({
      oldPassword: ['', Validators.required],
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

    // Data Share Service Subscriptions

    // Load default profile data first
    this.utilsService.completeProfileData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.referralCode = data?.referralCode || 'Referral code not available';
        this.personalInfo.fullName = data?.fullName || '';
        this.personalInfo.email = data?.email || '';
      });

    // Override with KYC data if available
    this.utilsService.completekycData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (!data || !data.kycStatus) return;

        const KYCdata = data.kycStatus;
        const fullName = `${KYCdata.firstName || ''} ${KYCdata.middleName || ''} ${KYCdata.lastName || ''}`.trim();

        if (fullName.length > 0) {
          this.personalInfo.fullName = fullName;
        }
        if (KYCdata.addedBy) {
          this.personalInfo.email = KYCdata.addedBy;
        }

        // Fill other KYC fields
        this.personalInfo.phone = KYCdata.ssin || '';
        this.personalInfo.country = KYCdata.country || '';
        this.personalInfo.city = KYCdata.city || '';
        this.personalInfo.state = KYCdata.state || '';
        this.personalInfo.address = KYCdata.address || '';
        this.personalInfo.zipcode = KYCdata.zipcode || '';
        this.personalInfo.reason = KYCdata.reason || '';
      });


  }




  ngOnInit() {
    //? User Data from Local Storage
    this.email = localStorage.getItem('email') ?? '';
    this.name = localStorage.getItem('userName') ?? '';

    //? Profile Image Dynamic Update
    this.utilsService.profileImage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((image) => {
        this.profileImage = image;
      });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const tab = params['tab'];
      if (tab) {
        const lowerTab = tab.toLowerCase();
        if (lowerTab === 'kyc') {
          this.activeTab = 'kyc';
        } else if (lowerTab === 'levels') {
          this.activeTab = 'Levels';
        } else if (lowerTab === 'wallet') {
          this.activeTab = 'wallet';
        } else if (lowerTab === 'referrals') {
          this.activeTab = 'referrals';
        } else if (lowerTab === 'security') {
          this.activeTab = 'security';
        } else if (lowerTab === 'personal') {
          this.activeTab = 'personal';
        }
        setTimeout(() => this.scrollActiveTabIntoView(), 50);
      }

      const refQuery = params['ref'];
      if (refQuery?.toLowerCase() === 'active') {
        this.activeTab = 'referrals';
        setTimeout(() => this.scrollActiveTabIntoView(), 50);
      }
    });

    //? Fetch wallet history on component load
    this.getWalletBalance();

    //? Fetch KYC Verification Status
    const kycStatus = localStorage.getItem('KYC');
    this.KYCVerification = kycStatus ? kycStatus : '';

    this.getCustomerReferrals();
    this.GetCustomerLevel();
    // this.UpdateCustomerLevel();
    this.initializeKycForm();
    this.setKycDateRange();
    this.patchKycFormFromData();
  }



  KYCVerification: string | null = '';
  getKycClass() {
    const status = (this.KYCVerification || '').toLowerCase();
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'not submitted':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  }

  //* Scroll Tab Button into View on Mobile
  scrollTabIntoView(event: Event): void {
    const button = event.target as HTMLElement;

    // Only scroll on mobile — on laptop/desktop, switching tabs shouldn't jump the page.
    if (window.innerWidth > 768) {
      return;
    }

    // Scroll button into view on mobile
    if (button) {
      setTimeout(() => {
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 50);
    }

    // Scroll content section into view after tab change
    setTimeout(() => {
      const mainContent = this.elementRef.nativeElement.querySelector('.account-content');
      if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  }

  //* Same as scrollTabIntoView, but for deep-linking straight into a tab
  //* (e.g. via ?ref=active) where there's no click Event to read the button from.
  scrollActiveTabIntoView(): void {
    if (window.innerWidth > 768) {
      return;
    }

    const activeButton = this.elementRef.nativeElement.querySelector(
      '.account-nav button.active',
    ) as HTMLElement | null;
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    const mainContent = this.elementRef.nativeElement.querySelector('.account-content');
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }



  // * User Profile Data
  receivedData: any;
  email: string = '';
  name: string = '';
  profileImage: string = '';
  activeTab: 'personal' | 'security' | 'wallet' | 'referrals' | 'Levels' | 'kyc' = 'personal';
  walletBalance: number = 0.00;
  userLevel: number = 16;
  referralCode: string = '';

  // * Personal Info Form
  personalInfo = {
    fullName: '',
    email: '',
    phone: '',
    country: '',
    zipcode: '',
    state: '',
    city: '',
    address: '',
    reason: '',
  };

  // * Game Statistics
  gameStats = {
    totalWins: 215,
    totalSpins: 3450,
    rewardsEarned: 975.00
  };

  // * Transactions List
  transactions: any[] = [];
  currentPage: number = 1;
  currentSearchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  selectedFilter: string = 'All';
  walletView: 'all' | 'deposits' | 'withdrawals' = 'all';
  isLoadingMore: boolean = false;
  hasMorePages: boolean = true;





  //* Router navigation function
  changeRoute(path: string) {
    this.router.navigate([path]);
  }




  // * Update Personal Info
  updatePersonalInfo() {
    this.loaderService.show();

    const payload = {
      fullName: this.personalInfo.fullName,
      email: this.personalInfo.email,
      phone: this.personalInfo.phone,
      country: this.personalInfo.country
    };

    this.apiCallService.PostCallWithToken(payload, 'User/UpdateProfile').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.name = this.personalInfo.fullName;
          this.email = this.personalInfo.email;
          localStorage.setItem('userName', this.personalInfo.fullName);
          localStorage.setItem('email', this.personalInfo.email);
          this.isEditMode = false;
          this.toastr.success('Profile updated successfully', 'Success');
        } else {
          this.handleerror.handleResponseError(response);
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }



  // * Toggle Password Visibility
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

  checkPasswordStrength(): void {
    const password = this.changePasswordForm.get('newPassword')?.value || '';

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


  resetForm(): void {
    this.changePasswordForm.reset();
    this.passwordVisibility = {
      oldPassword: false,
      newPassword: false,
      confirmPassword: false,
    };
  }

  //////////////////api for change pass
  onSubmit() {
    if (this.changePasswordForm.invalid) {
      this.toastr.warning(
        'Please fill out the form correctly before submitting.',
        'Error',
      );
      return;
    }

    const { newPassword, confirmPassword } = this.changePasswordForm.value;

    if (newPassword !== confirmPassword) {
      this.toastr.warning('Passwords do not match!', 'Error');
      return;
    }
    if (newPassword === this.changePasswordForm.get('oldPassword')?.value) {
      this.toastr.warning(
        'New password cannot be same as old password!',
        'Error',
      );
      return;
    }

    this.NewPasswordCAll();
    // this.toastr.success('Password changed successfully!', 'Success');
    this.resetForm();
  }


  payload() {
    return {
      oldPassword: this.changePasswordForm.get('oldPassword')?.value || '',
      newPassword: this.changePasswordForm.get('newPassword')?.value || '',
      confirmNewPassword:
        this.changePasswordForm.get('confirmPassword')?.value || '',
    };
  }

  NewPasswordCAll() {
    this.loaderService.show();
    const payload = this.payload();
    this.apiCallService.PostCallWithToken(payload, 'User/ChangePassword').subscribe({
      next: (response: any) => {
        if (response.responseCode === 200) {
          this.toastr.success(response.responseMessage, 'Success');
        } else {
          this.handleerror.handleResponseError(response);
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }

  //* Form Edit For User Profile Details

  isEditMode: boolean = false;

  enableEdit() {
    this.isEditMode = true;
  }

  disableEdit() {
    this.isEditMode = false;
  }


  // * Logout Function
  logout() {
    this.loaderService.show();

    this.apiCallService.PostCallWithToken({}, 'Auth/Logout').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          localStorage.removeItem('email');
          localStorage.removeItem('userName');
          localStorage.removeItem('token');
          this.toastr.success('Logged out successfully', 'Success');
          this.router.navigate(['/login']);
        } else {
          this.handleerror.handleResponseError(response);
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }



  // * File Upload Function
  saveUserProfileImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';

    fileInput.onchange = async (event: Event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0];

      if (file) {
        try {
          this.loaderService.show();
          //? Convert the file to a base64 string
          const base64Image = await this.convertFileToBase64(file);
          const payload: any = {
            base64Image: base64Image,
          };
          this.apiCallService
            .PostCallWithToken(payload, 'User/SaveUserProfileImage')
            .subscribe({
              next: (response) => {
                if (response && response.responseCode === 200) {
                  this.profileImage = base64Image;

                  //? Set Profile Image for Dynamic Update
                  this.utilsService.setProfileImage(base64Image);
                  this.loaderService.triggerFunction();
                } else {
                  this.handleerror.handleResponseError(response);
                }
              },
              error: (error) => {
                this.handleerror.handleHttpError(error);
              },
              complete: () => {
                this.loaderService.hide();
              },
            });
        } catch (error) {
          this.loaderService.hide();
        }
      }
    };
    fileInput.click();
  }



  // Delete User Profile Image
  deleteUserProfileImage() {

    this.loaderService.show();

    this.apiCallService.PostCallWithToken({}, 'User/DeleteUserProfileImage').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.profileImage = "";
          this.utilsService.setProfileImage("");
          this.loaderService.triggerFunction();
          this.toastr.success(response.responseMessage, 'Success');
        } else {
          this.handleerror.handleResponseError(response);
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
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

  // * Get Wallet Balance and History

  get formattedBalance(): string {
    return (Number(this.walletBalance) || 0).toFixed(2);
  }

  getWalletBalance(pageNumber: number = 1, searchText: string = '') {
    // Don't show loader for pagination requests
    if (pageNumber === 1) {
      this.loaderService.show();
    } else {
      this.isLoadingMore = true;
    }

    const payload = this.WalletPayload(pageNumber);

    this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.loaderService.triggerWalletFunction();
          this.updateBalance(response.data.totalBalance);
          this.walletBalance =
            response.data.totalBalance === ''
              ? this.walletBalance
              : parseFloat(response.data.totalBalance);

          // Combine and transform creditWallets and debitWallets
          const creditTransactions = (response.data.creditWallets || []).map(
            (transaction: any) => ({
              ...transaction,
              type: 'credit',
              balance: transaction.creditBalance,
              time: transaction.creditTime,
            })
          );

          const debitTransactions = (response.data.debitWallets || []).map(
            (transaction: any) => ({
              ...transaction,
              type: 'debit',
              balance: transaction.debitAmount,
              time: transaction.debitDate,
            })
          );

          // Combine and sort by time in descending order
          const newTransactions = [
            ...creditTransactions,
            ...debitTransactions,
          ].sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          );

          // Check if there are more pages (if we got less than pageSize, no more pages)
          const totalNewTransactions = newTransactions.length;
          this.hasMorePages = totalNewTransactions >= 10; // Assuming pageSize is 10

          // Reset transactions for new search or append for pagination
          if (pageNumber === 1) {
            this.transactions = newTransactions;
            this.currentPage = 1;
          } else {
            this.transactions = [...this.transactions, ...newTransactions];
          }

          if (pageNumber === 1) {
            this.loaderService.hide();
          } else {
            this.isLoadingMore = false;
          }
        } else {
          this.handleerror.handleResponseError(response);
          this.isLoadingMore = false;
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
        this.isLoadingMore = false;
      },
      complete: () => {
        if (pageNumber === 1) {
          this.loaderService.hide();
        }
      }
    });
  }

  // * Wallet Payload
  WalletPayload(pageNumber?: number) {
    return {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: pageNumber || this.currentPage,
      pageSize: 10,
      searchText: this.currentSearchTerm || '',
      startDate: this.startDate || '',
      endDate: this.endDate || '',
    };
  }

  // * Update Balance in UI
  updateBalance(balance: string | number) {
    this.walletBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  }

  // * Get filtered transactions
  get filteredTransactions() {
    let allTransactions = this.transactions;

    // Filter by wallet view (deposits/withdrawals)
    switch (this.walletView) {
      case 'deposits':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'credit'
        );
        break;
      case 'withdrawals':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'debit'
        );
        break;
      case 'all':
      default:
        break;
    }

    // Then filter by additional criteria
    switch (this.selectedFilter) {
      case 'Credit':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'credit'
        );
        break;
      case 'Debit':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.type === 'debit'
        );
        break;
      case 'Complete':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.status?.toLowerCase() === 'complete'
        );
        break;
      case 'Pending':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.status?.toLowerCase() === 'pending'
        );
        break;
      case 'Declined':
        allTransactions = allTransactions.filter(
          (transaction) => transaction.status?.toLowerCase() === 'decline'
        );
        break;
      case 'All':
      default:
        break;
    }

    return allTransactions;
  }

  // * Set wallet view (deposits or withdrawals)
  setWalletView(view: 'all' | 'deposits' | 'withdrawals') {
    this.walletView = view;
    // Reset pagination when switching views
    this.currentPage = 1;
    this.hasMorePages = true;
    this.getWalletBalance(1);
  }

  // * Handle scroll event for infinite scroll
  onScroll(event: any) {
    const element = event.target;

    // Make sure we have the right element
    if (!element) return;

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;

    // More robust bottom detection - user has scrolled to within 100px of bottom
    const atBottom = scrollTop + clientHeight >= scrollHeight - 100;

    if (atBottom && !this.isLoadingMore && this.hasMorePages && this.transactions.length > 0) {
      this.currentPage++;
      this.getWalletBalance(this.currentPage);
    }
  }

  // * Manual load more button
  loadMoreTransactions() {
    if (!this.isLoadingMore && this.hasMorePages) {
      this.currentPage++;
      this.getWalletBalance(this.currentPage);
    }
  }

  // * Profile Image Modal Methods
  openProfileImageModal() {
    this.isProfileImageModalOpen = true;
  }

  closeProfileImageModal() {
    this.isProfileImageModalOpen = false;
  }

  onUpdatePhotoClick() {
    this.saveUserProfileImage();
  }

  onDeletePhotoClick() {
    this.deleteUserProfileImage();
    this.closeProfileImageModal();
  }


  // Extra Features

  RedirectTokyc() {
    this.router.navigate(['/dashboard/KYCform']);
  }

  isCopied = false;

  copyCode() {
    if (!this.referralCode) return;

    const domainUrl = location.origin;
    navigator.clipboard.writeText(domainUrl + '?refCode=' + this.referralCode);

    this.isCopied = true;

    setTimeout(() => {
      this.isCopied = false;
    }, 1500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


  referrals: any[] | null = []; getCustomerReferrals() {
    this.loaderService.show();
    const customerId = localStorage.getItem('customerId') || '';
    this.apiCallService
      .GetCallWithToken(`User/GetCustomerReferrals?customerId=${customerId}`)
      .subscribe({
        next: (response) => {
          if (response?.responseCode === 200) {
            this.referrals = response.data ?? [];
          } else {
          }
        },
        complete: () => {
          this.loaderService.hide();
        }
      });
  }

  depositList: any[] = [];
  isDepositModalOpen = false;
  selectedItem: any;
  isLoadingDeposits = false;

  openDepositDetails(item: any) {
    this.selectedItem = item;

    const customerId = item?.userID;

    this.isDepositModalOpen = true;
    this.depositList = []; // clear previous data
    this.getCustomerDeposits(customerId);
  }

  getCustomerDeposits(customerId: string | null) {
    if (!customerId) {
      this.depositList = [];
      this.isLoadingDeposits = false;
      return;
    }

    this.isLoadingDeposits = true;

    this.apiCallService
      .GetCallWithToken(`User/GetReferralDeposits?customerId=${customerId}`)
      .subscribe({
        next: (response) => {
          if (response?.responseCode === 200) {
            this.depositList = response?.data ?? [];
          } else {
            this.depositList = [];
            console.error('API returned error response:', response);
          }

          this.isLoadingDeposits = false; // ✔ stop loader here
        },

        error: (err) => {
          console.error('Deposit API error:', err);

          this.depositList = [];
          this.isLoadingDeposits = false; // ✔ IMPORTANT FIX for 404
        }
      });
  }

  closeModal() {
    this.isDepositModalOpen = false;
    this.depositList = [];
    this.isLoadingDeposits = false;
  }












  // isDepositModalOpen = false;
  // selectedItem: any;

  // // dummy deposit data
  // dummyDeposits = [
  //   { id: 1, amount: 100, date: '2026-01-01' },
  //   { id: 2, amount: 250, date: '2026-01-05' },
  //   { id: 3, amount: 180, date: '2026-01-10' }
  // ];


  // openDepositDetails(item: any) {
  //   console.log('Eye clicked:', item); // 👈 check browser console
  //   this.selectedItem = item;
  //   this.isDepositModalOpen = true;
  // }
  // closeModal() {
  //   this.isDepositModalOpen = false;
  // }


  //////badge FOR LEVEL


  profileLevel: number = 0;


  getLevelImage(levelName: string): string {
    switch ((levelName || '').toLowerCase()) {
      case 'bronze': return '/BrornzeLevel.png';
      case 'silver': return '/SilverLevel.png';
      case 'gold': return '/GoldLevel.png';
      case 'diamond': return '/DiamondLevel.png';
      default: return '/default.png';
    }
  }

  getDepositProgress(lvl: any): number {
    const min = Number(lvl?.MinDepositRange) || 0;
    const max = Number(lvl?.MaxDepositRange) || 0;
    if (max <= min) return 0;

    const percent = ((this.customerTotalDeposit - min) / (max - min)) * 100;

    return Math.min(Math.max(percent, 0), 100); // clamp between 0-100%
  }

  //* User Level Badge Api Call
  playerLevel: string = '';
  customerTotalDeposit: number = 0;
  levels: any[] = [];

  // === VIP LEVELS TERMINAL PROPERTIES ===
  faCrown = faCrown;
  faCheckCircle = faCheckCircle;
  faLock = faLock;
  faSyncAlt = faSyncAlt;
  levelRank: number = 1;
  isLevelLoading: boolean = false;

  tierDefinitions: any[] = [
    {
      level: 1, name: 'Bronze', image: '/BrornzeLevel.png', badgeColor: '#CD7F32',
      minDeposit: 0, maxDeposit: 100, redeemPercent: 5, rakeback: '2.5%',
      weeklyBonus: '$10', lossback: '5%',
      perks: ['Instant Deposit Settling', '2.5% Daily Rakeback', 'Standard Cashout Queue', 'Community Chat Access'],
    },
    {
      level: 2, name: 'Silver', image: '/SilverLevel.png', badgeColor: '#C0C0C0',
      minDeposit: 101, maxDeposit: 500, redeemPercent: 10, rakeback: '5.0%',
      weeklyBonus: '$35', lossback: '7.5%',
      perks: ['5.0% Daily Rakeback Boost', 'Weekly Reload Multipliers', 'Priority Payout Processing', 'Bronze + Silver Scratch Access'],
    },
    {
      level: 3, name: 'Gold', image: '/GoldLevel.png', badgeColor: '#FFD700',
      minDeposit: 501, maxDeposit: 1500, redeemPercent: 15, rakeback: '8.5%',
      weeklyBonus: '$100', lossback: '10%',
      perks: ['8.5% Daily High-Roller Rakeback', 'VIP Weekly Bonus Air-Drops', 'Direct Priority Cashout Lane', 'Level-Up Milestone Bonus'],
    },
    {
      level: 4, name: 'Platinum', image: '/PlatinumLevel.png', badgeColor: '#00F5D4',
      minDeposit: 1501, maxDeposit: 3500, redeemPercent: 20, rakeback: '12.0%',
      weeklyBonus: '$250', lossback: '12.5%',
      perks: ['12.0% Platinum Rakeback', 'Dedicated VIP Account Host', 'Instant Uncapped Withdrawals', 'Exclusive High-Roller Tournaments'],
    },
    {
      level: 5, name: 'Diamond', image: '/DiamondLevel.png', badgeColor: '#2CD97D',
      minDeposit: 3501, maxDeposit: 10000, redeemPercent: 25, rakeback: '15.0%',
      weeklyBonus: '$600', lossback: '15%',
      perks: ['15.0% Maximum Apex Rakeback', 'Private 24/7 Concierge Host', 'Zero Payout Waiting Time', 'Custom High-Roller Gifts & Drops'],
    },
  ];

  // === KYC FORM PROPERTIES ===
  kycForm!: FormGroup;
  documentTypes = DocumentTypes;
  documentFrontImagePreview: string | null = null;
  documentBackImagePreview: string | null = null;
  selfieImagePreview: string | null = null;
  documentFrontFile: File | null = null;
  documentBackFile: File | null = null;
  selfieFile: File | null = null;
  isKycFormSubmitted = false;
  kycMinDate: string = '';
  kycMaxDate: string = '';
  showKycPopup = false;
  kycPopupTitle = '';
  kycPopupMessage = '';
  kycPopupButtonText = '';
  kycPopupRedirect: string | null = null;

  // API CALL
  GetCustomerLevel() {
    this.isLevelLoading = true;
    const customerId = localStorage.getItem('customerId') || '';

    this.apiCallService
      .GetCallWithToken(`Customer/GetCustomerLevel?CustomerId=${customerId}`)
      .subscribe({
        next: (response) => {
          this.isLevelLoading = false;
          if (response && response.responseCode === 200) {
            const data = response.data;
            this.playerLevel = data.playerLevel || 'Bronze';
            this.customerTotalDeposit = Number(data.customerTotalDeposit) || 0;

            const apiLevels = (data.levels || []).slice().sort(
              (a: any, b: any) => (a.MinDepositRange || 0) - (b.MinDepositRange || 0)
            );

            if (apiLevels.length > 0) {
              this.levels = apiLevels.map((lvl: any, idx: number) => {
                const def = this.tierDefinitions[idx] || this.tierDefinitions[this.tierDefinitions.length - 1];
                return {
                  ...def,
                  name: lvl.LevelName || def.name,
                  minDeposit: lvl.MinDepositRange ?? def.minDeposit,
                  maxDeposit: lvl.MaxDepositRange ?? def.maxDeposit,
                  redeemPercent: Number(lvl.RedeemPercentageOnBonusWallet) || def.redeemPercent,
                  image: this.getLevelImage(lvl.LevelName || def.name),
                  LevelName: lvl.LevelName,
                  MinDepositRange: lvl.MinDepositRange,
                  MaxDepositRange: lvl.MaxDepositRange,
                  RedeemPercentageOnBonusWallet: lvl.RedeemPercentageOnBonusWallet,
                };
              });
            } else {
              this.levels = this.tierDefinitions;
            }

            const rankIdx = this.levels.findIndex(
              (l) => (l.name || l.LevelName || '').toLowerCase() === this.playerLevel.toLowerCase()
            );
            this.levelRank = rankIdx >= 0 ? rankIdx + 1 : 1;
          } else {
            this.handleerror.handleResponseError(response);
            this.levels = this.tierDefinitions;
          }
        },
        error: (error) => {
          this.isLevelLoading = false;
          this.handleerror.handleHttpError(error);
          this.levels = this.tierDefinitions;
        }
      });
  }


  // === VIP LEVELS TERMINAL METHODS ===
  getCurrentTierObj(): any {
    return (
      this.levels.find(
        (l) => (l.name || l.LevelName || '').toLowerCase() === this.playerLevel.toLowerCase()
      ) || this.levels[0] || this.tierDefinitions[0]
    );
  }

  getNextTierObj(): any {
    const currentIdx = this.levels.findIndex(
      (l) => (l.name || l.LevelName || '').toLowerCase() === this.playerLevel.toLowerCase()
    );
    if (currentIdx >= 0 && currentIdx < this.levels.length - 1) {
      return this.levels[currentIdx + 1];
    }
    return null;
  }

  getVipDepositProgress(): number {
    const currentTier = this.getCurrentTierObj();
    const nextTier = this.getNextTierObj();
    if (!nextTier) return 100;
    const min = Number(currentTier?.minDeposit ?? currentTier?.MinDepositRange) || 0;
    const max = Number(nextTier?.minDeposit ?? nextTier?.MinDepositRange) || 1000;
    if (max <= min) return 100;
    const percent = ((this.customerTotalDeposit - min) / (max - min)) * 100;
    return Math.min(Math.max(Math.round(percent), 0), 100);
  }

  getRemainingDeposit(): number {
    const nextTier = this.getNextTierObj();
    if (!nextTier) return 0;
    const needed = (Number(nextTier?.minDeposit ?? nextTier?.MinDepositRange) || 0) - this.customerTotalDeposit;
    return Math.max(0, Math.round(needed * 100) / 100);
  }

  isTierUnlocked(tier: any): boolean {
    const tierIdx = this.levels.findIndex(
      (l) => (l.name || l.LevelName || '').toLowerCase() === (tier.name || tier.LevelName || '').toLowerCase()
    );
    const currentIdx = this.levels.findIndex(
      (l) => (l.name || l.LevelName || '').toLowerCase() === this.playerLevel.toLowerCase()
    );
    return tierIdx <= currentIdx;
  }

  isCurrentTier(tier: any): boolean {
    return (tier.name || tier.LevelName || '').toLowerCase() === this.playerLevel.toLowerCase();
  }

  navigateToWallet(): void {
    this.router.navigate(['/dashboard/wallet']);
  }

  refreshLevels(): void {
    this.GetCustomerLevel();
  }

  // === KYC FORM METHODS ===
  initializeKycForm(): void {
    this.kycForm = this.fb.group({
      customerId: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      dateOfBirth: ['', [Validators.required, this.validateDOB.bind(this)]],
      nationality: ['', [Validators.required]],
      country: ['', [Validators.required]],
      city: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      state: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      zipcode: ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
      address: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      ssin: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      documentType: ['', [Validators.required]],
      documentExpiryDate: ['', [Validators.required, this.validateExpiryDate.bind(this)]],
      documentFrontImage: ['', [Validators.required]],
      documentBackImage: ['', [Validators.required]],
      selfieImage: ['', [Validators.required]],
    });

    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      this.kycForm.get('customerId')?.setValue(customerId);
    }
  }

  setKycDateRange(): void {
    const today = new Date();
    const maxDOB = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDOB = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    this.kycMaxDate = this.formatDateForInput(maxDOB);
    this.kycMinDate = this.formatDateForInput(minDOB);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  validateDOB(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const dob = new Date(control.value);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18) return { underage: true };
    if (age > 120) return { invalidAge: true };
    return null;
  }

  validateExpiryDate(control: any): { [key: string]: boolean } | null {
    if (!control.value) return null;
    const expiryDate = new Date(control.value);
    const today = new Date();
    if (expiryDate < today) return { expired: true };
    return null;
  }

  onDocumentFrontImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validateAndPreviewKycImage(file, 'front');
      this.documentFrontFile = file;
      this.kycForm.get('documentFrontImage')?.setValue('uploaded');
      this.kycForm.get('documentFrontImage')?.markAsTouched();
    }
  }

  onDocumentBackImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validateAndPreviewKycImage(file, 'back');
      this.documentBackFile = file;
      this.kycForm.get('documentBackImage')?.setValue('uploaded');
      this.kycForm.get('documentBackImage')?.markAsTouched();
    }
  }

  onSelfieImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validateAndPreviewKycImage(file, 'selfie');
      this.selfieFile = file;
      this.kycForm.get('selfieImage')?.setValue('uploaded');
      this.kycForm.get('selfieImage')?.markAsTouched();
    }
  }

  private validateAndPreviewKycImage(file: File, type: 'front' | 'back' | 'selfie'): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      this.toastr.error('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 'Error');
      return;
    }
    if (file.size > maxSize) {
      this.toastr.error('File size exceeds 5MB limit.', 'Error');
      return;
    }
    this.convertKycImageToBase64(file, type);
  }

  private convertKycImageToBase64(file: File, type: 'front' | 'back' | 'selfie'): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (type === 'front') this.documentFrontImagePreview = base64String;
      else if (type === 'back') this.documentBackImagePreview = base64String;
      else this.selfieImagePreview = base64String;
    };
    reader.readAsDataURL(file);
  }

  removeDocumentFrontImage(): void {
    this.documentFrontImagePreview = null;
    this.documentFrontFile = null;
    this.kycForm.get('documentFrontImage')?.reset();
  }

  removeDocumentBackImage(): void {
    this.documentBackImagePreview = null;
    this.documentBackFile = null;
    this.kycForm.get('documentBackImage')?.reset();
  }

  removeSelfieImage(): void {
    this.selfieImagePreview = null;
    this.selfieFile = null;
    this.kycForm.get('selfieImage')?.reset();
  }

  onKycSubmit(): void {
    this.isKycFormSubmitted = true;
    if (this.kycForm.invalid) {
      const invalidFields = [];
      for (const controlName in this.kycForm.controls) {
        const control = this.kycForm.get(controlName);
        if (control && control.invalid) invalidFields.push(controlName);
      }
      this.toastr.error(`Please fill all required fields. Invalid: ${invalidFields.join(', ')}`, 'Validation Error');
      return;
    }
    this.submitKycForm();
  }

  private submitKycForm(): void {
    this.loaderService.show();
    const formPayload = {
      id: 0,
      customerId: this.kycForm.get('customerId')?.value,
      firstName: this.kycForm.get('firstName')?.value,
      middleName: this.kycForm.get('middleName')?.value,
      lastName: this.kycForm.get('lastName')?.value,
      dateOfBirth: this.kycForm.get('dateOfBirth')?.value,
      nationality: this.kycForm.get('nationality')?.value,
      country: this.kycForm.get('country')?.value,
      city: this.kycForm.get('city')?.value,
      state: this.kycForm.get('state')?.value,
      zipcode: this.kycForm.get('zipcode')?.value,
      address: this.kycForm.get('address')?.value,
      ssin: this.kycForm.get('ssin')?.value,
      documentType: this.kycForm.get('documentType')?.value,
      documentExpiryDate: this.kycForm.get('documentExpiryDate')?.value,
      documentFrontImagePath: this.documentFrontImagePreview,
      documentBackImagePath: this.documentBackImagePreview,
      selfieImagePath: this.selfieImagePreview,
    };

    this.apiCallService
      .PostCallWithToken(formPayload, 'KYC/CreateOrUpdateCustomerKYC')
      .subscribe({
        next: (response: any) => {
          this.loaderService.hide();
          if (response.responseCode === 200) {
            this.toastr.success('KYC form submitted successfully!', 'Success');
            this.getKYCStatusAfterSubmit();
          } else {
            this.handleerror.handleResponseError(response);
          }
        },
        error: (error) => {
          this.loaderService.hide();
          this.handleerror.handleHttpError(error);
        },
      });
  }

  private getKYCStatusAfterSubmit(): void {
    const CustomerID = localStorage.getItem('customerId');
    this.apiCallService
      .GetCallWithToken('KYC/GetCustomerKYCStatus?CustomerId=' + CustomerID)
      .subscribe({
        next: (response) => {
          if (response && response.responseCode == 200) {
            localStorage.setItem('KYC', response.data);
            this.KYCVerification = response.data;
            if (response.data === 'Pending') {
              this.kycPopupTitle = 'KYC Verification';
              this.kycPopupMessage = 'Your KYC is pending. Please wait while it is approved.';
              this.kycPopupButtonText = 'Got it';
              this.kycPopupRedirect = null;
              this.showKycPopup = true;
            }
          }
        },
        error: () => {},
      });
  }

  closeKycPopup(): void {
    this.showKycPopup = false;
  }

  patchKycFormFromData(): void {
    const KycValues = this.utilsService.getData();
    if (KycValues?.isUpdated && this.KYCVerification === 'pending') {
      const KycData = KycValues.data;
      this.documentFrontImagePreview = KycData.documentFrontImagePath;
      this.documentBackImagePreview = KycData.documentBackImagePath;
      this.selfieImagePreview = KycData.selfieImagePath;
      this.documentFrontFile = {} as File;
      this.documentBackFile = {} as File;
      this.selfieFile = {} as File;
      this.kycForm.patchValue({
        customerId: KycData.customerId,
        firstName: KycData.firstName,
        middleName: KycData.middleName,
        lastName: KycData.lastName,
        dateOfBirth: this.formatDateForInput(new Date(KycData.dateOfBirth)),
        nationality: KycData.nationality,
        country: KycData.country,
        city: KycData.city,
        state: KycData.state,
        zipcode: KycData.zipcode,
        address: KycData.address,
        ssin: KycData.ssin,
        documentType: KycData.documentType,
        documentExpiryDate: this.formatDateForInput(new Date(KycData.documentExpiryDate)),
        documentFrontImage: 'uploaded',
        documentBackImage: 'uploaded',
        selfieImage: 'uploaded',
      });
    }
  }

  // User Level UpDate Api Call
  UpdateCustomerLevel() {
    const customerId = localStorage.getItem('customerId');

    this.UpdateCustomerService.UpdateCustomerLevel(customerId).subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          const level = response.data.level;
          this.profileLevel = level;
        } else {
          this.handleerror.handleResponseError(response);
        }
      },
      error: (error) => {
        this.handleerror.handleHttpError(error);
      }
    });
  }
}
