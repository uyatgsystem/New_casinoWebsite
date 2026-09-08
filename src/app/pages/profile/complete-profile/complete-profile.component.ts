import { Component, input, OnInit, OnDestroy } from '@angular/core';
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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LocationService } from '../../../Services/ip-check.service';

@Component({
  standalone: true,
  selector: 'app-complete-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FontAwesomeModule],
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
    private UpdateCustomerService: LocationService
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

    const refQuery = this.route.snapshot.queryParamMap.get('ref');
    if (refQuery?.toLowerCase() === 'active') {
      this.activeTab = 'referrals';
    }

    //? Fetch wallet history on component load
    this.getWalletBalance();

    //? Fetch KYC Verification Status
    const kycStatus = localStorage.getItem('KYC');
    this.KYCVerification = kycStatus ? kycStatus : '';

    this.getCustomerReferrals();
    this.GetCustomerLevel();
    this.UpdateCustomerLevel();
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






  // * User Profile Data
  receivedData: any;
  email: string = '';
  name: string = '';
  profileImage: string = '';
  activeTab: 'personal' | 'security' | 'wallet' | 'referrals' | 'Levels' = 'personal';
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
      customerId: Number(localStorage.getItem('customerId')),
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
    this.apiCallService
      .GetCallWithToken(`User/GetCustomerReferrals`)
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
  setProfileLevel() {
    const deposit = this.TotalDepositAmount;
    const referral = this.TotalReferral;
    const kyc = this.IsKycCompleted;

    // // Bronze
    // if (deposit >= 10 && referral >= 1 && kyc === 1) {
    //   this.profileLevel = 1;
    //   this.UpdateCustomerLevel();
    // }

    // // Silver
    // if (deposit >= 100 && referral >= 10 && kyc === 1) {
    //   this.profileLevel = 2;
    //   this.UpdateCustomerLevel();
    // }

    // // Gold
    // if (deposit >= 500 && referral >= 20 && kyc === 1) {
    //   this.profileLevel = 3;
    //   this.UpdateCustomerLevel();
    // }

    // // Platinum
    // if (deposit >= 1000 && referral >= 50 && kyc === 1) {
    //   this.profileLevel = 4;
    //   this.UpdateCustomerLevel();
    // }

    // // Diamond
    // if (deposit >= 5000 && referral >= 100 && kyc === 1) {
    //   this.profileLevel = 5;
    //   this.UpdateCustomerLevel();
    // }
  }


  getLevelName(level: number): string {
    switch (level) {
      case 1: return 'Bronze';
      case 2: return 'Silver';
      case 3: return 'Gold';
      case 4: return 'Platinum';
      case 5: return 'Diamond';
      default: return 'Level ' + level;
    }
  }

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

  getDepositProgress(target: number): number {
    if (!target) return 0;

    const percent = (this.TotalDepositAmount / target) * 100;

    return Math.min(percent, 100); // never exceed 100%
  }

  //* User Level Badge Api Call
  TotalDepositAmount: number = 0;
  TotalReferral: number = 0;
  IsKycCompleted: number = 0;
  BadgeRules: any;
  badgeList: any[] = [];

  // API CALL
  GetCustomerLevel() {
    const customerId = localStorage.getItem('customerId');

    this.apiCallService
      .GetCallWithToken(`User/GetCustomerLevelRecord?customerId=` + customerId)
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {

            const data = response.data;
            const redeemInfo = data.redeemInformation[0];
            this.TotalDepositAmount = redeemInfo.TotalDepositAmount;
            this.TotalReferral = redeemInfo.TotalReferral;
            this.IsKycCompleted = redeemInfo.IsKycCompleted;

            const levels = data.customerLevels;
            this.badgeList = Object.keys(levels).map(key => ({
              level: Number(key),
              depositAmount: levels[key].depositAmount,
              referralCount: levels[key].referralCount,
              benefits: levels[key].benefits
            }));

            this.badgeList.sort((a, b) => a.level - b.level);

          } else {
            this.handleerror.handleResponseError(response);
          }
        },
        error: (error) => {
          this.handleerror.handleHttpError(error);
        }
      });
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
