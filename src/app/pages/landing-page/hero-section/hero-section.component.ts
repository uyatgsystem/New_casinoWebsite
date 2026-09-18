import { Component, OnInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  
  // Live Simulated Jackpot Counter
  jackpotAmount: number = 1254890.45;
  private jackpotInterval: any;

  // Live Winners Micro Feed
  recentWinners = [
    { user: 'Alex***', won: '$4,850', game: 'Fortune Wheel' },
    { user: 'Sophia***', won: '$12,400', game: 'Mega Jackpot' },
    { user: 'Tariq***', won: '$1,920', game: 'Lucky Spin' },
    { user: 'Elena***', won: '$6,500', game: 'VIP Roulette' }
  ];
  currentWinnerIndex: number = 0;
  private winnerInterval: any;

  constructor(private router: Router) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.jackpotInterval = setInterval(() => {
        // Increment subtly to create real-time excitement
        this.jackpotAmount += Math.floor(Math.random() * 8) + 1.25;
      }, 2500);

      this.winnerInterval = setInterval(() => {
        this.currentWinnerIndex = (this.currentWinnerIndex + 1) % this.recentWinners.length;
      }, 3500);
    }
  }

  ngOnDestroy(): void {
    if (this.jackpotInterval) clearInterval(this.jackpotInterval);
    if (this.winnerInterval) clearInterval(this.winnerInterval);
  }

  RedirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  RedirectToSignUp(): void {
    this.router.navigate(['/SignUp']);
  }

  scrollToWheel(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById('spinScrollSection');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
}
