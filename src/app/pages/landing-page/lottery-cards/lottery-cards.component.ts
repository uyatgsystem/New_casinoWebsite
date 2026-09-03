import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Input, Inject, PLATFORM_ID } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-lottery-cards',
  imports: [CommonModule],
  templateUrl: './lottery-cards.component.html',
  styleUrl: './lottery-cards.component.scss'
})
export class LotteryCardsComponent {



  constructor(private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {

  }

  originalLotteryList: any[] = [];
  displayedLotteryList: any[] = [];
  lotteryList: any[] = [];

  showLimit = 8;
  showAll = false;
  intervalRef: any;

  @Input() set lottery(value: any[]) {
    if (value && value.length) {
      this.originalLotteryList = value;
      this.showAll = false;
      this.updateDisplayedList();
      this.setupTimers();
    }
  }

  updateDisplayedList() {
    if (this.showAll) {
      this.displayedLotteryList = [...this.originalLotteryList];
    } else {
      this.displayedLotteryList = this.originalLotteryList.slice(0, this.showLimit);
    }
  }

  setupTimers() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }

    // Initialize timers immediately
    this.lotteryList = this.displayedLotteryList.map(item => ({
      ...item,
      time: this.calculateTimeLeft(item.DrawTime)
    }));

    this.intervalRef = setInterval(() => {
      this.lotteryList = this.displayedLotteryList.map(item => ({
        ...item,
        time: this.calculateTimeLeft(item.DrawTime)
      }));
    }, 1000);
  }

  calculateTimeLeft(drawTimeStr: string): { hh: string; mm: string; ss: string } {
    if (!drawTimeStr) return { hh: '00', mm: '00', ss: '00' };

    // Backend UTC time ko Date object me lo
    const utcDate = new Date(drawTimeStr);

    // Local timezone offset adjust karo
    const localTime = utcDate.getTime() - (utcDate.getTimezoneOffset() * 60000);

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
      ss: String(seconds).padStart(2, '0')
    };
  }




  // Show More Button

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


  RedirectToLogin() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.router.navigate(['/dashboard/lottery']);
      } else {
        this.router.navigate(['/login'], { queryParams: { redirectUrl: '/dashboard/lottery' } });
      }
    }
  }
}



