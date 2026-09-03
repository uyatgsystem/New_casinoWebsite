import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  Inject,
  PLATFORM_ID,
  Input,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
// import { SpinnerSegment } from '../../Interfaces/interfaces';
// import { ApiCallService } from '../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { debug } from 'console';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faXmark } from '@fortawesome/free-solid-svg-icons';
// import { GameService } from '../../Services/game.service';
// import { UtilsService } from '../../Services/utils.service';
// import { ErrorhandlingService } from '../../Services/error-handling.service';
// import { LoaderService } from '../../Services/loader-service.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';

import {
  heroArchiveBox,
  heroCurrencyDollar,
  heroGift,
  heroTrophy,
  heroUsers,
} from '@ng-icons/heroicons/outline';
import { ionDiamond } from '@ng-icons/ionicons';
import { hugeMoneyBag02 } from '@ng-icons/huge-icons';

import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { SpinnerSegment } from '../../../Interfaces/interfaces';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { UtilsService } from '../../../Services/utils.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { LoaderService } from '../../../Services/loader-service.service';
import { GameService } from '../../../Services/game.service';

@Component({
  selector: 'app-spinners',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule, NgIcon],
  templateUrl: './spinner.component.html',
  styleUrl: './spinner.component.scss',
  viewProviders: [
    provideIcons({
      heroUsers,
      heroTrophy,
      heroCurrencyDollar,
      heroGift,
      ionDiamond,
      hugeMoneyBag02,
    }),
  ],
})
export class SpinnerComponent {
  @Output() spinEnd = new EventEmitter<string>();
  @Input() showHeader: boolean = true;

  isAmountCredited: boolean = true;

  private baseSegments: SpinnerSegment[] = [
    { id: 'seg-01', prize: '$2', icon: 'heroTrophy' },
    { id: 'seg-02', prize: '$3', icon: 'heroTrophy' },
    { id: 'seg-03', prize: '$4', icon: 'heroCurrencyDollar' },
    { id: 'seg-04', prize: '$6', icon: 'heroCurrencyDollar' },
    { id: 'seg-05', prize: 'Free Spin', icon: 'heroGift' },
    { id: 'seg-06', prize: '$8', icon: 'heroCurrencyDollar' },
    { id: 'seg-07', prize: '$500', icon: 'ionDiamond' },
    { id: 'seg-08', prize: '$10', icon: 'hugeMoneyBag02' },
    { id: 'seg-09', prize: '$50', icon: 'hugeMoneyBag02' },
    { id: 'seg-10', prize: '$100', icon: 'ionDiamond' },
  ];

  segments: SpinnerSegment[] = [...this.baseSegments];

  // Hard-coded segments per allowed amount (5, 10, 15, 20)
  private readonly amountSegmentMap: Record<number, SpinnerSegment[]> = {
    5: [
      { id: 'seg-01', prize: '$2', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$3', icon: 'heroTrophy' },
      { id: 'seg-03', prize: '$4', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$6', icon: 'heroCurrencyDollar' },
      { id: 'seg-05', prize: 'Free Spin', icon: 'heroGift' },
      { id: 'seg-06', prize: '$8', icon: 'heroCurrencyDollar' },
      { id: 'seg-07', prize: '$500', icon: 'ionDiamond' },
      { id: 'seg-08', prize: '$10', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$50', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$100', icon: 'ionDiamond' },
    ],
    10: [
      { id: 'seg-01', prize: '$4', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-03', prize: '$8', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$12', icon: 'heroCurrencyDollar' },
      { id: 'seg-05', prize: 'Free Spin', icon: 'heroGift' },
      { id: 'seg-06', prize: '$15', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$1000', icon: 'ionDiamond' },
      { id: 'seg-08', prize: '$20', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$50', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$150', icon: 'ionDiamond' },
    ],
    15: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$10', icon: 'heroTrophy' },
      { id: 'seg-03', prize: '$12', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$18', icon: 'heroCurrencyDollar' },
      { id: 'seg-05', prize: 'Free Spin', icon: 'heroGift' },
      { id: 'seg-06', prize: '$25', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$1500', icon: 'ionDiamond' },
      { id: 'seg-08', prize: '$40', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$75', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$200', icon: 'ionDiamond' },
    ],
    20: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$10', icon: 'heroTrophy' },
      { id: 'seg-03', prize: '$15', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$25', icon: 'heroCurrencyDollar' },
      { id: 'seg-05', prize: 'Free Spin', icon: 'heroGift' },
      { id: 'seg-06', prize: '$30', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$2000', icon: 'ionDiamond' },
      { id: 'seg-08', prize: '$50', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$100', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$250', icon: 'ionDiamond' },
    ],
  };

  private _spinAmount: string = '5';

  get spinAmount(): string {
    return this._spinAmount;
  }

  set spinAmount(value: string) {
    this._spinAmount = value;
    this.updateSegmentValues();
  }

  crossicon = faXmark;
  isSpinning = false;
  rotation = 0;
  lastWin: string | null = null;
  highlightedIndex: number | null = null;
  private highlightTimeout: any;
  private readonly HIGHLIGHT_DURATION_MS = 6000;

  customerid: any;
  private readonly SPIN_DURATION = 4000;
  private readonly MIN_SPINS = 5;

  public readonly segmentAngle = 360 / this.segments.length;

  isSpinAllowed!: boolean;

  remainingTimeInSeconds: number = 0;
  formattedTime: string = '';
  private countdownInterval: any;

  segmentColors: Record<string, string> = {
    'seg-01': '#5b37ff',
    'seg-02': '#1d1429',
    'seg-03': '#623dff',
    'seg-04': '#241832',
    'seg-05': '#6a42ff',
    'seg-06': '#271a36',
    'seg-07': '#754bff',
    'seg-08': '#2d1f3d',
    'seg-09': '#834fff',
    'seg-10': '#341f47',
  };

  // Icon colors per segment (ng-icon inherits currentColor)
  iconColors: Record<string, string> = {
    'seg-01': '#F59E0B', // amber
    'seg-02': '#10B981', // emerald
    'seg-03': '#38BDF8', // sky
    'seg-04': '#8B5CF6', // violet
    'seg-05': '#EAB308', // yellow
    'seg-06': '#84CC16', // lime
    'seg-07': '#06B6D4', // cyan
    'seg-08': '#FB923C', // orange
    'seg-09': '#34D399', // green
    'seg-10': '#A78BFA', // indigo
  };

  wheelGradient = this.buildWheelGradient();

  // Derive a vivid icon color per wedge to mimic real-world wheel accents
  getIconColor(segmentId: string): string {
    const explicit = this.iconColors[segmentId];
    if (explicit) return explicit;
    const base = this.segmentColors[segmentId] || '#ffffff';
    return this.lightenColor(base, 35);
  }

  // Lighten a hex color (0-100%) by mixing with white
  private lightenColor(hex: string, amount: number): string {
    const clean = hex.replace('#', '');
    const normalized =
      clean.length === 3
        ? clean
            .split('')
            .map((c) => c + c)
            .join('')
        : clean;
    const bigint = parseInt(normalized, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    const pct = Math.max(0, Math.min(100, amount)) / 100;
    r = Math.round(r + (255 - r) * pct);
    g = Math.round(g + (255 - g) * pct);
    b = Math.round(b + (255 - b) * pct);

    const toHex = (v: number) => v.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  private buildWheelGradient(): string {
    const slice = this.segmentAngle;
    const parts: string[] = [];
    this.segments.forEach((s, i) => {
      const start = i * slice;
      const end = (i + 1) * slice + 0.25;
      const color = this.segmentColors[s.id] || '#444';
      parts.push(`${color} ${start}deg ${end}deg`);
    });
    return `conic-gradient(from -90deg, ${parts.join(',')})`;
  }

  constructor(
    private _apiCall: ApiCallService,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef,
    private GameService: GameService,
    private utilsService: UtilsService,
    private _httpError: ErrorhandlingService,
    private loaderService: LoaderService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const customerId = localStorage.getItem('customerId');
    this.customerid = customerId;
  }

  // Minimal login modal state
  showLoginModal = false;

  // Balance cache to avoid awaiting before every spin
  private lastBalanceFetchAt: number | null = null;
  private balanceFetchPromise: Promise<void> | null = null;
  private readonly BALANCE_TTL_MS = 15000; // 15 seconds

  ngOnInit(): void {
    // Seed balance from saved value to avoid first-click delay
    try {
      const saved = this.GameService.getTotalBalance?.();
      if (saved !== undefined && saved !== null) {
        const n = typeof saved === 'string' ? parseFloat(saved) : Number(saved);
        if (!Number.isNaN(n)) this.updateBalance = n;
      }
    } catch {}

    this.updateSegmentValues();

    // Prime wallet balance early to keep it fresh before the user clicks
    // this.ensureWalletBalance(true);

    // if (!localStorage.getItem('totalBalance')) {
    //   this.getWalletBalance();
    // }
    // this.getlastSpinTime();
  }

  // Fetch wallet balance only if stale; otherwise return immediately.
  // private ensureWalletBalance(force: boolean = false): Promise<void> {
  //   const now = Date.now();

  //   if (
  //     !force &&
  //     this.lastBalanceFetchAt !== null &&
  //     now - this.lastBalanceFetchAt < this.BALANCE_TTL_MS &&
  //     this.updateBalance !== undefined
  //   ) {
  //     return Promise.resolve();
  //   }

  //   if (this.balanceFetchPromise) {
  //     return this.balanceFetchPromise;
  //   }

  //   this.balanceFetchPromise = this.getWalletBalance()
  //     .then(() => {
  //       this.lastBalanceFetchAt = Date.now();
  //     })
  //     .catch(() => {
  //       // keep old balance on failure
  //     })
  //     .finally(() => {
  //       this.balanceFetchPromise = null;
  //     });

  //   return this.balanceFetchPromise;
  // }

  private async updateSegmentValues(): Promise<void> {
    const selectedRaw = parseFloat(this.spinAmount) || 5;
    const allowed = [5, 10, 15, 20];
    const selectedAmount = allowed.includes(selectedRaw) ? selectedRaw : 5;

    // Refresh in background; don't block UI
    // this.ensureWalletBalance(false);

    const bal = this.walletBalance;
    if (typeof bal === 'number') {
      this.isBalanceSufficient = selectedAmount <= bal;
      this.isSpinAllowed = this.isBalanceSufficient;
    } else {
      // Balance unknown (first load) — allow spin optimistically
      this.isBalanceSufficient = true;
      this.isSpinAllowed = true;
    }

    // Use the hard-coded array for the chosen amount
    const mapped =
      this.amountSegmentMap[selectedAmount] || this.amountSegmentMap[5];
    // Clone to avoid accidental shared mutations
    this.segments = mapped.map((s) => ({ ...s }));

    this.wheelGradient = this.buildWheelGradient();

    this.cdr.detectChanges();
  }

  freespincheck: boolean = false;
  paidSpin() {
    // if (this.isSpinning || !this.checkTotalBalance()) return;
    this.rotation = 0;
    this.SpinAgainModal = false;
    this.isFreeSpin = false;
    this.highlightedIndex = null;
    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);
    this.testSpin();
  }

  isBalanceSufficient: boolean = true;

  async freeSpin() {
    const selectedAmount = parseFloat(this.spinAmount) || 5;

    // Refresh wallet in background; don't block spin start
    // this.ensureWalletBalance(false);

    const bal = this.walletBalance;
    if (typeof bal === 'number' && selectedAmount > bal) {
      // ...existing insufficient-balance handling...
      return;
    }

    this.isSpinAllowed = true;
    this.isBalanceSufficient = true;
    this.testSpin();
  }

  // private startSpin() {
  //   //? Disable clicking anywhere while spinning
  //   document.body.style.pointerEvents = 'none';

  //   let spinInterval = setInterval(() => {
  //     this.rotation -= 20;
  //   }, 20);

  //   this.spinnercall()
  //     .then((response) => {
  //       clearInterval(spinInterval);

  //       //? Parse the response to get the winning index
  //       this.lastWin = response?.reward;
  //       this.lastWin = this.lastWin + '$';
  //       // console.log('Winning prize lastWin:', this.lastWin);

  //       //? Find the winning index from the segments
  //       const winningIndex = this.segments.findIndex(
  //         (segment) => segment.prize === this.lastWin
  //       );
  //       // console.log('Winning index:', winningIndex);

  //       //? Calculate the target rotation to land on the correct segment
  //       const targetRotation = this.calculateTargetRotation(winningIndex);

  //       this.rotation = targetRotation;

  //       //? Stop spinning after landing
  //       setTimeout(() => {
  //         this.isSpinning = false;
  //         this.isAmountCredited = true;
  //         this.spinEnd.emit((this.lastWin + '$').toString());
  //         //? Re-enable clicking after spinning
  //         document.body.style.pointerEvents = 'auto';
  //       }, 5000);
  //     })
  //     .catch((error) => {
  //       // console.error('Error:', error);
  //       clearInterval(spinInterval);
  //       this.isSpinning = false;
  //       //? Re-enable clicking in case of error
  //       document.body.style.pointerEvents = 'auto';
  //     });
  // }

  private startSpin() {
    document.body.style.pointerEvents = 'none';
    this.isSpinning = true;

    const spinnerContainer = document.querySelector('.spinner-container');
    spinnerContainer?.classList.add('spinning');

    let speed = 20;
    let rotationStep = -20;

    const spinInterval = setInterval(() => {
      this.rotation += rotationStep;
      if (speed < 80) {
        speed += 0.5;
        clearInterval(spinInterval);
        setTimeout(() => {
          rotationStep += 0.5;
        }, speed);
      }
    }, speed);

    // this.spinnercall()
    //   .then((response) => {
    //     this.lastWin = response?.reward + '$';

    //     const winningIndex = this.segments.findIndex(
    //       (segment) => segment.prize === this.lastWin
    //     );

    //     const segmentAngle = this.segmentAngle;
    //     const offsetFactor = 0.1 + Math.random() * 0.6;
    //     const offsetAngle = segmentAngle * offsetFactor;
    //     const targetRotation =
    //       this.calculateTargetRotation(winningIndex) - offsetAngle;

    //     setTimeout(() => {
    //       spinnerContainer?.classList.remove('spinning');
    //       spinnerContainer?.classList.add('spin-ending');
    //     }, 3000);

    //     const slowSpin = setInterval(() => {
    //       if (Math.abs(this.rotation - targetRotation) < 1) {
    //         clearInterval(slowSpin);
    //         this.rotation = targetRotation;
    //         setTimeout(() => {
    //           this.isSpinning = false;
    //           this.isAmountCredited = true;
    //           this.spinEnd.emit((this.lastWin + '$').toString());
    //           document.body.style.pointerEvents = 'auto';

    //           spinnerContainer?.classList.remove('spinning', 'spin-ending');
    //         }, 1000);
    //       } else {
    //         this.rotation += (targetRotation - this.rotation) * 0.05;
    //       }
    //     }, 20);
    //   })
    //   .catch(() => {
    //     clearInterval(spinInterval);
    //     this.isSpinning = false;
    //     document.body.style.pointerEvents = 'auto';

    //     spinnerContainer?.classList.remove('spinning', 'spin-ending');
    //   });
  }
  // private checkTotalBalance(): boolean {
  //   if (!localStorage.getItem('totalBalance')) {
  //     this.getWalletBalance();
  //     return false;
  //   }
  //   return true;
  // }

  private determineWinningSegment(lastWin?: string): number {
    return Math.floor(Math.random() * this.segments.length);
  }

  private calculateTargetRotation(winningIndex: number): number {
    const segmentAngle = this.segmentAngle;
    const landingAngle = winningIndex * segmentAngle + segmentAngle / 2;
    const fullRotations = 5;
    return -(fullRotations * 360) - landingAngle;
  }

  testSpin(winningIndex?: number): void {
    if (this.isSpinning) return;
    this.isSpinning = true;
    document.body.style.pointerEvents = 'none';
    this.highlightedIndex = null;
    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);

    const spinnerContainer = document.querySelector('.spinner-container');
    spinnerContainer?.classList.add('spinning');

    const segmentAngle = this.segmentAngle;
    const chosenIndex =
      typeof winningIndex === 'number'
        ? ((winningIndex % this.segments.length) + this.segments.length) %
          this.segments.length
        : Math.floor(Math.random() * this.segments.length);

    const currentPointerAngle = ((-this.rotation % 360) + 360) % 360;
    const sliceStart = chosenIndex * segmentAngle;
    const sliceEnd = sliceStart + segmentAngle;
    const desiredCenterAngle = sliceStart + segmentAngle / 2;

    const settleOffset = 8 + Math.random() * 10;

    let delta = (desiredCenterAngle - currentPointerAngle + 360) % 360;
    const FULL_ROTATIONS = 8;
    delta += FULL_ROTATIONS * 360;
    const finalTargetRotation = this.rotation - delta + settleOffset;

    const startTime = performance.now();
    const initialRotation = this.rotation;
    const totalDistance = Math.abs(finalTargetRotation - initialRotation);

    const FAST_PHASE_DURATION = 4000;
    const SLOW_PHASE_DURATION = 3000;
    const TOTAL_DURATION = FAST_PHASE_DURATION + SLOW_PHASE_DURATION;

    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / TOTAL_DURATION, 1);

      let currentRotation: number;

      if (elapsed <= FAST_PHASE_DURATION) {
        const fastProgress = elapsed / FAST_PHASE_DURATION;
        const fastDistance = totalDistance * 0.85;
        currentRotation = initialRotation - fastDistance * fastProgress;
      } else {
        const slowProgress =
          (elapsed - FAST_PHASE_DURATION) / SLOW_PHASE_DURATION;

        const easedProgress = 1 - Math.pow(1 - slowProgress, 3);

        const fastDistance = totalDistance * 0.85;
        const remainingDistance = totalDistance * 0.15;

        currentRotation =
          initialRotation - fastDistance - remainingDistance * easedProgress;
      }

      this.rotation = currentRotation;
      if (progress >= 1) {
        this.rotation = finalTargetRotation;
        this.completeSpinAnimation(
          chosenIndex,
          spinnerContainer,
          sliceStart,
          sliceEnd,
          desiredCenterAngle
        );
        return;
      }

      this.cdr.detectChanges();

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    setTimeout(() => {
      if (this.isSpinning) {
        spinnerContainer?.classList.remove('spinning');
        spinnerContainer?.classList.add('spin-ending');
      }
    }, FAST_PHASE_DURATION + SLOW_PHASE_DURATION * 0.7);
  }

  private completeSpinAnimation(
    chosenIndex: number,
    spinnerContainer: Element | null,
    sliceStart: number,
    sliceEnd: number,
    desiredCenterAngle: number
  ): void {
    const seg = this.segments[chosenIndex];
    this.lastWin = seg.prize;
    this.highlightedIndex = chosenIndex;
    this.spinEnd.emit(this.lastWin);

    console.log(
      `[TestSpin] Index=${chosenIndex}, Prize=${
        seg.prize
      }, CenterAngle=${desiredCenterAngle.toFixed(
        2
      )}° (slice ${sliceStart.toFixed(2)}°-${sliceEnd.toFixed(
        2
      )}°), Final rotation=${this.rotation}`
    );

    this.isSpinning = false;
    document.body.style.pointerEvents = 'auto';

    spinnerContainer?.classList.remove('spinning', 'spin-ending');

    if (seg.prize === 'Free Spin') {
      setTimeout(() => {
        this.testSpin();
      }, 1000);
    }

    this.scheduleHighlightClear();
    this.cdr.markForCheck();

    setTimeout(() => {
      spinnerContainer?.classList.remove('spin-ending');
    }, 3000);

    // If not logged in, show a gentle login prompt after the spin ends
    const isLoggedIn = !!localStorage.getItem('customerId');
    if (!isLoggedIn) {
      // small delay so the pointer settle feels natural
      setTimeout(() => {
        this.showLoginModal = true;
        this.cdr.detectChanges();
      }, 400);
    }
  }
  private addPointerSettleEffect(): void {
    const pointer = document.querySelector('.wheel-pointer');
    if (!pointer) return;

    pointer.classList.add('settling');

    const settleOffset = 8 + Math.random() * 5;
    const finalRotation = this.rotation + settleOffset;

    let startTime = performance.now();
    const startRotation = this.rotation;
    const duration = 800;

    const settleAnimate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = 1 - Math.pow(1 - progress, 3);

      this.rotation =
        startRotation + (finalRotation - startRotation) * easedProgress;

      if (progress < 1) {
        this.cdr.detectChanges();
        requestAnimationFrame(settleAnimate);
      } else {
        this.rotation = finalRotation;
        this.cdr.detectChanges();

        setTimeout(() => {
          pointer.classList.remove('settling');
        }, 100);
      }
    };
    setTimeout(() => {
      requestAnimationFrame(settleAnimate);
    }, 200);
  }

  private scheduleHighlightClear() {
    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);
    this.highlightTimeout = setTimeout(() => {
      if (!this.isSpinning) {
        this.highlightedIndex = null;
        this.cdr.markForCheck();
      }
    }, this.HIGHLIGHT_DURATION_MS);
  }

  private showWinningPopup(prize: SpinnerSegment, lastWin: any) {
    this.SpinAgainModal = false;
  }

  resetSpinner() {
    this.lastWin = null;
    this.highlightedIndex = null;
    this.isSpinning = false;
  }

  // spinnercall(): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     const payload = {
  //       customerid: this.customerid,
  //       isFreeSpin: this.isFreeSpin,
  //     };
  //     this._apiCall.PostCallWithToken(payload, 'Spinner/Spinner').subscribe(
  //       (response: any) => {
  //         if (response.responseCode === 200) {
  //           this.loaderService.hide();
  //           if (this.isFreeSpin == true) {
  //             this.getlastSpinTime();
  //           }
  //         } else {
  //           this._httpError.handleResponseError(response);
  //         }
  //         resolve(response.data);
  //       },
  //       (error) => {
  //         this.loaderService.hide();
  //         this.toaster.error('API call failed');
  //         this._httpError.handleHttpError(error);
  //         reject(error);
  //       }
  //     );
  //   });
  // }
  serverTimeData: any;
  sppinertime: any;

  // getlastSpinTime() {
  //   const payload = this.customerid;
  //   this._apiCall
  //     .GetCallWithToken('Spinner/GetSpinner?CustomerId=' + payload)
  //     .subscribe(
  //       (response) => {
  //         if (response && response.responseCode == 200) {
  //           this.serverTimeData = response.data.serverDateTime;
  //           this.sppinertime = response.data.spinnerTime;
  //           this.isSpinAllowed = this.CheckIfSpinAllowed(
  //             this.serverTimeData,
  //             this.sppinertime
  //           );

  //           if (!this.isSpinAllowed) {
  //             this.calculateRemainingTime(
  //               this.sppinertime,
  //               this.serverTimeData
  //             );
  //           } else {
  //           }

  //           this.cdr.detectChanges();
  //         } else {
  //           this.toaster.warning(response.errorMessage, 'Error');
  //           this._httpError.handleResponseError(response);
  //         }
  //       },
  //       (error) => {
  //         this.toaster.error('API call failed');
  //         this._httpError.handleHttpError(error);
  //       }
  //     );
  // }

  CheckIfSpinAllowed(serverTimeData: string, spinTime: string): boolean {
    const serverDate = new Date(serverTimeData);
    const spinDate = new Date(spinTime + 'Z');

    if (
      serverDate.getUTCFullYear() === spinDate.getUTCFullYear() &&
      serverDate.getUTCMonth() === spinDate.getUTCMonth() &&
      serverDate.getUTCDate() === spinDate.getUTCDate()
    ) {
      return false;
    } else {
      return true;
    }
  }

  calculateRemainingTime(spinnerTime: string, serverDateTime: string) {
    try {
      const spinDateTime = new Date(spinnerTime);
      const serverDateTimeObj = new Date(serverDateTime);

      const nextDayStart = new Date(
        Date.UTC(
          serverDateTimeObj.getUTCFullYear(),
          serverDateTimeObj.getUTCMonth(),
          serverDateTimeObj.getUTCDate() + 1
        )
      );

      const differenceInSeconds = Math.floor(
        (nextDayStart.getTime() - serverDateTimeObj.getTime()) / 1000
      );

      this.remainingTimeInSeconds = Math.max(differenceInSeconds, 0);

      if (this.remainingTimeInSeconds > 0) {
        this.startCountdown();
      } else {
      }

      this.cdr.detectChanges();
    } catch (error) {
      this.remainingTimeInSeconds = 0;
    }
  }

  private interval: any;

  startCountdown() {
    if (this.interval) {
      clearInterval(this.interval);
    }

    if (this.remainingTimeInSeconds <= 0) {
      this.freespincheck = false;
      this.isFreeSpin = true;
      this.toaster.info('Rewards, Your daily free spin is ready', 'Rewards');
      return;
    }

    this.interval = setInterval(() => {
      if (this.remainingTimeInSeconds > 0) {
        this.remainingTimeInSeconds -= 1;

        const hours = Math.floor(this.remainingTimeInSeconds / 3600);
        const minutes = Math.floor((this.remainingTimeInSeconds % 3600) / 60);
        const seconds = this.remainingTimeInSeconds % 60;

        this.formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        this.cdr.detectChanges();
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
    }
  }

  updateFormattedTime() {
    const hours = Math.floor(this.remainingTimeInSeconds / 3600);
    const minutes = Math.floor((this.remainingTimeInSeconds % 3600) / 60);
    const seconds = this.remainingTimeInSeconds % 60;

    this.formattedTime = `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    this.cdr.detectChanges();
  }

  private updateBalance: any;

  get walletBalance(): any {
    return this.updateBalance;
  }

  // private getWalletBalance(): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     const CustomerID = localStorage.getItem('customerId');
  //     const payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=1&PageSize=10`;

  //     this._apiCall.GetCallWithToken(payload).subscribe(
  //       (response) => {
  //         if (response && response.responseCode === 200) {
  //           this.updateBalance = parseFloat(response.data.totalBalance || 0);
  //           this.GameService.saveTotalBalance(response.data.totalBalance || 0);
  //           resolve();
  //         } else {
  //           this._httpError.handleResponseError(response);
  //           reject();
  //         }
  //       },
  //       (error) => {
  //         this._httpError.handleHttpError(error);
  //         reject(error);
  //       }
  //     );
  //   });
  // }

  SpinAgainModal = false;

  OpenSpinAgain() {
    this.isAmountCredited = false;
    // this.getWalletBalance();
    this.SpinAgainModal = true;
  }

  CloseSpinAgainModal() {
    this.SpinAgainModal = false;
  }

  // Login modal controls
  closeLoginModal() {
    this.showLoginModal = false;
  }

  openLoginModal() {
    // this.showLoginModal = true;
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.router.navigate(['/dashboard/spinner']);
      } else {
        this.router.navigate(['/login'], {
          queryParams: { redirectUrl: '/dashboard/spinner' },
        });
      }
    }
  }

  goToLogin() {
    this.showLoginModal = false;
    this.router.navigate(['/login']);
  }

  isAmountDebited: boolean = false;
  // SubmitSpinAgain(lastWin: any): Promise<any> {
  //   this.loaderService.show();
  //   const totalCost = this.GameService.getTotalBalance();
  //   const payload = this.createPaymentPayload();

  //   if (totalCost <= 5 && payload.type == 'Debit') {
  //     this.toaster.warning(
  //       'Insufficient balance. Please add funds to your wallet.',
  //       'Insufficient Balance'
  //     );
  //     this.loaderService.hide();
  //     return Promise.reject('Insufficient balance');
  //   } else {
  //     if (this.isAmountCredited) {
  //       payload.balance = lastWin;
  //     }
  //     return this._apiCall
  //       .PostCallWithToken(payload, 'Wallet/CreatePayment')
  //       .toPromise()
  //       .then((response) => {
  //         if (response.responseCode === 200) {
  //           this.SpinAgainModal = false;
  //           this.isAmountDebited = true;
  //           this.loaderService.hide();
  //           return response;
  //         } else {
  //           this._httpError.handleResponseError(response);
  //           if (this.isAmountCredited) {
  //             this.isAmountDebited = false;
  //           }
  //           this.loaderService.hide();
  //           return Promise.reject('Error in response');
  //         }
  //       })
  //       .catch((error) => {
  //         this._httpError.handleHttpError(error);
  //         this.loaderService.hide();
  //         return Promise.reject('API call failed');
  //       });
  //   }
  // }

  payload: any;
  private createPaymentPayload() {
    if (this.isAmountCredited === true) {
      this.payload = {
        customerId: localStorage.getItem('customerId'),
        balance: this.lastWin,
        source: 'Spinner',
        status: 'Complete',
        type: 'Credit',
      };
    } else {
      this.payload = {
        customerId: localStorage.getItem('customerId'),
        balance: 5,
        source: 'Spinner',
        status: 'Complete',
        type: 'Debit',
      };
    }

    return this.payload;
  }
  freespinCreditpayload() {
    return {
      customerId: localStorage.getItem('customerId'),
      balance: this.lastWin,
      source: 'Spinner',
      status: 'Complete',
      type: 'credit',
    };
  }

  // freespinCredit() {
  //   const payload = this.createPaymentPayload();
  //   this._apiCall.PostCallWithToken(payload, 'Wallet/CreatePayment').subscribe(
  //     (response) => {
  //       if (response.responseCode === 200) {
  //         this.SpinAgainModal = false;
  //         const data = response.data;
  //       } else {
  //         this._httpError.handleResponseError(response);
  //       }
  //     },
  //     (error) => {
  //       this._httpError.handleHttpError(error);
  //     }
  //   );
  // }
  isFreeSpin: boolean = false;
  SpinnerResponde = this.lastWin;
  // GetSpinnerRewards(): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     const payload = { isFreeSpin: this.isFreeSpin };
  //     this._apiCall
  //       .PostCallWithToken(payload, 'Spinner/GetSpinnerRewards')
  //       .subscribe(
  //         (response: any) => {
  //           if (response.responseCode === 200) {
  //             this.toaster.success(response.responseMessage);
  //             this.lastWin = response.data;
  //             if (this.isFreeSpin == true) {
  //               this.getlastSpinTime();
  //             }

  //             const reward = response.data;
  //             resolve(this.lastWin);
  //           } else {
  //             this.toaster.error('Failed to retrieve rewards.');
  //             this._httpError.handleResponseError(response);
  //             reject('Failed to retrieve rewards.');
  //           }
  //         },
  //         (error) => {
  //           this._httpError.handleHttpError(error);
  //           this.toaster.error('API call failed');
  //           reject('API call failed');
  //         }
  //       );
  //   });
  // }

  redirectToLottery() {
    this.router.navigate(['/dashboard/lottery']);
  }

  incrementSpinAmount(): void {
    let currentAmount = Math.floor(parseFloat(this.spinAmount) || 5);
    // Snap to at least 5
    if (currentAmount < 5) currentAmount = 5;
    const next = Math.min(20, currentAmount + 5);
    this.spinAmount = next.toString();
  }

  decrementSpinAmount(): void {
    let currentAmount = Math.floor(parseFloat(this.spinAmount) || 5);
    if (currentAmount < 5) currentAmount = 5;
    const next = Math.max(5, currentAmount - 5);
    this.spinAmount = next.toString();
  }

  private getNextValidAmount(
    currentAmount: number,
    increment: boolean
  ): number {
    const validAmounts = [5, 8, 10, 12, 15, 25, 50, 100];
    const currentIndex = validAmounts.indexOf(currentAmount);

    if (increment && currentIndex < validAmounts.length - 1) {
      return validAmounts[currentIndex + 1];
    } else if (!increment && currentIndex > 0) {
      return validAmounts[currentIndex - 1];
    }

    return currentAmount;
  }

  onCentralHubClick(event: Event): void {
    // Mirror the "Try Your Luck" button behavior
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (this.isSpinning || !this.spinAmount || !this.isSpinAllowed) {
      return;
    }

    // Trigger the same action as the button
    this.freeSpin();
  }
}
