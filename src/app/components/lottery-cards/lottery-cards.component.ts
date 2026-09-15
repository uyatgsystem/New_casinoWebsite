import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../loader/loader.component';
import { ApiCallService } from '../../Services/api-call-service.service';
import { UtilsService } from '../../Services/utils.service';
import { LoaderService } from '../../Services/loader-service.service';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-lottery-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './lottery-cards.component.html',
  styleUrl: './lottery-cards.component.scss',
})
export class LotteryCardsComponent implements OnInit, OnDestroy {
  startDate: string | null = null;
  endDate: string | null = null;
  searchTerm: string = '';

  cardList: any[] = [];
  originalLotteryList: any[] = [];
  displayedLotteryList: any[] = [];
  lotteryList: any[] = [];
  Math = Math;
  grainBackdrop: SafeHtml = '';
  activeTab: 'all' | 'upcoming' = 'all';

  showLimit = 4;
  showAll = false;
  intervalRef: any;
  status: any;
  customerId: string = '';
  isLoading: boolean = true;
  platformId = inject(PLATFORM_ID);

  constructor(
    private router: Router,
    private Apicallservice: ApiCallService,
    private toaster: ToastrService,
    private lotteryDataService: UtilsService,
    public loaderService: LoaderService,
    private _utils: UtilsService,
  ) {}

  ngOnInit() {
    //this.setTodayDate();
    this.GetAllLotteries();
    this.grainBackdrop = this._utils.getGrainBackdrop();
    // Update on Listing socket
    this.lotteryDataService
      .getTriggerLotteryTicketObservable()
      .subscribe(() => {
        this.GetAllLotteries();
      });
  }

  RedirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Api Call For Get Lotteries

  trackById(index: number, item: any) {
    return item.SrNumber;
  }

  GetLotteryPayload() {
    return {
      pageNumber: 1,
      pageSize: 4,
      searchText: this.searchTerm || '',
      startDate: this.startDate || '',
      serialNumber: 0,
      isExport: false,
      endDate: this.endDate || '',
      orderBy: '',
      totalRecords: 0,
      status: 'open',
      customerId: this.customerId,
    };
  }
  datashow: boolean = false;
  showNoDataFlag = false;
  GetAllLotteries() {
    this.isLoading = true;
    const Token = localStorage.getItem('token');
    const currentUrl = this.router.url;
    const dashboardRoutes = ['/'];
    this.datashow = dashboardRoutes.some((path) => currentUrl == path);

    this.loaderService.show();
    this.displayedLotteryList = [];
    this.showNoDataFlag = false;

    const payload = this.GetLotteryPayload();

    // ⏱️ Timeout logic for fallback
    const loaderTimeout = setTimeout(() => {
      if (this.cardList.length === 0) {
        this.showNoDataFlag = true; // show "No Lottery Found"
        this.loaderService.hide();
        this.isLoading = false;
      }
    }, 8000); // 8 seconds (adjust as needed)

    const apiCall = this.datashow
      ? this.Apicallservice.PostCallWithoutToken(
          payload,
          'public/GetAllLotteries',
        )
      : this.Apicallservice.PostCallWithToken(
          payload,
          'Lottery/GetAllLotteries',
        );

    apiCall.subscribe(
      (response: any) => {
        clearTimeout(loaderTimeout); // 🛑 stop timeout if data comes

        this.loaderService.hide();
        this.isLoading = false;

        if (response.responseCode === 200) {
          const records =
            response && response.data && response.data.records
              ? response.data.records
              : response && response.data
                ? response.data
                : [];
          this.cardList = Array.isArray(records) ? records : [];
          this.originalLotteryList = [...this.cardList];
          this.updateDisplayedList();
          this.setupTimers();
          this.showNoDataFlag = this.cardList.length === 0;
        } else {
          this.showNoDataFlag = true;
        }
      },
      (error: any) => {
        clearTimeout(loaderTimeout); // 🛑 stop timeout on error too
        this.loaderService.hide();
        this.isLoading = false;
        this.showNoDataFlag = true;
      },
    );
  }

  trackByFn(index: number, card: any): any {
    return card.SrNumber ?? index;
  }

  // Calculate Remaining Time

  updateDisplayedList() {
    this.displayedLotteryList = this.showAll
      ? [...this.cardList]
      : this.cardList.slice(0, this.showLimit);
  }

  setupTimers() {
    if (this.intervalRef) clearInterval(this.intervalRef);

    this.lotteryList = this.displayedLotteryList.map((item) => ({
      ...item,
      time: this.calculateTimeLeft(item.DrawTime),
    }));

    this.intervalRef = setInterval(() => {
      this.lotteryList = this.displayedLotteryList.map((item) => ({
        ...item,
        time: this.calculateTimeLeft(item.DrawTime),
      }));
    }, 1000);
  }

  calculateTimeLeft(drawTimeStr: string): {
    hh: string;
    mm: string;
    ss: string;
  } {
    if (!drawTimeStr) return { hh: '00', mm: '00', ss: '00' };

    // Backend UTC time ko Date object me lo
    const utcDate = new Date(drawTimeStr);

    // Local timezone offset adjust karo
    const localTime = utcDate.getTime() - utcDate.getTimezoneOffset() * 60000;

    const now = Date.now();

    if (isNaN(localTime)) {
      console.warn('Invalid DrawTime:', drawTimeStr);
      return { hh: '00', mm: '00', ss: '00' };
    }

    let diff = Math.max(0, localTime - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      hh: String(hours).padStart(2, '0'),
      mm: String(minutes).padStart(2, '0'),
      ss: String(seconds).padStart(2, '0'),
    };
  }

  // Show More Show Less Buttons

  ngOnDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  // Open Modals For See Buy or Announce Ticket Numbers

  BuyTicket(card: any) {
    // Check if token exists
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        // User is logged in, proceed to lottery number
        this.lotteryDataService.setLotteryData(card);
        this.router.navigate(['/dashboard/lottery-number']);
      } else {
        // User is not logged in, redirect to login page
        this.router.navigate(['/login']);
      }
    } else {
      // SSR: navigate to login page
      this.router.navigate(['/login']);
    }
  }

  isAnnounceWinnerLoad: boolean = false;
  announcedTickets: any[] = [];
  get loaderArray(): number[] {
    return window.innerWidth <= 768 ? [1] : [1, 2, 3, 4];
  }

  toggleShowAllLottery() {
    this.showAll = !this.showAll;
    this.updateDisplayedList();
    this.setupTimers();
  }
}
