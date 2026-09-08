import { Component, OnInit, HostListener, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../Services/sidebar-service.service';
import { SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { LogoutmodelComponent } from '../header/logoutmodel/logoutmodel.component';
import { UtilsService } from '../../Services/utils.service';
import { faHouse, faUserEdit } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LocationService } from '../../Services/ip-check.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';

@Component({
  selector: 'app-side-bar',
  imports: [
    RouterModule,
    CommonModule,
    LogoutmodelComponent,
    FontAwesomeModule,
  ],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.scss',
})
export class SideBarComponent implements OnInit, AfterViewInit {
  isSidebarOpen = true;
  isMobile = false;
  faHouse = faHouse;
  faUserEdit = faUserEdit;
  referralCode: any = 'Referral code not available';
  profileImage: string = '';
  userName: any;
  email: any;
  grainBackdrop: SafeHtml = '';

  // Default active tab set to 'games' so it matches the initial load
  activeQuickTab: string = 'games';

  constructor(
    private sidebarService: SidebarService,
    private router: Router,
    private utilsService: UtilsService,
    private locationService: LocationService,
    private _errorHandleService: ErrorhandlingService
  ) { }

  ngOnInit() {
    this.sidebarService.sidebarOpen$.subscribe((isOpen) => {
      this.isSidebarOpen = isOpen;
    });
    this.checkScreenSize();
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.utilsService.headerData$.subscribe((headerData) => {
      if (headerData) {
        this.referralCode = headerData.referralCode ?? 'Referral code not available';
        if (headerData.referralCode) {
          localStorage.setItem('referralCode', headerData.referralCode);
        }
      }
    });
    this.referralCode =
      localStorage.getItem('referralCode') ?? 'Referral code not available';
  }

  ngAfterViewInit(): void {
    setInterval(() => {
      this.profileImage =
        localStorage.getItem('profileImage') ??
        'https://cmaxv2images2.pages.dev/assets/avatars/profileimage.png';
      this.userName = localStorage.getItem('userName') ?? '';
      this.email = localStorage.getItem('email') ?? '';
    }, 2000);

    this.UpdateCustomerLevel();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth < 800;
    if (this.isMobile) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = true;
    }
  }

  showCopiedTooltip = false;

  copyReferralCode() {
    const domainUrl = location.origin;
    navigator.clipboard.writeText(domainUrl + '?refCode=' + this.referralCode);

    this.showCopiedTooltip = true;

    setTimeout(() => {
      this.showCopiedTooltip = false;
    }, 1200);
  }

  RedirectToGuidelines() {
    this.router.navigate(['/dashboard/GuideLines']);
  }
  RedirectToSetting() {
    this.router.navigate(['/dashboard/edit-profile']);
  }

  closeSidebarMobile() {
    if (this.isMobile) {
      this.sidebarService.toggleSidebar();
    }
  }

  isLogoutModalOpen: boolean = false;
  closeLogoutModal() {
    this.isLogoutModalOpen = false;
  }
  logout() {
    this.utilsService.stopTokenExpiryWatcher();
    this.utilsService.triggerLogoutFunction();
  }
  redirecttoTermsConditions() {
    this.router.navigate(['dashboard/Terms&Conditions']);
  }
  showLogoutModal() {
    this.isLogoutModalOpen = true;
    this.isSidebarOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const sidebar = document.querySelector('.mobile');

    if (sidebar && this.isSidebarOpen && !sidebar.contains(target)) {
      this.isSidebarOpen = false;
    }
  }

  redirectTo(path: string) {
    this.router.navigate([path]);
    this.utilsService.toggleComponentVisibility(false);
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  RedirectToScratchCard() {
    this.utilsService.toggleComponentVisibility(false);
    this.closeSidebarMobile();
  }

  redirectToGame(path: string) {
    this.router.navigate([path]);
    this.utilsService.toggleComponentVisibility(false);
    this.closeSidebarMobile();
  }

  selectQuickTab(tab: string, path: string, sectionId: string) {
    this.activeQuickTab = tab;
    this.navigateAndScroll(path, sectionId);
  }

  navigateAndScroll(path: string, sectionId: string) {
    const doScroll = () => {
      setTimeout(() => {
        this.scrollToId(sectionId);
      }, 50);
      this.utilsService.toggleComponentVisibility(false);
      this.closeSidebarMobile();
    };

    if (this.router.url.startsWith(path)) {
      doScroll();
    } else {
      this.router.navigate([path]).then(() => doScroll());
    }
  }

  private scrollToId(id: string) {
    const el =
      document.getElementById(id) ||
      (document.querySelector('#' + id) as HTMLElement | null);

    if (el) {
      const offset = 120;
      const y = el.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: y,
        behavior: 'smooth',
      });
    }
  }

  isTreasurePickRoute(): boolean {
    const current = this.router.url;
    return (
      current === '/dashboard/TreasurePick' ||
      current === '/dashboard/Avatar' ||
      current === '/dashboard/Baccaret'
    );
  }

  showComletePorfile() {
    this.router.navigate(['dashboard/complete-profile']);
    this.closeSidebarMobile();
  }

  profileLevel: any;
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

  UpdateCustomerLevel() {
    const customerId = localStorage.getItem('customerId');

    this.locationService.UpdateCustomerLevel(customerId).subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          const level = response.data.level;
          this.profileLevel = level;
        } else {
          this._errorHandleService.handleResponseError(response);
        }
      },
      error: (error) => {
        this._errorHandleService.handleHttpError(error);
      }
    });
  }
}