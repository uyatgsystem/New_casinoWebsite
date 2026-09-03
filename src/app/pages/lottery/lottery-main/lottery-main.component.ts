import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotteryCardComponent } from '../lottery-card/lottery-card.component';
import { FormsModule } from '@angular/forms';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { Lottery } from '../lottery.type';
import { LoaderService } from '../../../Services/loader-service.service';

@Component({
  standalone: true,
  selector: 'app-lottery-main',
  imports: [CommonModule, LotteryCardComponent, FormsModule],
  templateUrl: './lottery-main.component.html',
  styleUrl: './lottery-main.component.scss',
})
export class LotteryMainComponent implements OnInit {
  activeTab: 'ongoing' | 'past' | 'Upcoming' = 'ongoing';
  searchText: string = '';
  lotteries: Lottery[] = [];
  isLoading: boolean = false;
  error: string | null = null;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalRecords: number = 0;

  constructor(private apiService: ApiCallService, private _loaderService: LoaderService) { }

  ngOnInit(): void {
    this.getLotteryData();
  }

  getLotteryData() {
    this._loaderService.show();
    this.isLoading = true;
    this.error = null;

    const payload = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
      searchText: this.searchText,
      startDate: '',
      serialNumber: 0,
      isExport: true,
      endDate: '',
      orderBy: '',
      totalRecords: this.totalRecords,
      isActive: true,
    };

    this.apiService
      .PostCallWithToken(payload, 'Lottery/GetAllLotteries')
      .subscribe({
        next: (response: any) => {
          if (response && response.data) {
            // Initialize UI properties for each lottery
            this.lotteries = response.data.map((lottery: Lottery) => ({
              ...lottery,
              timeLeft: ['00', '00', '00', '00'],
              buttonStyle: this.getInitialButtonStyle(lottery.Status),
            }));

            if (response.data.length > 0) {
              this.totalRecords = response.data[0].TotalRecords;
            }
          }
          this.isLoading = false;
          this._loaderService.hide();
        },
        error: (error) => {
          console.error('Error fetching lottery data:', error);
          this.error = 'Failed to load lottery data. Please try again.';
          this.isLoading = false;
          this._loaderService.hide();
        },
      });
  }

  private getInitialButtonStyle(status: 'Open' | 'Close' | 'Upcoming'): string {
    return status === 'Open'
      ? 'bg-green-600 text-white hover:bg-green-700'
      : status === 'Close'
        ? 'bg-yellow-500 text-black hover:bg-yellow-600'
        : 'bg-blue-600 text-white hover:bg-blue-700';
  }

  getFilteredLotteries(): Lottery[] {
    if (!this.lotteries) return [];

    return this.lotteries
      .filter((lottery) => {
        // Filter by tab
        if (this.activeTab.toLowerCase() === 'ongoing') {
          return lottery.Status === 'Open' && lottery.IsActive;
        } else if (this.activeTab.toLowerCase() === 'upcoming') {
          return lottery.Status === 'Upcoming' && lottery.IsActive;
        } else {
          return lottery.IsActive && lottery.Status === 'Close';
        }
      })
      .filter((lottery) => {
        // Filter by search text
        if (!this.searchText.trim()) return true;

        return (
          lottery.LotteryName.toLowerCase().includes(
            this.searchText.toLowerCase()
          ) ||
          lottery.InitialCode.toLowerCase().includes(
            this.searchText.toLowerCase()
          )
        );
      });
  }
  setActiveTab(tab: 'ongoing' | 'Upcoming' | 'past'): void {
    this.activeTab = tab;
  }

  onSearch(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.getLotteryData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.getLotteryData();
  }

  refreshData(): void {
    this.getLotteryData();
  }
}
