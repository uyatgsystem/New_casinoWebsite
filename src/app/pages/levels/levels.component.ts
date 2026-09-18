import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faTrophy,
  faCrown,
  faShieldAlt,
  faGem,
  faGift,
  faBolt,
  faCheckCircle,
  faLock,
  faSyncAlt,
  faCoins,
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-levels',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './levels.component.html',
  styleUrls: ['./levels.component.scss'],
})
export class LevelsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Icons
  faArrowLeft = faArrowLeft;
  faTrophy = faTrophy;
  faCrown = faCrown;
  faShieldAlt = faShieldAlt;
  faGem = faGem;
  faGift = faGift;
  faBolt = faBolt;
  faCheckCircle = faCheckCircle;
  faLock = faLock;
  faSyncAlt = faSyncAlt;
  faCoins = faCoins;

  // Player Level Telemetry
  playerLevel: string = 'Bronze';
  levelRank: number = 1;
  customerTotalDeposit: number = 0;
  levels: any[] = [];
  isLoading: boolean = false;

  // Fallback / Preset Tier Blueprint
  tierDefinitions: any[] = [
    {
      level: 1,
      name: 'Bronze',
      image: '/BrornzeLevel.png',
      badgeColor: '#CD7F32',
      minDeposit: 0,
      maxDeposit: 100,
      redeemPercent: 5,
      rakeback: '2.5%',
      weeklyBonus: '$10',
      lossback: '5%',
      perks: [
        'Instant Deposit Settling',
        '2.5% Daily Rakeback',
        'Standard Cashout Queue',
        'Community Chat Access',
      ],
    },
    {
      level: 2,
      name: 'Silver',
      image: '/SilverLevel.png',
      badgeColor: '#C0C0C0',
      minDeposit: 101,
      maxDeposit: 500,
      redeemPercent: 10,
      rakeback: '5.0%',
      weeklyBonus: '$35',
      lossback: '7.5%',
      perks: [
        '5.0% Daily Rakeback Boost',
        'Weekly Reload Multipliers',
        'Priority Payout Processing',
        'Bronze + Silver Scratch Access',
      ],
    },
    {
      level: 3,
      name: 'Gold',
      image: '/GoldLevel.png',
      badgeColor: '#FFD700',
      minDeposit: 501,
      maxDeposit: 1500,
      redeemPercent: 15,
      rakeback: '8.5%',
      weeklyBonus: '$100',
      lossback: '10%',
      perks: [
        '8.5% Daily High-Roller Rakeback',
        'VIP Weekly Bonus Air-Drops',
        'Direct Priority Cashout Lane',
        'Level-Up Milestone Bonus',
      ],
    },
    {
      level: 4,
      name: 'Platinum',
      image: '/PlatinumLevel.png',
      badgeColor: '#00F5D4',
      minDeposit: 1501,
      maxDeposit: 3500,
      redeemPercent: 20,
      rakeback: '12.0%',
      weeklyBonus: '$250',
      lossback: '12.5%',
      perks: [
        '12.0% Platinum Rakeback',
        'Dedicated VIP Account Host',
        'Instant Uncapped Withdrawals',
        'Exclusive High-Roller Tournaments',
      ],
    },
    {
      level: 5,
      name: 'Diamond',
      image: '/DiamondLevel.png',
      badgeColor: '#2CD97D',
      minDeposit: 3501,
      maxDeposit: 10000,
      redeemPercent: 25,
      rakeback: '15.0%',
      weeklyBonus: '$600',
      lossback: '15%',
      perks: [
        '15.0% Maximum Apex Rakeback',
        'Private 24/7 Concierge Host',
        'Zero Payout Waiting Time',
        'Custom High-Roller Gifts & Drops',
      ],
    },
  ];

  constructor(
    private apiCallService: ApiCallService,
    private handleerror: ErrorhandlingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.getCustomerLevel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCustomerLevel(): void {
    this.isLoading = true;
    const customerId = localStorage.getItem('customerId') || '';

    this.apiCallService
      .GetCallWithToken(`Customer/GetCustomerLevel?CustomerId=${customerId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response && response.responseCode === 200 && response.data) {
            const data = response.data;
            this.playerLevel = data.playerLevel || 'Bronze';
            this.customerTotalDeposit = Number(data.customerTotalDeposit) || 0;

            const apiLevels = (data.levels || []).slice().sort(
              (a: any, b: any) => (a.MinDepositRange || 0) - (b.MinDepositRange || 0)
            );

            if (apiLevels.length > 0) {
              // Merge API data with rich tier metrics
              this.levels = apiLevels.map((lvl: any, idx: number) => {
                const def = this.tierDefinitions[idx] || this.tierDefinitions[this.tierDefinitions.length - 1];
                return {
                  ...def,
                  name: lvl.LevelName || def.name,
                  minDeposit: lvl.MinDepositRange ?? def.minDeposit,
                  maxDeposit: lvl.MaxDepositRange ?? def.maxDeposit,
                  redeemPercent: Number(lvl.RedeemPercentageOnBonusWallet) || def.redeemPercent,
                  image: this.getLevelImage(lvl.LevelName || def.name),
                };
              });
            } else {
              this.levels = this.tierDefinitions;
            }

            // Calculate level rank
            const rankIdx = this.levels.findIndex(
              (l) => l.name.toLowerCase() === this.playerLevel.toLowerCase()
            );
            this.levelRank = rankIdx >= 0 ? rankIdx + 1 : 1;
          } else {
            this.levels = this.tierDefinitions;
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.levels = this.tierDefinitions;
        },
      });
  }

  getLevelImage(levelName: string): string {
    const name = (levelName || '').toLowerCase();
    if (name.includes('bronze')) return '/BrornzeLevel.png';
    if (name.includes('silver')) return '/SilverLevel.png';
    if (name.includes('gold')) return '/GoldLevel.png';
    if (name.includes('platinum')) return '/PlatinumLevel.png';
    if (name.includes('diamond')) return '/DiamondLevel.png';
    return '/BrornzeLevel.png';
  }

  getCurrentTierObj(): any {
    return (
      this.levels.find(
        (l) => l.name.toLowerCase() === this.playerLevel.toLowerCase()
      ) || this.levels[0] || this.tierDefinitions[0]
    );
  }

  getNextTierObj(): any {
    const currentIdx = this.levels.findIndex(
      (l) => l.name.toLowerCase() === this.playerLevel.toLowerCase()
    );
    if (currentIdx >= 0 && currentIdx < this.levels.length - 1) {
      return this.levels[currentIdx + 1];
    }
    return null; // Already max tier (Diamond)
  }

  getDepositProgress(): number {
    const currentTier = this.getCurrentTierObj();
    const nextTier = this.getNextTierObj();
    if (!nextTier) return 100; // Apex level reached

    const min = Number(currentTier?.minDeposit) || 0;
    const max = Number(nextTier?.minDeposit) || 1000;
    if (max <= min) return 100;

    const percent = ((this.customerTotalDeposit - min) / (max - min)) * 100;
    return Math.min(Math.max(Math.round(percent), 0), 100);
  }

  getRemainingDeposit(): number {
    const nextTier = this.getNextTierObj();
    if (!nextTier) return 0;
    const needed = (Number(nextTier?.minDeposit) || 0) - this.customerTotalDeposit;
    return Math.max(0, Math.round(needed * 100) / 100);
  }

  isTierUnlocked(tier: any): boolean {
    const tierIdx = this.levels.findIndex(
      (l) => l.name.toLowerCase() === tier.name.toLowerCase()
    );
    const currentIdx = this.levels.findIndex(
      (l) => l.name.toLowerCase() === this.playerLevel.toLowerCase()
    );
    return tierIdx <= currentIdx;
  }

  isCurrentTier(tier: any): boolean {
    return tier.name.toLowerCase() === this.playerLevel.toLowerCase();
  }

  navigateToWallet(): void {
    this.router.navigate(['/dashboard/wallet']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }
}
