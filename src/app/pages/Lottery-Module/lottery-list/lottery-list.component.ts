import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { LoaderComponent } from '../../../components/loader/loader.component';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, RouterLink } from '@angular/router';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { UtilsService } from '../../../Services/utils.service';
import { LoaderService } from '../../../Services/loader-service.service';
import { GuideStep } from '../../../Interfaces/interfaces';
import { SafeHtml } from '@angular/platform-browser';
type ActiveTabType = 'Today' | 'upcoming' | 'winners' | 'myLottery';

@Component({
  selector: 'app-lottery-list',
  standalone: true,
  imports: [CommonModule, LoaderComponent, FormsModule, RouterModule],
  templateUrl: './lottery-list.component.html',
  styleUrl: './lottery-list.component.scss',
})
export class LotteryListComponent implements OnInit, OnDestroy {
  startDate: string | null = null;
  endDate: string | null = null;
  searchTerm: string = '';
  activeeTab: ActiveTabType = 'Today';

  selectedNav: 'Today' | 'myLottery' | 'claim' | 'winners' = 'Today';

  selectNav(nav: 'Today' | 'myLottery' | 'claim' | 'winners') {
    this.selectedNav = nav;
  }

  cardList: any[] = [];
  originalLotteryList: any[] = [];
  displayedLotteryList: any[] = [];
  lotteryList: any[] = [];
  Math = Math;

  showLimit = 100;
  showAll = false;
  intervalRef: any;
  status: any = 'open';
  customerId: number = 0;
  isLoading: boolean = false;
  selectedTab: 'Today' | 'upcoming' | 'winners' | 'myLottery' | 'claim' =
    'Today';
  activeTab: 'Today' | 'upcoming' | 'winners' | 'myLottery' | 'claim' = 'Today';

  grainBackdrop: SafeHtml = '';

  constructor(
    private router: Router,
    private Apicallservice: ApiCallService,
    private toaster: ToastrService,
    private lotteryDataService: UtilsService,
    public loaderService: LoaderService,
    private _utils: UtilsService,
  ) { }

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

  dropdownOpen = false;
  selectedFilter = 'Today';
  mobileSearchExpanded: boolean = false;

  @ViewChild('mobileSearchInput')
  mobileSearchInput!: ElementRef<HTMLInputElement>;

  selectFilter(filter: string, event: Event) {
    event.preventDefault();
    this.selectedFilter = filter;
    this.dropdownOpen = false;
    console.log('Filter selected:', filter);
  }

  // Return true when client viewport is small (mobile). Safe-guard for SSR.
  isSmallScreen(): boolean {
    try {
      return window.innerWidth < 640; // Tailwind 'sm' breakpoint
    } catch (e) {
      return false;
    }
  }

  // Toggle mobile search expansion (only on small screens). Focus input when expanded.
  toggleMobileSearch(): void {
    if (!this.isSmallScreen()) return;
    this.mobileSearchExpanded = !this.mobileSearchExpanded;
    if (this.mobileSearchExpanded) {
      setTimeout(() => {
        try {
          this.mobileSearchInput?.nativeElement?.focus();
        } catch (e) {
          // ignore
        }
      }, 50);
    }
  }
  // Tabs Filter

  // setTodayDate() {
  //   const today = new Date().toISOString().split('T')[0];
  //   this.startDate = today;
  //   this.status = 'open';
  // }

  changeTab(tab: 'Today' | 'upcoming' | 'winners' | 'myLottery' | 'claim') {
    this.showWinnersModal = false;
    this.selectedTab = tab;
    this.activeTab = tab;

    if (tab === 'Today') {
      //this.setTodayDate();
      this.status = 'open';
      this.customerId = 0;
    } else {
      this.startDate = null;
    }

    if (tab === 'upcoming') {
      this.status = 'open';
      this.startDate = null;
      this.customerId = 0;
    }

    if (tab === 'winners') {
      this.status = 'close';
      this.customerId = 0;
    }

    if (tab === 'myLottery') {
      this.status = 'open';
      this.customerId = Number(localStorage.getItem('customerId')) || 0;
    }

    this.GetAllLotteries();
  }

  onSearch() {
    this.GetAllLotteries();
  }

  //  clear search when input is empty
  onSearchInputChange(event: any) {
    if (event.key !== 'Enter') {
      // If search input is empty
      if (!this.searchTerm || this.searchTerm.trim() === '') {
        this.clearSearch();
      }
    }
  }

  // Clear search and reset to show all lotteries
  clearSearch() {
    this.searchTerm = '';
    this.GetAllLotteries();
  }

  ////new tabs
  showWinnersModal = false;

  openWinnersModal() {
    this.showWinnersModal = true;
  }

  closeWinnersModal() {
    this.showWinnersModal = false;
  }

  RedirectToClaim(): void {
    this.selectedTab = 'claim';
    this.router.navigate(['/dashboard/lottery-history']);
  }

  // Api Call For Get Lotteries

  GetLotteryPayload() {
    return {
      pageNumber: 1,
      pageSize: 10,
      searchText: this.searchTerm || '',
      startDate: this.startDate || '',
      serialNumber: 0,
      isExport: false,
      endDate: this.endDate || '',
      orderBy: '',
      totalRecords: 0,
      status: this.status,
      customerId: this.customerId,
    };
  }

  showNoDataFlag = false;
  GetAllLotteries() {
    this.isLoading = true;
    // this.loaderService.show();
    this.displayedLotteryList = [];
    this.showNoDataFlag = false;
    const payload = this.GetLotteryPayload();
    this.Apicallservice.PostCallWithToken(
      payload,
      'Lottery/GetAllLotteries',
    ).subscribe(
      (response: any) => {
        if (response.responseCode === 200) {
          this.cardList = response.data.records;
          this.originalLotteryList = [...this.cardList];
          this.updateDisplayedList();
          this.setupTimers();
          if (this.lotteryList.length == 0) {
            this.showNoDataFlag = true;
          }
          this.isLoading = false;
          this.loaderService.hide();
        } else {
          this.isLoading = false;
          this.toaster.info(response.errorMessage, 'info');
          this.loaderService.hide();
        }
      },
      (error: any) => {
        this.toaster.warning(error);
        this.isLoading = false;
        this.loaderService.hide();
      },
    );
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

  onShowMore() {
    this.showAll = true;
    this.updateDisplayedList();
    this.setupTimers();
  }

  onShowLess() {
    this.showAll = false;
    this.updateDisplayedList();
    this.setupTimers();
  }

  ngOnDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  // Open Modals For See Buy or Announce Ticket Numbers

  BuyTicket(card: any) {
    this.lotteryDataService.setLotteryData(card);
    this.router.navigate(['/dashboard/lottery-number']);
  }

  isAnnounceWinnerLoad: boolean = false;
  announcedTickets: any[] = [];

  AnnounceTicket(card: any) {
    this.announcedTickets = [];

    this.showWinnersModal = true;

    this.Apicallservice.GetCallWithToken(
      'Lottery/GetAnnouncedTickets?LotteryId=' + card.Id,
    ).subscribe(
      (response: any) => {
        if (response.responseCode === 200 && Array.isArray(response.data)) {
          this.announcedTickets = response.data;
        } else {
          this.toaster.error(response.message || 'No winners found');
        }
      },
      (error: any) => {
        this.toaster.warning(error);
      },
    );
  }

  /////////////////////////  Show Guide Line

  showGuide() {
    const steps: GuideStep[] = [
      {
        imageUrl:
          'https://cmaxv2images2.pages.dev/assets/user-manual/Lotteryguide.png',
      },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery6.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery4.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery3.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery2.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery1.png',
      // },
    ];

    this._utils.open(steps, 0, {
      title: 'Lottery Guide',
    });
  }
}
