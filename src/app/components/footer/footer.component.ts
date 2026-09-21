import { Component, Input } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { UtilsService } from '../../Services/utils.service';
import { NgIf } from '@angular/common';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { ApiCallService } from '../../Services/api-call-service.service';
import { Subject, takeUntil } from 'rxjs';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-footer',
  imports: [FontAwesomeModule, NgIf, RouterModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  isChatVisible: boolean = false;
  grainBackdrop: SafeHtml = '';
  constructor(
    private router: Router,
    private _utils: UtilsService,
    private apiCallService: ApiCallService,
  ) {
    this.grainBackdrop = this._utils.getGrainBackdrop();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Check for token and get chat count on each route change
        if (this.token) {
          this.getChatCount();
        }
      }
    });
    this._utils.showComponent$.subscribe((visible: boolean) => {
      this.isChatVisible = visible;
      console.log('this.isChatVisible', this.isChatVisible);
      // if (!visible && this.token) {
      //   this.getChatCount();
      // }
    });
  }
  private destroy$ = new Subject<void>();
  facebook = faFacebook;
  twitter = faTwitter;
  @Input() chatUnreadCount: number = 0;
  get token(): string | null {
    // if (this.isBrowser) {
    const token = localStorage.getItem('token');
    return token;
    // }
    // return '';
  }
  ngOnInit() {
    // if (this.token) {
    //   this.getChatCount();
    // }
    // const token = this._utils.getItem('token');
    // if (token && token !== '') {
    //   this.getChatCount();
    // }
    this._utils
      .getTriggerChatUnReadCountObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.getChatCount();
      });
  }
  unreadCounts: number = 0;
  Wallet = faWallet;
  async getChatCount() {
    try {
      await this.apiCallService
        .GetCallWithToken('NotificationMessages/GetUnReadChatMessages')
        .subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              this.unreadCounts = response.data[0].UnreadCount;
            }
          },
          error: (error) => {
            // this.apiCallService.handleError(error);
          },
        });
    } catch (error: any) {
      // this.apiCallService.handleError(error);
    }
  }
  RedirectDashboard() {
    if (localStorage.getItem('token')) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
  hideChatComponentAndRedirection() {
    this._utils.toggleComponentVisibility(false);
    // this._utils.showComponentSubject.next(false);
    // this._utils.showComponentSubject.closed = false;
    this._utils.triggerChatReadFunction();
  }
  RedirectSignup() {
    this.router.navigate(['/SignUp']);
  }

  currentYear = new Date().getFullYear();

  // * Scrolls to a landing-page section, navigating home first if needed
  goToSection(sectionId: string) {
    if (this.router.url === '/') {
      this.scrollToId(sectionId);
    } else {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => this.scrollToId(sectionId), 300);
      });
    }
  }

  private scrollToId(sectionId: string) {
    const element =
      document.getElementById(sectionId) ||
      (sectionId === 'instantGameScrollSection'
        ? document.getElementById('quick-scrolling-id')
        : null);
    if (element) {
      const yOffset = -85;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  // * Router navigation function
  changeRoute(path: string) {
    this._utils.toggleComponentVisibility(false);
    // this._utils.showComponent$.emit(false);
    this.router.navigate([path]);
    // this._utils.toggleComponentVisibility(false);
  }

  showChatComponent() {
    this._utils.toggleComponentVisibility(true);
  }

  openDeposit() {
    this._utils.toggleComponentVisibility(false);
    this.router.navigate(['/dashboard/wallet'], { queryParams: { openDeposit: 'true' } });
  }
  isDashboardRoute(): boolean {
    // if (localStorage.getItem('token')) {
    return this.router.url.includes('dashboard');
    // }
  }
  isScreenWidthLessThan800(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 800;
  }
  isTreasurePickRoute(): boolean {
    const current = this.router.url;
    return (
      current === '/dashboard/TreasurePick' ||
      current === '/dashboard/Avaitar' ||
      current === '/dashboard/Baccaret' ||
      current === '/dashboard/Roulette' ||
      current === '/dashboard/Mines' ||
      current === '/dashboard/Plinko' ||
      current === '/dashboard/StackBuilder' ||
      current === '/dashboard/Keno'||
      current === 'dashboard/coin' 
      
    );
  }
}
