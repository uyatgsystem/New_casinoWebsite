import { CommonModule } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { LoaderService } from '../../../Services/loader-service.service';
import { ToastrService } from 'ngx-toastr';
import { GameService } from '../../../Services/game.service';

type TabValue = 'all-game' | 'quick-game' | 'hot-game' | 'upcoming-game';

@Component({
  selector: 'app-cmax-games',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cmax-games.component.html',
  styleUrl: './cmax-games.component.scss',
})
export class CmaxGamesComponent implements OnInit {
  tabs: { label: string; value: TabValue }[] = [
    { label: 'All Game', value: 'all-game' },
    { label: 'Quick Game', value: 'quick-game' },
    { label: 'Hot Game', value: 'hot-game' },
    { label: 'Upcoming Game', value: 'upcoming-game' },
  ];

  activeTab: TabValue = 'all-game';
  games: any[] = [];
  showAllGames: boolean = false;

  // Added lists and expansion flags for the new UI
  allGames: any[] = [];
  quickGames: any[] = [];
  dashboardInstantGames: any[] = [];
  showAllGamesExpanded = false;
  showQuickGamesExpanded = false;
  platformId = inject(PLATFORM_ID);

  // Carousel properties
  carouselScrollPosition: number = 0;
  ourGamesScrollPosition: number = 0;
  initiallyVisibleCount: number = 4;
  constructor(
    private router: Router,
    private apiService: ApiCallService,
    private errorHandler: ErrorhandlingService,
    private toastr: ToastrService,
    private loaderService: LoaderService,
    private gameService: GameService,
  ) {}

  ngOnInit(): void {
    this.loadAllGames();
    this.loadQuickGames(); // make sure endpoint is type=quick
    this.dashboardInstantGames = this.gameService.getDashboardInstantGames(); // add this
  }

  RedirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  onPlayGame(game: any): void {
    // Check if token exists
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        // User is logged in, redirect to game
        // Navigate to dashboard spinner as the main game login point
        this.router.navigate(['/dashboard', 'spinner']);
      } else {
        // User is not logged in, redirect to login page
        this.router.navigate(['/login']);
      }
    } else {
      // SSR: navigate to login page
      this.router.navigate(['/login']);
    }
  }

  getGameImage(gameName: string): any {
    const gameData = this.gameService.getGames();
    const game = gameData.find((g: any) => g.name === gameName);
    return game; // Return empty string if no game is found
  }
  // ✅ Load all games (top section)
  loadAllGames(): void {
    this.loaderService.show();
    const endpoint = `Public/GetGames`;

    this.apiService.GetCallWithoutToken(endpoint).subscribe(
      (response) => {
        if (response.responseCode === 200 && response.data) {
          this.allGames = response.data;
        } else {
          this.allGames = [];
        }
        this.loaderService.hide();
      },
      (error) => {
        this.allGames = [];
        this.loaderService.hide();
      },
    );
  }

  // ✅ Load quick games (bottom section)
  loadQuickGames(): void {
    this.loaderService.show();
    const endpoint = `Public/GetGames?type=hot`;
    // const endpoint = `Public/GetGames?type=quick`;

    this.apiService.GetCallWithoutToken(endpoint).subscribe(
      (response) => {
        if (response.responseCode === 200 && response.data) {
          this.quickGames = response.data;
        } else {
          this.quickGames = [];
        }
        this.loaderService.hide();
      },
      (error) => {
        this.quickGames = [];
        this.loaderService.hide();
      },
    );
  }

  // ✅ Change tab and reload data
  onTabChange(tab: TabValue) {
    this.activeTab = tab;

    switch (tab) {
      case 'quick-game':
        this.loadQuickGames();
        break;
      case 'hot-game':
        this.loadGamesByType('hot');
        break;
      case 'upcoming-game':
        this.loadGamesByType('upcoming');
        break;
      default:
        this.loadAllGames();
        break;
    }
  }

  get hasMoreGames(): boolean {
    return this.games.length > this.getInitialVisibleCount();
  }

  // Show 4 cards on desktop and 2 on small screens by default
  private getInitialVisibleCount(): number {
    const w = window.innerWidth || 0;
    return w >= 1024 ? 4 : 9;
  }

  getGameImageUrl(game: any): string {
    const baseUrl = 'https://api.casinomax.com'; // backend base URL
    return game.coverImage
      ? `${baseUrl}${game.coverImage}`
      : game.image
        ? `${baseUrl}${game.image}`
        : 'assets/placeholder.png';
  }
  // All Games (top section)
  get displayedAllGames() {
    if (this.showAllGamesExpanded) return this.allGames;
    const count = this.getInitialVisibleCount();
    return this.allGames.slice(0, count);
  }

  get hasMoreAllGames(): boolean {
    return this.allGames.length > this.getInitialVisibleCount();
  }

  toggleAllGamesView() {
    this.showAllGamesExpanded = !this.showAllGamesExpanded;
  }

  // Quick Games (bottom section)
 get displayedQuickGames() {
  if (this.showQuickGamesExpanded) return this.dashboardInstantGames;
  const count = this.getInitialVisibleCount();
  return this.dashboardInstantGames.slice(0, count);
}

get hasMoreQuickGames(): boolean {
  return this.dashboardInstantGames.length > this.getInitialVisibleCount();
}

  toggleQuickGamesView() {
    this.showQuickGamesExpanded = !this.showQuickGamesExpanded;
  }

  // Generic loader for other types (hot/upcoming)
  loadGamesByType(type: string): void {
    this.loaderService.show();
    const endpoint = `Public/GetGames?type=${type}`;

    this.apiService.GetCallWithoutToken(endpoint).subscribe(
      (response) => {
        if (response.responseCode === 200 && response.data) {
          // keep using `games` for tab-specific views
          this.games = response.data;
        } else {
          this.games = [];
        }
        this.loaderService.hide();
      },
      (error) => {
        this.games = [];
        this.loaderService.hide();
      },
    );
  }

  // Carousel scroll methods
  scrollCarousel(direction: 'left' | 'right', carouselId: string): void {
    const carousel = document.getElementById(carouselId);
    if (carousel) {
      const scrollAmount = 300;
      if (direction === 'left') {
        carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }
}
