import {
  Component,
  OnInit,
  PLATFORM_ID,
  Inject,
  HostListener,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DocumentTypes, KycApiResponse } from '../../Interfaces/kyc.interface';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderService } from '../../Services/loader-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { UtilsService } from '../../Services/utils.service';
import { ToastrService } from 'ngx-toastr';
import { KycPopupComponent } from '../../common/kyc-popup/kyc-popup.component';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-kyc-form',
  imports: [CommonModule, ReactiveFormsModule, KycPopupComponent],
  templateUrl: './kyc-form.component.html',
  styleUrl: './kyc-form.component.scss',
})
export class KycFormComponent implements OnInit {
  kycForm!: FormGroup;
  documentTypes = DocumentTypes;

  // File preview and storage
  documentFrontImagePreview: string | null = null;
  documentBackImagePreview: string | null = null;
  selfieImagePreview: string | null = null;

  documentFrontFile: File | null = null;
  documentBackFile: File | null = null;
  selfieFile: File | null = null;
  grainBackdrop: SafeHtml = '';
  isFormSubmitted = false;
  minDate: string = '';
  maxDate: string = '';
  isBrowser: boolean;
  showKycPopup = false;
  KycData: any;
  isPending: any = '';

  // form varibales
  id: any;
  customerId: any;
  firstName: any;
  middleName: any;
  lastName: any;
  dateOfBirth: any;
  nationality: any;
  address: any;
  residentialAddress: any;
  country: any;
  city: any;
  state: any;
  zipcode: any;
  documentType: any;
  documentNumber: any;
  ssin: any;
  documentExpiryDate: any;
  documentFrontImagePath: any;
  documentBackImagePath: any;
  selfieImagePath: any;
  status: any;
  reason: any;
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

  constructor(
    private location: Location,
    private formBuilder: FormBuilder,
    private apiCallService: ApiCallService,
    private loaderService: LoaderService,
    private errorHandler: ErrorhandlingService,
    private utilsService: UtilsService,
    private toaster: ToastrService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.grainBackdrop = this.utilsService?.getGrainBackdrop();
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const kyc = localStorage.getItem('KYC');
    if (kyc === 'Pending') {
      this.popupTitle = this.ptitlekyc;
      this.popupMessage = this.pmessagekyc;
      this.popupButtonText = this.pbuttontextkyc;
      this.popupRedirect = null;
      this.showKycPopup = true;
    } else if (kyc === 'Not Submitted') {
      this.popupTitle = this.Ntitlekyc;
      this.popupMessage = this.Nmessagekyc;
      this.popupButtonText = this.Nbuttontextkyc;
      this.popupRedirect = this.NredirecttoKYCform;
      this.showKycPopup = true;
    }
    this.initializeForm();
    this.setDateRange();
    //this.getKYCVerification();
  }
  closeKycPopup() {
    this.showKycPopup = false;
  }


  ngAfterViewInit(): void {
    this.isPending = localStorage.getItem('KYC');
    const KycValues = this.utilsService.getData();

    if (KycValues.isUpdated && this.isPending === 'Pending') {
      // check isUpdated
      this.KycData = KycValues.data;
      this.patchKycForm();
    }
  }

  private initializeForm(): void {
    this.kycForm = this.formBuilder.group({
      customerId: [{ value: '', disabled: true }],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(50)]],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      dateOfBirth: ['', [Validators.required, this.validateDOB.bind(this)]],
      nationality: ['', [Validators.required]],
      country: ['', [Validators.required]],
      city: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      state: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      zipcode: ['', [Validators.required, Validators.pattern(/^\d{4,10}$/)]],
      address: [
        '',
        [
          Validators.required,
          Validators.minLength(5),
          Validators.maxLength(200),
        ],
      ],
      // residentialAddress: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      ssin: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
      documentType: ['', [Validators.required]],
      // documentNumber: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(30)]],
      documentExpiryDate: [
        '',
        [Validators.required, this.validateExpiryDate.bind(this)],
      ],
      documentFrontImage: ['', [Validators.required]],
      documentBackImage: ['', [Validators.required]],
      selfieImage: ['', [Validators.required]],
      //reason: ['']
    });

    // Set customer ID if available
    if (this.isBrowser) {
      const customerId = this.utilsService.getItem('customerId');
      if (customerId) {
        this.kycForm.get('customerId')?.setValue(customerId);
      }
    }
  }

  private setDateRange(): void {
    const today = new Date();
    const maxDOB = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate(),
    );
    const minDOB = new Date(
      today.getFullYear() - 120,
      today.getMonth(),
      today.getDate(),
    );

    this.maxDate = this.formatDateForInput(maxDOB);
    this.minDate = this.formatDateForInput(minDOB);
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

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

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

  allowOnlyNumbers(event: any) {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
    this.kycForm.get('ssin')?.setValue(event.target.value);
  }
  onDocumentFrontImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validateAndPreviewImage(file, 'front');
      this.documentFrontFile = file;
      this.kycForm.get('documentFrontImage')?.setValue('uploaded');
      this.kycForm.get('documentFrontImage')?.markAsTouched();
    }
  }

  onDocumentBackImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validateAndPreviewImage(file, 'back');
      this.documentBackFile = file;
      this.kycForm.get('documentBackImage')?.setValue('uploaded');
      this.kycForm.get('documentBackImage')?.markAsTouched();
    }
  }

  onSelfieImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.validateAndPreviewImage(file, 'selfie');
      this.selfieFile = file;
      this.kycForm.get('selfieImage')?.setValue('uploaded');
      this.kycForm.get('selfieImage')?.markAsTouched();
    }
  }

  private validateAndPreviewImage(
    file: File,
    type: 'front' | 'back' | 'selfie',
  ): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      this.errorHandler.handleResponseError({
        responseCode: 400,
        responseMessage:
          'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      });
      return;
    }

    if (file.size > maxSize) {
      this.errorHandler.handleResponseError({
        responseCode: 400,
        responseMessage: 'File size exceeds 5MB limit.',
      });
      return;
    }

    this.convertImageToBase64(file, type);
  }

  private convertImageToBase64(
    file: File,
    type: 'front' | 'back' | 'selfie',
  ): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;

      if (type === 'front') {
        this.documentFrontImagePreview = base64String;
      } else if (type === 'back') {
        this.documentBackImagePreview = base64String;
      } else {
        this.selfieImagePreview = base64String;
      }
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

  onSubmit(): void {
    this.isFormSubmitted = true;

    if (this.kycForm.invalid) {
      const invalidFields = [];
      for (const controlName in this.kycForm.controls) {
        const control = this.kycForm.get(controlName);
        if (control && control.invalid) {
          invalidFields.push(controlName);
        }
      }
      const message = `Please fill all required fields and upload all required images. Invalid fields: ${invalidFields.join(', ')}`;
      this.errorHandler.handleResponseError({
        responseCode: 400,
        responseMessage: message
      });
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
      // reason: this.kycForm.get('reason')?.value,
      documentFrontImagePath: this.documentFrontImagePreview,
      documentBackImagePath: this.documentBackImagePreview,
      selfieImagePath: this.selfieImagePreview,
    };

    this.apiCallService
      .PostCallWithToken(formPayload, 'KYC/CreateOrUpdateCustomerKYC')
      .subscribe({
        next: (response: KycApiResponse) => {
          this.loaderService.hide();
          if (response.responseCode === 200) {
            this.toaster.success('KYC form submitted successfully!', 'Success');
            // Call the KYC status API to update localStorage
            this.getKYCStatus();
          } else {
            this.errorHandler.handleResponseError(response);
          }
        },
        error: (error) => {
          this.loaderService.hide();
          this.apiCallService.handleError(error);
        },
      });
  }

  CloseModal(): void {
    this.location.back();
  }

  // Method to get KYC status and update localStorage
  private getKYCStatus(): void {
    const CustomerID = localStorage.getItem('customerId');
    this.apiCallService
      .GetCallWithToken('KYC/GetCustomerKYCStatus?CustomerId=' + CustomerID)
      .subscribe(
        (response) => {
          if (response && response.responseCode == 200) {
            // Update localStorage with the new KYC status
            localStorage.setItem('KYC', response.data);
            // Check if status is pending and show popup
            if (response.data === 'Pending') {
              this.popupTitle = this.ptitlekyc;
              this.popupMessage = 'Your KYC is pending please wait while it is approved';
              this.popupButtonText = this.pbuttontextkyc;
              this.popupRedirect = null;
              this.showKycPopup = true;
            } else {
              // If not pending, close the modal after a delay
              setTimeout(() => {
                this.CloseModal();
              }, 1500);
            }
          } else {
            // If API fails, still close the modal
            setTimeout(() => {
              this.CloseModal();
            }, 1500);
          }
        },
        (error) => {
          // If error, still close the modal
          setTimeout(() => {
            this.CloseModal();
          }, 1500);
        },
      );
  }

  get f() {
    return this.kycForm.controls;
  }

  ///////////Api Call For KYC Form Header Value/////////

  patchKycForm(): void {
    if (!this.KycData) return;

    //  SHOW IMAGES (base64 previews)
    this.documentFrontImagePreview = this.KycData.documentFrontImagePath;
    this.documentBackImagePreview = this.KycData.documentBackImagePath;
    this.selfieImagePreview = this.KycData.selfieImagePath;

    //  Mark files as already uploaded (important for submit validation)
    this.documentFrontFile = {} as File;
    this.documentBackFile = {} as File;
    this.selfieFile = {} as File;

    this.kycForm.patchValue({
      customerId: this.KycData.customerId,
      firstName: this.KycData.firstName,
      middleName: this.KycData.middleName,
      lastName: this.KycData.lastName,
      dateOfBirth: this.formatDate(this.KycData.dateOfBirth),
      nationality: this.KycData.nationality,
      country: this.KycData.country,
      city: this.KycData.city,
      state: this.KycData.state,
      zipcode: this.KycData.zipcode,
      address: this.KycData.address,
      ssin: this.KycData.ssin,
      documentType: this.KycData.documentType,
      documentExpiryDate: this.formatDate(this.KycData.documentExpiryDate),

      //  dummy values just to satisfy validators
      documentFrontImage: 'uploaded',
      documentBackImage: 'uploaded',
      selfieImage: 'uploaded',
    });
  }


  private formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  documentTypeDropdownOpen = false;

  toggleDocTypeDropdown() {
    this.documentTypeDropdownOpen = !this.documentTypeDropdownOpen;
  }

  selectDocumentType(type: any) {
    this.f['documentType'].setValue(type.value);
    this.documentTypeDropdownOpen = false;
  }

  getDocumentLabel(value: string): string {
    return this.documentTypes.find((t) => t.value === value)?.label || '';
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.select-input')) {
      this.documentTypeDropdownOpen = false;
    }
  }
}
