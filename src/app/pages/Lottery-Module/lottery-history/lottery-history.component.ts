import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { ApiCallService } from '../../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../Services/loader-service.service';
import { UtilsService } from '../../../Services/utils.service';
import { LoaderComponent } from '../../../components/loader/loader.component';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import {
  faInfoCircle,
  faCircleInfo,
  faRefresh,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { takeUntil } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-lottery-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    FontAwesomeModule,
  ],
  templateUrl: './lottery-history.component.html',
  styleUrls: ['./lottery-history.component.scss'],
})
export class LotteryHistoryComponent implements OnInit {
  @ViewChild('lotteryTable', { static: false }) lotteryTable!: ElementRef;
  lotteryRecords: any[] = [];
  allRecords: any[] = [];
  faInfoCircle = faInfoCircle;
  infoIcon = faCircleInfo;
  pageSize = 10;
  pageIndex = 0;
  hasMoreData = true;
  isApiCallInProgress = false;
  faRefresh = faRefresh;
  searchTerm: string = '';
  startDate: string = '';
  endDate: string = '';
  selectedFilter: string = 'All';
  filterOptions: string[] = ['All', 'Ongoing', 'Announced', 'Claimable'];
  filterSearchTerm: string = '';
  selectedRecord: any = null;
  dropdownOpen: boolean = false;
  isModalShown: boolean = false;

  customerId: string = '';
  grainBackdrop: SafeHtml = '';

  constructor(
    private Apicallservice: ApiCallService,
    private toaster: ToastrService,
    private lotteryDataService: UtilsService,
    private loaderService: LoaderService,
    private ErroHandling: ErrorhandlingService,
    private _utils: UtilsService,
  ) {
    this.grainBackdrop = this._utils.getGrainBackdrop();
  }

  ngOnInit() {
    this.lotteryDataService
      .getTriggerLotteryTickethistoryObservable()
      .subscribe(() => {
        this.resetAndLoad();
      });

    const storedId = localStorage.getItem('customerId');
    this.customerId = storedId || '';

    if (!this.customerId) {
      this.toaster.error('Customer ID not found in localStorage.');
      return;
    }

    this.resetAndLoad();
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  OnRefreash() {
    this.resetAndLoad();
  }
  get filteredFilterOptions() {
    if (!this.filterSearchTerm) {
      return this.filterOptions;
    }
    return this.filterOptions.filter((option) =>
      option.toLowerCase().includes(this.filterSearchTerm.toLowerCase()),
    );
  }
  onFilterSearchClick(event: Event) {
    event.stopPropagation();
  }

  FilterOption: any;
  selectOption(option: string) {
    this.selectedFilter = option;
    this.filterSearchTerm = '';
    if (option === 'All') {
      this.FilterOption = 'All';
    } else if (option === 'Ongoing') {
      this.FilterOption = 'Open';
    } else if (option === 'Announced') {
      this.FilterOption = 'Close';
    } else if (option === 'Claimable') {
      this.FilterOption = 'Claimed';
    }
    this.resetAndLoad();
    this.dropdownOpen = false;
  }

  onSearchChange() {
    this.applyFilters();
  }

  resetAndLoad() {
    this.pageIndex = 0;
    this.allRecords = [];
    this.lotteryRecords = [];
    this.hasMoreData = true;
    this.getLotteryTickets();
  }

  GetLotteryPayload() {
    return {
      customerId: this.customerId,
      pageNumber: this.pageIndex + 1,
      pageSize: this.pageSize,
      searchText: this.searchTerm,
      startDate: this.startDate || '',
      serialNumber: 0,
      isExport: false,
      endDate: this.endDate || '',
      orderBy: '',
      totalRecords: 0,
      status: this.FilterOption,
    };
  }

  getLotteryTickets() {
    if (!this.hasMoreData || this.isApiCallInProgress) return;

    this.isApiCallInProgress = true;
    this.loaderService.show();

    const payload = this.GetLotteryPayload();
    this.Apicallservice.PostCallWithToken(
      payload,
      'Lottery/GetCustomerPurchasedLotteries',
    ).subscribe({
      next: (res: any) => {
        if (res.responseCode === 200) {
          const newData = res.data || [];

          if (newData.length < this.pageSize) {
            this.hasMoreData = false;
          }

          this.allRecords.push(...newData);
          this.applyFilters();
          this.pageIndex++;
        } else {
          this.toaster.error('Failed to load lottery data.');
          this.hasMoreData = false;
        }
        this.loaderService.hide();
        this.isApiCallInProgress = false;
      },
      error: () => {
        this.toaster.error('Something went wrong while fetching data');
        this.loaderService.hide();
        this.isApiCallInProgress = false;
      },
    });
  }

  applyFilters() {
    let filtered = this.allRecords;

    if (this.searchTerm) {
      filtered = filtered.filter((record) =>
        record.Lottery?.toLowerCase().includes(this.searchTerm.toLowerCase()),
      );

      // If no matches locally, call API to fetch from backend
      if (filtered.length === 0) {
        this.pageIndex = 0;
        this.allRecords = [];
        this.lotteryRecords = [];
        this.hasMoreData = true;
        this.getLotteryTickets();
        return;
      }
    }

    this.lotteryRecords = filtered;
  }

  onLotteryScroll() {
    const element = this.lotteryTable?.nativeElement;
    if (!element) return;

    const atBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (atBottom) {
      this.getLotteryTickets();
    }
  }

  onMobileScroll(event: any) {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      //  alert('scrolled to the bottom');
      const atBottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

      if (atBottom) {
        this.getLotteryTickets();
      }
    }
  }

  openModal(record: any) {
    this.loaderService.show();
    this.isModalShown = false;

    const LotteryId = record.LotteryId;

    if (!LotteryId) {
      this.toaster.error('Lottery ID not found!');
      this.loaderService.hide();
      return;
    }

    this.Apicallservice.GetCallWithToken(
      `Lottery/GetCustomerPurchasedLotteryDetailsById?LotteryId=${LotteryId}`,
    ).subscribe({
      next: (response: any) => {
        if (response.responseCode === 200) {
          this.selectedRecord = response.data[0];
          this.isModalShown = true;
        } else {
          this.toaster.error('Failed to fetch ticket details');
        }
        this.loaderService.hide();
      },
      error: () => {
        this.toaster.error('Something went wrong while fetching data');
        this.loaderService.hide();
      },
    });
  }

  closeModal() {
    this.selectedRecord = null;
    this.isModalShown = false;
  }

  /////////////////// Customer Claim Request

  claimRequest(record: any) {
    const payload = {
      lotteryId: record.LotteryId,
      customerId: localStorage.getItem('customerId'),
      ticketNumber: record.Numbers,
    };

    this.loaderService.show();

    this.Apicallservice.PostCallWithToken(
      payload,
      'Lottery/CreateLotteryClaimRequest',
    ).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.toaster.success(response.responseMessage, 'Success');
        } else {
          this.ErroHandling.handleResponseError(response);
        }

        this.loaderService.hide();
        this.resetAndLoad();
      },
      error: (error) => {
        this.ErroHandling.handleHttpError(error);
        this.loaderService.hide();
      },
    });
  }

  back() {
    window.history.back();
  }
}
