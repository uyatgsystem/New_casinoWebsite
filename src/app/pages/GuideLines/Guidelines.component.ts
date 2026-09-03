import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { ToastrService } from 'ngx-toastr';
import { GameCard, GameCardInterface } from '../../Interfaces/interfaces';
import {
  faPlus,
  faCircleInfo,
  faDownload,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-redeem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoaderComponent,
    NgIf,
    FontAwesomeModule,
  ],
  providers: [ApiCallService],
  templateUrl: './Guidelines.component.html',
  styleUrls: ['./Guidelines.component.scss'],
})
export class Guidelines implements OnInit {
  private _apiCall = inject(ApiCallService);
  activeTab: 'all' | 'Pending' | 'Approved' | 'Declined' = 'all';
  showModal = false;
  selectedGame: any;
  score = '';
  cashtag = '';
  selectedPaymentMethod: 'wallet' | 'withdraw' = 'wallet';
  startDate: string | null = null;
  endDate: string | null = null;
  viewMode: 'grid' | 'table' = 'table';
  plusIcon = faPlus;
  infoIcon = faCircleInfo;
  Download = faDownload;
  eye = faEye;
  searchControl = new FormControl('');
  toggleView() {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }
  redeemForm: FormGroup;
  constructor(
    private loaderService: LoaderService,
    private errorHandling: ErrorhandlingService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer
  ) {
    this.redeemForm = this.fb.group({
      game: [this.selectedGame, Validators.required],
      score: [this.score, Validators.required],
      source: [this.selectedPaymentMethod],
      cashTag: [this.cashtag],
    });
  }

  ngOnInit(): void {
    this.GetGuideLines();
  }

  isExport: boolean = false;

  GuideLines: any;
  GetGuideLines() {
    this.loaderService.show();

    const payload = {
      pageNumber: this.currentPage !== undefined ? this.currentPage : 0,
      pageSize: 10,
      searchText: '',
      isExport: this.isExport !== undefined ? this.isExport : '',
      totalRecords: 0,
      startDate: this.startDate || '',
      endDate: this.endDate || '',
      serialNumber: 0,
      orderBy: '',
    };

    // this._apiCall
    //   .PostCallWithToken(payload, 'User/GetGuidelineList')
    //   .subscribe({
    //     next: (response) => {
    //       if (response.responseCode === 200) {
    //         // this.GuideLines = response.data;
    //         this.totalRecords = response?.data[0]?.totalRecords;
    //         this.calculatePages();
    //         if (this.currentPage == 1) {
    //           this.GuideLines = response.data;
    //         } else {
    //           this.GuideLines = [...this.GuideLines, ...response.data];
    //         }
    //       } else {
    //         this._apiCall.handleError(response);
    //       }
    //       this.loaderService.hide();
    //     },
    //     error: (error) => {
    //       this.loaderService.hide();
    //       this._apiCall.handleError(error);
    //     },
    //   });


    this._apiCall.PostCallWithToken(payload, 'User/GetGuidelineList').subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.totalRecords = response?.data[0]?.totalRecords;
          this.calculatePages();
          this.GuideLines = this.currentPage === 1 ? response.data : [...this.GuideLines, ...response.data];
        } else {
          // this._apiCall.handleError(response);
          this.errorHandling.handleResponseError(response);
        }

        this.loaderService.hide();
      },
      error: (error) => {
        this.loaderService.hide();
        //this._apiCall.handleError(error);
        this.errorHandling.handleHttpError(error);
      },
    });
  }

  getCustomerID(): number | null {
    return Number(localStorage.getItem('customerId'));
  }

  // TS Code for Pagination Start
  pages: (number | string)[] = [];
  currentPage: number = 1;
  totalRecords: number = 0;
  itemsPerPage: number = 10;
  maxVisiblePages: number = 1;

  calculatePages(): void {
    const totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
    this.pages = [];
    if (totalPages <= this.maxVisiblePages) {
      this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const startPage = Math.max(
        this.currentPage - Math.floor(this.maxVisiblePages / 2),
        1
      );
      const endPage = Math.min(
        startPage + this.maxVisiblePages - 1,
        totalPages
      );

      if (startPage > 1) {
        this.pages.push(1);
        if (startPage > 2) {
          this.pages.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        this.pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          this.pages.push('...');
        }
        this.pages.push(totalPages);
      }
    }
  }

  navigateToPage(page: any): void {
    if (
      (page >= 1 && page <= this.pages.length) ||
      (page >= 1 && page >= this.pages.length)
    ) {
      this.currentPage = page;
      this.GetGuideLines();
    }
  }

  navigatePage(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (
      direction === 'next' &&
      this.currentPage < Math.ceil(this.totalRecords / this.itemsPerPage)
    ) {
      this.currentPage++;
    }
    this.GetGuideLines();
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.totalRecords);
    return `${start} – ${end}`;
  }

  // TS Code for Pagination End

  // Download PDF file
  guidelineBase64!: string;
  safeUrl!: SafeResourceUrl;

  downloadGuideline(GuideId: number, isDownload: boolean) {
    this.loaderService.show();
    this._apiCall
      .GetCallWithToken('User/GetUserGuideline?Id=' + GuideId)
      .subscribe((response) => {
        if (response.responseCode == 200) {
          const base64String = response.data.FilePath;

          if (base64String) {
            // if (this.guidelineBase64) {
            this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
              this.dataURItoBlob(base64String)
            );
            this.guidelineBase64 = base64String;
            // } else {
            //   console.error('guidelineBase64 is not set or is invalid');
            // }
            if (isDownload) {
              this.downloadFile();
            } else {
              this.showGuidelineModal = true;
            }
          } else {
            // console.error('Invalid base64 string prefix');
          }
          this.loaderService.hide();
        }
      });
  }



  dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const int8Array = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      int8Array[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  }
  downloadFile() {
    // Log the Base64 string for debugging

    // Replace the incorrect prefix with the correct one
    let base64Data = this.guidelineBase64
      .replace(/^data:@file\/pdf;base64,/, 'data:application/pdf;base64,')
      .replace(/^data:application\/pdf;base64,/, ''); // Remove the prefix for decoding

    // Add padding if necessary
    const padding = base64Data.length % 4;
    if (padding > 0) {
      base64Data += '='.repeat(4 - padding);
    }

    // Decode the Base64 string
    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = 'Guideline.pdf';
      document.body.appendChild(link); // Append link to body
      link.click();
      document.body.removeChild(link); // Remove link after download

      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      // console.error('Error decoding Base64 string:', error);
    }
  }

  searchTerm: string = '';
  get filteredGuideLines() {
    return this.GuideLines.filter((guideline: any) => {
      const matchesSearch =
        !this.searchTerm ||
        guideline.Title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guideline.Description.toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });
  }

  showGuidelineModal = false;
  hideGuidelineModal: boolean = false;
  CloseGuidelineModal() {
    this.showGuidelineModal = false;
  }

  @ViewChild('transactionTable', { static: false })
  transactionTable!: ElementRef;
  onScroll(): void {
    // console.log('scrolling');
    const element = this.transactionTable.nativeElement;
    if (element.offsetHeight + element.scrollTop + 1 >= element.scrollHeight) {
      this.currentPage++;
      // console.log('Scrolled to the bottom');
      this.GetGuideLines();
    }
  }

  onMobileScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      //  alert('scrolled to the bottom');
      this.currentPage++;
      // console.log('Scrolled to the bottom');
      this.GetGuideLines();
    }
  }


  //? Scroll pagination 

  @ViewChild('guidelinesTable', { static: false }) gamesTable!: ElementRef;
  onTableViewScroll(): void {
    // console.log('scrolling');
    const chatListElement = this.gamesTable.nativeElement;
    if (
      chatListElement.offsetHeight + chatListElement.scrollTop + 1 >=
      chatListElement.scrollHeight
    ) {
      this.currentPage++;
      this.GetGuideLines();
    }
  }
}
