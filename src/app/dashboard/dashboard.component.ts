import { Component, HostListener } from '@angular/core';
import { LandingPageComponent } from '../pages/landing-page/landing-page.component';
import { SideBarComponent } from '../components/side-bar/side-bar.component';
import { SpinnerComponent } from '../components/spinner/spinner.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HomeComponent } from '../pages/home/home.component';
import { FooterComponent } from '../components/footer/footer.component';
import { Router } from '@angular/router';
import { Inject } from '@angular/core';
import { SidebarService } from '../Services/sidebar-service.service';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [SideBarComponent, CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  result: string | null = null;
  isSidebarOpen = true;
  showFreeSpinModal = false;
  constructor(
    @Inject(Router) public router: Router,
    private sidebarService: SidebarService,
  ) {
    this.checkScreenSize();
    this.sidebarService.sidebarOpen$.subscribe((isOpen) => {
      this.isSidebarOpen = isOpen;
    });
  }
  onSpinEnd(prize: string) {
    this.result = prize;
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    // this.isMobile = window.innerWidth < 800;
    if (window.innerWidth < 800) {
      this.isSidebarOpen = false;
    } else {
      this.isSidebarOpen = true;
    }
    // Adjust the width as needed
  }

  isSpinnerModule() {
    const current = this.router.url;
    return current === '/dashboard/spinner' || current === '/dashboard/home';
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
      current === '/dashboard/Keno' ||
      current === '/dashboard/Double' ||
      current === '/dashboard/coin' 
    );
  }
  ngOnInit(): void {
    // Check for first-time login modal
    if (localStorage.getItem('showFreeSpinModal') === 'true') {
      localStorage.removeItem('showFreeSpinModal');
      setTimeout(() => {
        this.showFreeSpinModal = true;
      }, 500);
    }
  }
  // Add these methods
  closeFreeSpinModal() {
    this.showFreeSpinModal = false;
  }

  navigateToSpinner() {
    this.showFreeSpinModal = false;
    this.router.navigate(['/dashboard/spinner']);
  }
}
