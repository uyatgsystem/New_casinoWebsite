import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HistoryBarComponent } from '../history-bar/history-bar.component';
import { HistoryModalComponent } from '../history-modal/history-modal.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ApiCallService } from '../../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../../Services/error-handling.service';
import { Location } from '@angular/common';
import { LoadingPageComponent } from '../loading-page/loading-page.component';
import { UtilsService } from '../../../../Services/utils.service';
import { SafeHtml } from '@angular/platform-browser';

type GameState = 'waiting' | 'flying' | 'crashed';

interface GameRound {
  id: string;
  crashPoint: number;
  timestamp: Date;
  betAmount: number;
  cashedOutAt?: number;
  won?: boolean;
}

@Component({
  selector: 'app-avaiator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HistoryBarComponent,
    HistoryModalComponent,
    LoadingPageComponent,
    ToastrModule,
  ],
  templateUrl: './avaitar.component.html',
  styleUrl: './avaitar.component.scss',
})
export class AvaitarComponent implements OnInit, OnDestroy, AfterViewInit {
  showLoading = true;
  grainBackdrop: SafeHtml = '';
  private readonly MAX_BET = 50;
  private readonly WAITING_SECONDS = 6;
  private readonly POST_CRASH_DELAY_MS = 3000;
  private readonly USE_DUMMY_API = false;
  // Multiplier animation tuning: lower values -> slower plane/multiplier growth
  private readonly MULTIPLIER_BASE_GROWTH = 0.55;
  private readonly MULTIPLIER_GROWTH_PER_LEVEL = 0.16;
  private readonly MULTIPLIER_SLOW_FACTOR = 0.65; // set <1 to slow down

  // Game States - controlled by frontend round engine
  gameState: GameState = 'waiting';
  multiplier = 1.0;
  betAmount = 10;
  balance = 0;

  getRoundedBalance(): number {
    return this.balance;
  }


  hasActiveBet = false;
  hasCashedOut = false;
  crashPoint = 0;
  gameHistory: GameRound[] = [];
  cashedOutAt: number | null = null;
  countdown = 0;
  currentBet = 0;
  showHistoryModal = false;

  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private roundTransitionTimer: ReturnType<typeof setTimeout> | null = null;
  private gameLoopFrame: number | null = null;
  private lastFrameTime = 0;
  private pendingCrashPoint: number | null = null;
  private isBetRequestInFlight = false;
  private waitingToStartFlight = false;

  // Canvas References
  @ViewChild('planeCanvas') planeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('circleCanvas') circleCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('HUDCanvas') HUDCanvas!: ElementRef<HTMLCanvasElement>;

  // Animation Properties
  private planeAnimFrame: number | null = null;
  private circleAnimFrame: number | null = null;
  private circleRotationAngle = 0;
  sidebarTab: 'players' | 'history' = 'players';
  allRoundsHistory: { crashPoint: number }[] = [];

  // Plane Animation State
  private planeX = 60;
  private planeY = 220;
  private movingState = 1;
  private planeAnimationCompleted = false;
  private holdingPatternCount = 0;
  private randY = 0;
  private readonly holdingPatternMax = 5;
  private readonly offset = 30;
  private readonly CanW = 600;
  private readonly CanH = 400;
  private readonly dotSpeed = 0.5;
  private readonly dotRadius = 2;
  private readonly maxDots = 10;
  private verticalDots: any[] = [];
  private horizontalDots: any[] = [];
  private planePath = [
    'm 53.7757 23.6376L44.9505 20.0334L54.856 17.827L56.2412 20.3838L53.7757 23.6376ZM8.01988 31.809L8.01759 31.8212L8.03795 31.8123L8.01988 31.809 z',
    'm 49.361 24.0711C48.9413 24.4952 48.0048 25.2545 46.91 24.8601C46.3767 24.6645 24.7899 15.9515 24.7351 15.9373C24.5848 15.8652 24.6688 15.5329 24.9484 15.6204L49.2759 23.7032C49.4286 23.7584 49.4807 23.9525 49.361 24.0711ZM50.0355 15.7794L46.3477 16.8709C46.3477 16.8709 45.6533 16.2532 46.6077 16.0209C46.8532 15.9618 47.425 15.7645 47.8839 15.6249C47.9407 15.6075 47.9912 15.5742 48.0296 15.5289C48.0679 15.4836 48.0924 15.4282 48.1001 15.3694C48.1078 15.3105 48.0985 15.2507 48.0731 15.1971C48.0478 15.1434 48.0076 15.0982 47.9572 15.0667L45.6396 13.5993C46.1256 13.3426 46.8208 13.2651 47.414 13.5694C47.7569 13.7475 49.1595 14.6696 50.0811 15.2729C50.3652 15.4581 50.2406 15.7215 50.0355 15.7794ZM41.6705 16.5983C41.2639 16.7871 38.9805 15.9065 38.9805 15.9065C38.9805 15.9065 42.0292 14.0787 44.5738 14.2464C45.3306 14.2966 46.7207 15.1529 46.7207 15.1529C46.7207 15.1529 43.1238 15.9186 41.6705 16.5983ZM67.2322 21.2346C66.5753 18.6165 66.1471 16.4051 65.9485 15.8577C65.3685 14.2747 64.0936 14.1159 62.9773 14.1015C60.0009 14.0578 58.7818 14.3549 53.4462 14.7512C52.6605 14.8165 51.173 14.9661 50.4458 14.5526C48.5166 13.4669 47.9977 12.7891 46.99 12.7155C45.4275 12.6046 42.0072 13.4908 38.1303 15.3393C36.9185 15.9056 36.8721 16.8429 36.5716 17.4121C36.5566 17.4407 36.5482 17.4723 36.5469 17.5046C36.5456 17.5369 36.5515 17.5691 36.5642 17.5988C36.5769 17.6285 36.596 17.6551 36.6202 17.6765C36.6444 17.6979 36.6731 17.7137 36.7041 17.7227C37.1896 17.8666 42.5212 19.3454 42.7627 19.4258C42.7289 19.4003 42.703 19.3659 42.6877 19.3265C42.6724 19.287 42.6683 19.2441 42.676 19.2025C42.6895 19.1302 42.7372 19.0643 42.8211 19.0406C44.5233 18.4988 50.6904 16.5842 54.3317 15.8848C59.3145 14.9165 60.4704 14.9289 61.9056 15.0601C62.2403 15.0917 62.6979 15.1991 63.0316 15.2833C63.3007 15.3555 63.5093 15.5661 63.5478 15.8324C63.8399 17.8241 64.9282 22.4036 65.6582 23.9879C65.6582 23.9879 65.4215 24.2871 65.0846 24.2417C64.8228 24.1983 64.3846 23.6103 64.1094 23.259C64.0786 23.2227 64.0372 23.1969 63.991 23.1851C63.9449 23.1734 63.8962 23.1764 63.8517 23.1936C57.6507 25.5735 53.3603 26.3149 52.7457 26.4114C52.6953 26.4203 52.6434 26.409 52.6013 26.3798L49.9562 24.7953C49.9562 24.7953 50.0794 24.7254 50.443 24.2474C50.5209 24.1343 50.5775 23.9993 50.5896 23.9093C50.6524 23.4541 50.2356 23.2709 50.0435 23.2084C49.305 22.9739 29.5488 16.2053 24.548 14.7582C22.4258 14.1382 20.165 14.8564 19.0611 15.8443L19.0601 15.8749L21.3866 19.4053C21.4385 19.4851 21.5334 19.5209 21.622 19.4973L24.0849 18.8809C24.0849 18.8809 24.2176 19.8963 23.8976 20.0036C21.8207 20.6819 19.8248 21.2618 17.8879 21.8554C17.108 22.0974 16.994 22.8056 16.5785 23.7556C16.4041 24.1533 16.2848 24.5245 16.2848 24.5245C16.2848 24.5245 20.6103 23.2873 23.248 22.5859C23.2926 22.5746 23.3396 22.5775 23.3825 22.5942C23.4254 22.611 23.462 22.6407 23.4871 22.6792C23.7642 23.1137 23.8619 23.22 24.0533 23.4975C24.0729 23.5256 24.0856 23.5578 24.0903 23.5917C24.095 23.6256 24.0916 23.6601 24.0805 23.6924C24.0693 23.7247 24.0506 23.7539 24.026 23.7776C24.0014 23.8014 23.9715 23.8189 23.9388 23.8289C23.31 24.0236 22.6627 24.2243 22.1595 24.4084C21.7608 24.5545 21.9932 25.3326 21.9932 25.3326L29.1568 23.4548C29.1568 23.4548 29.4922 23.9348 28.682 24.2461C27.4285 24.7385 16.0615 28.074 15.1638 27.93C12.7983 27.5506 9.17668 22.3098 7.69512 21.3383C6.4456 20.5195 4.81649 21.1711 2.62207 21.9598C2.02423 22.1784 2.20927 23.0098 2.20927 23.0098L5.34642 22.0982C5.34642 22.0982 5.62543 22.5724 5.1818 22.7449C3.62977 23.3627 1.45801 23.8651 1.10815 24.029C0.596089 24.2675 0.487335 25.815 0.487335 25.815L3.43345 25.0683C3.52189 25.0453 3.62213 25.0774 3.65312 25.1226L8.43985 31.7175C8.82519 31.6971 9.20802 31.6433 9.58404 31.5566L5.69111 25.5171C5.67269 25.4884 5.66123 25.4558 5.65763 25.4219C5.65403 25.3879 5.6584 25.3536 5.67039 25.3217C5.68237 25.2897 5.70165 25.261 5.72668 25.2378C5.7517 25.2147 5.7818 25.1976 5.81456 25.1881C6.35664 25.0286 6.98526 24.9568 7.70356 25.7513C8.30937 26.4146 10.4051 28.8613 12.8295 29.0928C13.6368 29.1731 13.6046 29.4176 13.6046 29.4176C13.6046 29.4176 12.5012 29.7143 11.1777 30.1456C10.5228 30.3622 10.8453 31.3161 10.8453 31.3161C17.4583 29.9516 25.6084 28.2389 26.7533 27.9814C26.7918 27.9737 26.8316 27.9761 26.8689 27.9884C26.9062 28.0008 26.9396 28.0226 26.966 28.0518L28.4815 29.7871C28.6603 30.2253 42.2036 27.7437 46.4671 26.509C46.7045 26.443 48.6704 26.9016 49.6294 27.0717C50.0697 27.1537 50.0171 27.3424 50.0171 27.3424C50.0171 27.3424 16.04 34.0018 8.33305 32.2653L8.31858 32.2713L6.53352 32.6701C7.38492 33.4887 6.94841 34.5477 8.75643 34.0042C8.81244 34.2485 8.88359 34.5082 8.95614 34.7856C9.14699 35.5393 9.14627 35.5431 11.3768 35.2234C17.6855 34.3305 45.8624 31.3622 52.3008 30.0132C55.935 29.2557 60.9587 28.2108 64.2037 26.9573C67.4043 25.7268 68.1596 24.9251 67.2335 21.2348M72.6366 35.7655L72.5815 35.8247L72.5469 35.7488C72.5251 35.7006 70.3844 30.8902 69.6307 29.0416C69.4027 28.4841 69.8255 28.305 69.8255 28.305L69.8729 28.2872L69.896 28.3316C70.0113 28.5447 72.6434 33.6399 72.9401 34.5422C73.1682 35.218 72.6588 35.7429 72.6366 35.7655ZM73.5104 35.0199C73.4611 34.2412 73.0016 29.0587 72.5424 27.1034L70.1112 20.0023C69.6787 20.398 69.18 20.8161 68.7238 21.1024C68.6399 21.1476 68.5536 21.1843 68.4566 21.2096C68.3422 21.2353 68.2241 21.24 68.108 21.2235L68.8826 27.9235C68.9833 28.9958 69.5031 29.9878 69.9257 30.975C70.1397 31.4645 71.6486 34.9127 72.2304 36.2355C72.3512 36.5119 72.7222 36.5891 72.9314 36.3702C73.3037 35.9854 73.5446 35.4812 73.5104 35.0199 Z',
    'm 67.6084 8.93516L67.5596 8.9528L67.5365 8.90841C67.4244 8.68577 64.7528 3.47978 64.4444 2.55056C64.2217 1.85642 64.7362 1.32173 64.7585 1.29916L64.8138 1.24266L64.8501 1.31625C64.8717 1.36903 67.0496 6.29531 67.8124 8.18095C68.0433 8.75171 67.6136 8.93213 67.6084 8.93516ZM68.6123 9.59122C68.4612 8.15492 67.9329 7.14396 67.5002 6.12879C66.713 4.30653 65.9226 2.48565 65.129 0.666152C65.1042 0.610123 65.066 0.561037 65.0178 0.523204C64.9696 0.485372 64.9129 0.459949 64.8525 0.449168C64.7922 0.438388 64.7302 0.442578 64.6719 0.461373C64.6135 0.480167 64.5607 0.51299 64.5181 0.556961C64.112 0.968903 63.8629 1.53437 63.8964 2.03225C63.9516 2.82544 64.3716 8.09471 64.8372 10.0946L67.1105 16.6125C67.2107 16.5376 67.329 16.4795 67.4569 16.4493C67.5434 16.4299 67.6326 16.4253 67.7207 16.4356C68.1711 16.4882 68.8668 16.6226 69.4958 16.7532L68.6123 9.59122 z',
    'm 67.6932 18.7679L67.3709 17.5368C67.3709 17.5368 67.3056 17.3497 67.5417 17.3015C67.5606 17.297 67.5796 17.2918 67.6022 17.2921C67.6022 17.2921 69.8229 17.6312 70.4905 17.8845C70.8444 18.0213 70.8354 18.1445 70.8354 18.1445L67.6932 18.7679ZM71.03 17.6811C70.1435 17.3195 68.4015 16.9821 67.3456 16.8481C67.3018 16.8399 67.2714 16.8343 67.2313 16.8308C67.2085 16.8312 67.1813 16.8302 67.1541 16.8331C67.1279 16.8375 67.1029 16.8472 67.0806 16.8615C66.9474 16.9202 66.844 17.0632 66.8738 17.1937C67.1419 18.4017 67.4705 19.5955 67.8583 20.7706C67.9093 20.9344 68.1358 21.002 68.3144 20.9685C68.3513 20.9597 68.387 20.9469 68.4211 20.9303C69.4547 20.3307 70.496 19.4032 71.2258 18.4264C71.4502 18.1182 71.3992 17.8328 71.03 17.6811ZM59.8644 15.4203C59.8644 15.4203 59.1645 16.9818 58.1908 18.7542L57.311 17.0812L56.2982 17.3327L57.5947 19.8021C56.7946 21.156 55.8862 22.4816 55.0477 23.2064L56.8938 22.7489C57.3483 22.4609 57.7972 21.7911 58.2032 20.9636L58.917 22.3238L59.9354 22.0707L58.7246 19.7682C59.4055 18.0181 59.8715 16.0629 59.8644 15.4203 z',
  ];

  playerList = [
    { name: 'Alice Johnson', cashedOutAt: 7.44, amount: '$4,820' },
    { name: 'Michael Smith', cashedOutAt: 1.78, amount: '$3,200' },
    { name: 'Carlos Rivera', cashedOutAt: 5.08, amount: '$5,000' },
    { name: 'Priya Patel', cashedOutAt: 1.26, amount: '$52' },
    { name: 'Sara Williams', cashedOutAt: 2.16, amount: '$1,900' },
    { name: 'Daniel Kim', cashedOutAt: 2.70, amount: '$450' },
    { name: 'Emily Davis', cashedOutAt: 1.38, amount: '$4,516' },
    { name: 'James Brown', cashedOutAt: 1.21, amount: '$2,100' },
    { name: 'Fatima Noor', cashedOutAt: 1.89, amount: '$980' },
    { name: 'Liam O\'Connor', cashedOutAt: 1.74, amount: '$640' },
    { name: 'Chinedu Okoro', cashedOutAt: 3.0, amount: '$2,400' },
    { name: 'Nina Petrova', cashedOutAt: 4.53, amount: '$3,530' },
    { name: 'Ben Cooper', cashedOutAt: 7.29, amount: '$322' },
  ];

  // Auto Mode
  autoMode = false;
  autoCashoutAt = 2.0;

  // Statistics
  stats = {
    totalRounds: 0,
    totalWins: 0,
    biggestWin: 0,
    totalWagered: 0,
    totalWon: 0,
  };

  betRoundId: string | null = null;

  constructor(
    private apiCallService: ApiCallService,
    private errorHandle: ErrorhandlingService,
    private location: Location,
    private utilsService: UtilsService
    , private toastr: ToastrService
  ) {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
  }

  ngOnInit() {
    // Scroll to top when component loads
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    this.getWalletBalance();
    this.startWaitingRound();
  }

  private startWaitingRound() {
    this.clearRoundTimers();
    this.waitingToStartFlight = false;
    this.gameState = 'waiting';
    this.countdown = this.WAITING_SECONDS;
    this.multiplier = 1.0;
    this.resetPlane();
    this.resetPlanePosition();

    if (this.hasActiveBet && !this.hasCashedOut) {
      this.addHistory(false);
      this.hasActiveBet = false;
    }

    // Always clear any previous round bet state before a fresh countdown starts.
    this.hasActiveBet = false;
    this.hasCashedOut = false;
    this.cashedOutAt = null;
    this.currentBet = 0;

    this.crashPoint =
      this.pendingCrashPoint !== null
        ? this.pendingCrashPoint
        : this.getDefaultFrontendCrashPoint();
    this.pendingCrashPoint = null;

    this.countdownTimer = setInterval(() => {
      this.countdown = Math.max(0, this.countdown - 1);
      if (this.countdown === 0) {
        this.clearCountdownTimer();
        this.tryStartFlyingRound();
      }
    }, 1000);
  }

  private tryStartFlyingRound() {
    if (this.hasActiveBet && this.isBetRequestInFlight && this.pendingCrashPoint === null) {
      this.waitingToStartFlight = true;
      return;
    }

    if (this.gameState !== 'waiting') {
      return;
    }

    this.waitingToStartFlight = false;
    this.startFlyingRound();
  }

  private startFlyingRound() {
    this.gameState = 'flying';
    this.lastFrameTime = performance.now();
    this.startLocalMultiplierLoop();
  }

  private startLocalMultiplierLoop() {
    if (this.gameLoopFrame) {
      cancelAnimationFrame(this.gameLoopFrame);
    }

    const animate = (now: number) => {
      if (this.gameState !== 'flying') {
        return;
      }

      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      // Non-linear growth similar to Aviator pacing, scaled by slow factor.
      const growthRate = (this.MULTIPLIER_BASE_GROWTH + (this.multiplier - 1) * this.MULTIPLIER_GROWTH_PER_LEVEL) * this.MULTIPLIER_SLOW_FACTOR;
      this.multiplier += growthRate * dt;

      if (
        this.autoMode &&
        this.hasActiveBet &&
        !this.hasCashedOut &&
        this.multiplier >= this.autoCashoutAt
      ) {
        this.cashOut();
      }

      if (this.multiplier >= this.crashPoint) {
        this.multiplier = this.crashPoint;
        this.handleRoundCrash();
        return;
      }

      this.updatePlaneAnimation();
      this.gameLoopFrame = requestAnimationFrame(animate);
    };

    this.gameLoopFrame = requestAnimationFrame(animate);
  }

  private handleRoundCrash() {
    this.gameState = 'crashed';
    this.updatePlaneAnimation();

    if (this.hasActiveBet && !this.hasCashedOut) {
      this.addHistory(false);
      this.showToast(
        `Crashed at ${this.multiplier.toFixed(2)}x! You lost $${this.currentBet}`,
        'error'
      );
    }

    this.allRoundsHistory.unshift({ crashPoint: this.crashPoint });
    if (this.allRoundsHistory.length > 20) {
      this.allRoundsHistory = this.allRoundsHistory.slice(0, 20);
    }

    this.roundTransitionTimer = setTimeout(() => {
      this.startWaitingRound();
    }, this.POST_CRASH_DELAY_MS);
  }

  private getDefaultFrontendCrashPoint(): number {
    const pool: number[] = [10, 12];
    for (let x = 13; x <= 20; x++) {
      pool.push(x);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Update the resetForNewRound method
  // Update the resetForNewRound method
  private resetForNewRound() {
    this.resetPlane();
    this.resetPlanePosition();
    this.updatePlaneAnimation();
  }

  private onGameStart() {
    // console.log('Game started - plane taking off!');
    // Any additional logic when game starts
  }

  private onGameCrash() {
    // console.log(`Game crashed at ${this.multiplier}x`);

    // Handle any active bets that weren't cashed out
    if (this.hasActiveBet && !this.hasCashedOut) {
      this.addHistory(false); // Player lost
      this.showToast(
        `Crashed at ${this.multiplier.toFixed(2)}x! You lost $${this.currentBet
        }`,
        'error'
      );
    }

    // Add crash point to history for display
    this.allRoundsHistory.unshift({ crashPoint: this.crashPoint });
    if (this.allRoundsHistory.length > 20) {
      this.allRoundsHistory = this.allRoundsHistory.slice(0, 20);
    }
  }

  private updatePlaneAnimation() {
    // Update plane position based on multiplier for smooth curved animation
    if (this.gameState === 'flying') {
      // Use a more sophisticated curve calculation for smooth flight
      // Normalize progress from 1.0x to 10.0x instead of 0x to 10x
      const normalizedProgress = Math.min((this.multiplier - 1.0) / 9.0, 1); // Progress from 1x to 10x

      // Create a smooth curved path using bezier-like calculations
      const startX = this.offset + this.offset; // Starting position (60)
      const startY = this.CanH - this.offset; // Starting position (370)

      // Define curve control points for a natural takeoff trajectory
      const endX = this.CanW - 60; // End position
      const endY = 50; // Higher end position for better curve

      // Use easing function for smooth acceleration
      const easedProgress = this.easeOutQuart(normalizedProgress);

      // Calculate curved path using quadratic bezier curve concept
      const controlPointX = startX + (endX - startX) * 0.3; // Control point for curve
      const controlPointY = startY - 50; // Slight dip before climbing

      // Interpolate along the curve
      const t = easedProgress;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      // Quadratic bezier curve formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
      this.planeX = mt2 * startX + 2 * mt * t * controlPointX + t2 * endX;
      this.planeY = mt2 * startY + 2 * mt * t * controlPointY + t2 * endY;

      // Ensure plane doesn't go out of bounds
      this.planeX = Math.max(startX, Math.min(this.planeX, endX));
      this.planeY = Math.max(endY, Math.min(this.planeY, startY));
    } else if (this.gameState === 'crashed') {
      // Keep plane at crash position - no changes needed here
    } else if (this.gameState === 'waiting') {
      // Reset to starting position
      this.resetPlanePosition();
    }
  }

  // Add this new easing function for smooth animation
  private easeOutQuart(x: number): number {
    return 1 - Math.pow(1 - x, 4);
  }

  // Add this method to reset plane to starting position
  private resetPlanePosition() {
    this.planeX = this.offset + this.offset; // 60
    this.planeY = this.CanH - this.offset; // 370
  }

  ngAfterViewInit() {
    // Ensure scroll is at top after view initialization
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setTimeout(() => {
      this.initAnimation();
      this.startCircleAnimation();
    }, 100);
  }

  ngOnDestroy() {
    if (this.planeAnimFrame) cancelAnimationFrame(this.planeAnimFrame);
    if (this.circleAnimFrame) cancelAnimationFrame(this.circleAnimFrame);
    if (this.gameLoopFrame) cancelAnimationFrame(this.gameLoopFrame);
    this.clearRoundTimers();
  }

  onLoadingComplete() {
    this.showLoading = false;
  }

  showbtn: boolean = false;
  toggleButton() {
    this.showbtn = !this.showbtn;
  }


  async placeBet() {
    debugger;
    if (this.gameState !== 'waiting') {
      this.showToast('You can only bet before the round starts.', 'error');
      return;
    }
    if (this.hasActiveBet || this.isBetRequestInFlight) {
      return;
    }
    if (this.betAmount > this.MAX_BET) {
      this.betAmount = this.MAX_BET;
      this.showToast(`Maximum bet is $${this.MAX_BET}.`, 'error');
      return;
    }
    if (this.balance < this.betAmount) {
      this.showToast('Insufficient balance!', 'error');
      this.errorHandle.showModalSubject.next(true);
      return;
    }

    // INSTANTLY show cashout button and set active bet state
    this.hasActiveBet = true;
    this.hasCashedOut = false;
    this.currentBet = this.betAmount;

    // Optimistically update balance
    const previousBalance = this.balance;
    this.balance -= this.betAmount;

    const customerId = Number(localStorage.getItem('customerId')) || 0;
    this.isBetRequestInFlight = true;
    try {
      const response = await this.placeBetRequest(customerId, this.betAmount);
      if (response && response.responseCode === 200) {
        this.betRoundId = response.data?.betId || Date.now().toString();
        debugger;

        const backendCrashPoint = this.getBackendCrashPoint(response);
        if (backendCrashPoint === null) {
          throw new Error('Backend did not return a valid crash point.');
        }
        this.pendingCrashPoint = backendCrashPoint;
        if (this.gameState === 'waiting') {
          // Apply backend/dummy crash point for the upcoming active round.
          this.crashPoint = backendCrashPoint;
          this.tryStartFlyingRound();
        }

        this.showToast(
          `Bet placed: $${this.currentBet}`,
          'success'
        );
        this.utilsService.triggerWalletFunction();
      } else {
        this.hasActiveBet = false;
        this.hasCashedOut = false;
        this.currentBet = 0;
        this.balance = previousBalance;
        this.errorHandle.handleResponseError(response);
      }
    } catch (error: any) {
      this.hasActiveBet = false;
      this.hasCashedOut = false;
      this.currentBet = 0;
      this.balance = previousBalance;
      this.errorHandle.handleHttpError(error);
      this.showToast('Failed to place bet. Please try again.', 'error');
    } finally {
      this.isBetRequestInFlight = false;
    }
  }
  async cashOut() {
    if (!this.hasActiveBet || this.hasCashedOut || this.gameState !== 'flying')
      return;

    // Store current state for potential rollback
    const wasActiveBet = this.hasActiveBet;
    const previousBalance = this.balance;

    // Optimistically update UI
    const winnings = Math.floor(this.currentBet * this.multiplier * 100) / 100;
    this.balance += winnings;
    this.hasCashedOut = true;
    this.cashedOutAt = this.multiplier;

    // Trigger celebration animation
    this.triggerCashoutCelebration();

    const customerId = Number(localStorage.getItem('customerId')) || 0;
    try {
      const response = await this.cashOutRequest(customerId, this.multiplier);
      if (response && response.responseCode === 200) {
        this.showToast(
          `Cashed out at ${this.multiplier.toFixed(
            2
          )}x! Won $${winnings.toFixed(2)}`,
          'success'
        );
        this.addHistory(true);
        this.utilsService.triggerWalletFunction();
      } else {
        this.hasActiveBet = wasActiveBet;
        this.hasCashedOut = false;
        this.cashedOutAt = null;
        this.balance = previousBalance;
        this.errorHandle.handleResponseError(response);
      }
    } catch (error: any) {
      this.hasActiveBet = wasActiveBet;
      this.hasCashedOut = false;
      this.cashedOutAt = null;
      this.balance = previousBalance;
      this.errorHandle.handleHttpError(error);
      this.showToast('Failed to cash out. Please try again.', 'error');
    }
  }

  private placeBetRequest(customerId: number, amount: number): Promise<any> {
    if (this.USE_DUMMY_API) {
      return this.simulateCreateBet(customerId, amount);
    }

    const endpoint = `Customer/CreateAviatorBet?CustomerId=${customerId}&amount=${amount}`;
    return new Promise((resolve, reject) => {
      this.apiCallService.PostCallWithToken('', endpoint).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
  }

  private cashOutRequest(customerId: number, multiplier: number): Promise<any> {
    if (this.USE_DUMMY_API) {
      return this.simulateCashOut(customerId, multiplier);
    }

    const betIdQuery = this.betRoundId ? `&betId=${this.betRoundId}` : '';
    const endpoint = `Customer/CashOut?CustomerId=${customerId}&multiplier=${multiplier}${betIdQuery}`;
    return new Promise((resolve, reject) => {
      this.apiCallService.PostCallWithToken('', endpoint).subscribe({
        next: (response) => resolve(response),
        error: (error) => reject(error),
      });
    });
  }

  private simulateCreateBet(_customerId: number, _amount: number): Promise<any> {
    return new Promise((resolve) => {
      const simulatedCrashPoint = this.getDefaultFrontendCrashPoint();
      setTimeout(() => {
        resolve({
          responseCode: 200,
          data: {
            betId: `dummy-${Date.now()}`,
            crashPoint: simulatedCrashPoint,
          },
        });
      }, 250);
    });
  }

  private simulateCashOut(_customerId: number, _multiplier: number): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ responseCode: 200 });
      }, 200);
    });
  }

  // private getBackendCrashPoint(response: any): number | null {
  //   const rawCrashPoint =
  //     response?.data?.crashPoint ??
  //     response?.data?.crashOut ??
  //     response?.data?.crashout ??
  //     response?.crashPoint ??
  //     response?.crashOut ??
  //     response?.crashout;

  //   const crashPoint = Number(rawCrashPoint);
  //   return Number.isFinite(crashPoint) && crashPoint > 1 ? crashPoint : null;
  //   }

  private getBackendCrashPoint(response: any): number | null {
    try {
      debugger;

      const data = response?.data ?? response;

      // Accept numeric crashPoint directly
      const raw = data?.crashPoint ?? data?.crashOut ?? data?.crashout ?? null;
      if (raw == null) return null;

      // If already a number, return it
      if (typeof raw === 'number') {
        return raw;
      }

      // If it's a string, it may be encrypted/base64 — try to decrypt
      if (typeof raw === 'string') {
        const decrypted = this.decryptCrashPoint(raw);
        if (decrypted != null && !isNaN(decrypted) && decrypted > 1) {
          return decrypted;
        }
        // Fall back to parsing as float if decrypt didn't yield valid number
        const parsed = parseFloat(raw);
        if (!isNaN(parsed) && parsed > 1) return parsed;
      }

      return null;
    } catch (e) {
      return null;
    }
  }

  // Decrypt crashPoint encoded as base64 + XOR with shared key
  private decryptCrashPoint(encodedData: string): number | null {
    try {
      const key = 'letsflywithaviator';
      // Decode Base64 string
      const decodedData = atob(encodedData);
      let result = '';

      for (let i = 0; i < decodedData.length; i++) {
        result += String.fromCharCode(
          decodedData.charCodeAt(i) ^ key.charCodeAt(i % key.length),
        );
      }

      const value = parseFloat(result);
      return isNaN(value) ? null : value;
    } catch (e) {
      return null;
    }
  }

  private clearCountdownTimer() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  private clearRoundTimers() {
    this.clearCountdownTimer();
    if (this.roundTransitionTimer) {
      clearTimeout(this.roundTransitionTimer);
      this.roundTransitionTimer = null;
    }
    if (this.gameLoopFrame) {
      cancelAnimationFrame(this.gameLoopFrame);
      this.gameLoopFrame = null;
    }
  }

  private triggerCashoutCelebration() {
    const celebrationContainer = document.querySelector('.canvas-container');
    const multiplierDisplay = document.querySelector('.multiplier-display');

    if (!celebrationContainer) return;

    // Add celebration to multiplier
    if (multiplierDisplay) {
      multiplierDisplay.classList.add('celebrating');
      setTimeout(() => {
        multiplierDisplay.classList.remove('celebrating');
      }, 800);
    }

    // Only add win flash effect - NO SPARKLES
    celebrationContainer.classList.add('win-flash');
    setTimeout(() => {
      celebrationContainer.classList.remove('win-flash');
    }, 2000);
  }
  addHistory(won: boolean) {
    const round: GameRound = {
      id: this.betRoundId || Date.now().toString(),
      crashPoint: this.crashPoint,
      timestamp: new Date(),
      betAmount: this.currentBet,
      cashedOutAt: this.cashedOutAt || undefined,
      won,
    };
    this.gameHistory = [round, ...this.gameHistory.slice(0, 49)];
    this.betRoundId = null;
    this.cashedOutAt = null;
    this.currentBet = 0;
    this.updateStats();
  }

  updateStats() {
    this.stats.totalRounds = this.gameHistory.length;
    this.stats.totalWins = this.gameHistory.filter((r) => r.won).length;
    this.stats.biggestWin = this.gameHistory.reduce(
      (max, r) => (r.cashedOutAt && r.cashedOutAt > max ? r.cashedOutAt : max),
      0
    );
    this.stats.totalWagered = this.gameHistory.reduce(
      (sum, r) => sum + r.betAmount,
      0
    );
    this.stats.totalWon = this.gameHistory
      .filter((r) => r.won)
      .reduce((sum, r) => sum + r.betAmount * (r.cashedOutAt || 0), 0);
  }

  getWinRate(): string {
    if (this.stats.totalRounds === 0) return '0%';
    return (
      Math.floor((this.stats.totalWins / this.stats.totalRounds) * 100) + '%'
    );
  }

  showToast(message: string, type: 'success' | 'error') {
    if (type === 'success') {
      this.toastr.success(message);
    } else {
      this.toastr.error(message);
    }
  }

  setBetAmount(amount: number) {
    if (this.hasActiveBet || this.gameState === 'flying') return;
    if (amount > this.MAX_BET) {
      this.showToast(`Maximum bet is $${this.MAX_BET}.`, 'error');
      this.betAmount = this.MAX_BET;
      return;
    }
    if (this.balance < amount) {
      this.showToast('Insufficient balance!', 'error');
      this.errorHandle.showModalSubject.next(true);
      return;
    }
    this.betAmount = amount;
  }
  getMultiplierClass(): string {
    if (this.gameState === 'flying') {
      if (this.multiplier >= 10.0) return 'text-rainbow animate-pulse'; // Changed from 9.0
      if (this.multiplier >= 5.0) return 'text-gold animate-pulse'; // Changed from 4.0
      if (this.multiplier >= 2.0) return 'text-yellow animate-glow'; // Changed from 1.0
      return 'text-white';
    }
    if (this.gameState === 'crashed') return 'text-red animate-shake';
    return 'text-gray';
  }

  getCrashColor(crashPoint: number): string {
    if (crashPoint < 2) return 'text-red-400';
    if (crashPoint < 5) return 'text-yellow-400';
    return 'text-green-400';
  }

  // onBetAmountInput(event: any) {
  //   const value = Number(event.target.value);
  //   this.betAmount = Math.max(1, Math.min(this.balance, value));
  // }

  onBetAmountInput(event: any) {
    const rawValue = Number(event.target.value);
    const integerValue = Math.floor(rawValue);
    const maxAllowedByBalance = Math.max(1, Math.floor(this.balance));
    const maxAllowed = Math.min(this.MAX_BET, maxAllowedByBalance);

    if (integerValue > this.MAX_BET) {
      this.betAmount = maxAllowed;
      this.showToast(`Maximum bet is $${this.MAX_BET}.`, 'error');
      event.target.value = this.betAmount;
      return;
    }

    if (integerValue > maxAllowedByBalance) {
      this.betAmount = maxAllowed;
      this.showToast('Insufficient balance!', 'error');
      this.errorHandle.showModalSubject.next(true);
      event.target.value = this.betAmount;
      return;
    }

    this.betAmount = Math.max(1, Math.min(integerValue, maxAllowed));

    if (rawValue !== integerValue) {
      event.target.value = this.betAmount;
    }
  }

  onBetKeyDown(event: KeyboardEvent): void {
    const blocked = ['.', ',', 'e', 'E', '+', '-'];
    if (blocked.includes(event.key)) {
      event.preventDefault();
    }
  }

  adjustBet(amount: number) {
    if (this.hasActiveBet || this.gameState === 'flying') return;
    const newAmount = this.betAmount + amount;
    const maxAllowedByBalance = Math.max(1, Math.floor(this.balance));
    const maxAllowed = Math.min(this.MAX_BET, maxAllowedByBalance);

    if (newAmount > this.MAX_BET) {
      this.betAmount = maxAllowed;
      this.showToast(`Maximum bet is $${this.MAX_BET}.`, 'error');
      return;
    }

    if (newAmount > this.balance) {
      this.betAmount = maxAllowed;
      this.showToast('Insufficient balance!', 'error');
      this.errorHandle.showModalSubject.next(true);
      return;
    }
    this.betAmount = Math.max(1, Math.min(newAmount, maxAllowed));
  }

  // --- CANVAS ANIMATION METHODS ---
  private initAnimation() {
    if (!this.planeCanvas?.nativeElement) return;

    this.verticalDots = [];
    this.horizontalDots = [];
    for (let i = 0; i < this.maxDots; i++) {
      this.verticalDots.push({
        x: 15,
        y: (i * (this.CanH - 32)) / this.maxDots,
      });
      const dotX = (i * (this.CanW - 32)) / (this.maxDots - 1) + 32;
      this.horizontalDots.push({ x: dotX, y: this.CanH - 15 });
    }
    this.resetPlane();
    this.startPlaneAnimation();
  }

  private resetPlane() {
    this.planeX = this.offset + this.offset;
    this.planeY = this.CanH - this.offset;
    this.movingState = 1;
    this.planeAnimationCompleted = false;
    this.holdingPatternCount = 0;
    this.randY = this.getRandomNumber(60, 150);
  }

  private startPlaneAnimation() {
    if (this.planeAnimFrame) {
      cancelAnimationFrame(this.planeAnimFrame);
    }
    this.loop();
  }

  private loop = () => {
    const canvas = this.planeCanvas?.nativeElement;
    if (!canvas) {
      this.planeAnimFrame = requestAnimationFrame(this.loop);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.planeAnimFrame = requestAnimationFrame(this.loop);
      return;
    }

    ctx.clearRect(0, 0, this.CanW, this.CanH);

    // Only draw, do not update planeX/planeY/movingState here!
    this.drawPlane(ctx);
    this.drawDots(ctx);
    this.planeAnimFrame = requestAnimationFrame(this.loop);
  };

  private drawPlane(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = this.gameState === 'crashed' ? '#ff2d55' : '#fe8912';
    ctx.lineWidth = 4;
    ctx.shadowColor = this.gameState === 'crashed' ? '#ff2d55' : '#fe8912';
    ctx.shadowBlur = 20;
    ctx.moveTo(this.offset, this.CanH - this.offset);
    const cp1X = this.planeX / 4;
    const cp1Y = this.CanH - this.offset;
    const cp2X = (this.planeX / 8) * 7;
    const cp2Y = this.planeY + (this.CanH - this.offset - this.planeY) / 3;
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, this.planeX, this.planeY);
    ctx.stroke();

    ctx.beginPath();
    const gradient = ctx.createLinearGradient(
      this.offset,
      this.CanH - this.offset,
      this.planeX,
      this.planeY
    );
    if (this.gameState === 'crashed') {
      gradient.addColorStop(0, 'rgba(255, 45, 85, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 45, 85, 0.8)');
    } else {
      gradient.addColorStop(0, 'rgba(254, 200, 102, 0.18)');
      gradient.addColorStop(1, 'rgba(254, 137, 18, 0.52)');
    }
    ctx.fillStyle = gradient;
    ctx.moveTo(this.offset, this.CanH - this.offset);
    ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, this.planeX, this.planeY);
    ctx.lineTo(this.planeX, this.CanH - this.offset);
    ctx.lineTo(this.offset, this.CanH - this.offset);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = this.gameState === 'crashed' ? '#ff2d55' : '#fe8912';
    ctx.shadowColor = this.gameState === 'crashed' ? '#ff2d55' : '#fe8912';
    ctx.shadowBlur = 15;
    ctx.translate(this.planeX - 15, this.planeY - 48);
    ctx.scale(1, 1);
    for (let i = 0; i < this.planePath.length; i++) {
      const path = new Path2D(this.planePath[i]);
      ctx.fill(path);
    }
    ctx.restore();
  }

  private drawDots(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ffa54b';
    ctx.shadowColor = '#fe8912';
    ctx.shadowBlur = 8;
    for (let i = 0; i < this.verticalDots.length; i++) {
      const dot = this.verticalDots[i];
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, this.dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    for (let i = 0; i < this.horizontalDots.length; i++) {
      const dot = this.horizontalDots[i];
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, this.dotRadius, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  private getRandomNumber(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  private startCircleAnimation() {
    if (this.circleAnimFrame) {
      cancelAnimationFrame(this.circleAnimFrame);
    }
    this.drawCircle();
  }

  private drawCircle = () => {
    const canvas = this.circleCanvas?.nativeElement;
    if (!canvas) {
      this.circleAnimFrame = requestAnimationFrame(this.drawCircle);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.circleAnimFrame = requestAnimationFrame(this.drawCircle);
      return;
    }

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const circleRadius = canvasWidth + 100;
    const centerX = 0;
    const centerY = canvasHeight;
    const numSlices = 60;
    const sliceColor1 = 'rgba(0, 0, 0, 0)';
    const sliceColor2 = 'rgba(254, 200, 102, 0.08)';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.circleRotationAngle);

    for (let i = 0; i < numSlices; i++) {
      const startAngle = i * (360 / numSlices) * (Math.PI / 180);
      const endAngle = (i + 1) * (360 / numSlices) * (Math.PI / 180);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, circleRadius, startAngle, endAngle);
      ctx.fillStyle = i % 2 === 0 ? sliceColor1 : sliceColor2;
      ctx.fill();
    }

    ctx.restore();

    this.circleRotationAngle += 0.003;

    this.circleAnimFrame = requestAnimationFrame(this.drawCircle);
  };

  WalletPayload() {
    return {
      customerId: Number(localStorage.getItem('customerId')),
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
  }
  //   getWalletBalance(pageNumber: number = 1, searchText: string = '') {
  //     this.loaderService.show();
  //     const CustomerID = localStorage.getItem('customerId');
  //     // let payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=${pageNumber}&PageSize=${10}`;
  //     let payload = this.WalletPayload();

  //     // if (searchText.trim()) {
  //     //   payload += `&SearchText=${encodeURIComponent(searchText.trim())}`;
  //     // }

  //     this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe(

  getWalletBalance(): void {
    const customerId = localStorage.getItem('customerId');
    const payload = this.WalletPayload();
    this.apiCallService
      .PostCallWithToken(payload, 'Wallet/GetWalletBalance')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.balance = parseFloat(response.data.totalBalance || 0);
            this.utilsService.triggerWalletFunction();
          } else {
            this.errorHandle.handleResponseError(response);
          }
        },
        error: (error) => {
          this.errorHandle.handleHttpError(error);
        },
      });
  }

  goBack() {
    try {
      if (window.history && window.history.length > 1) {
        this.location.back();
      } else {
        window.location.href = '/dashboard/home';
      }
    } catch {
      window.location.href = '/dashboard/home';
    }
  }
}
