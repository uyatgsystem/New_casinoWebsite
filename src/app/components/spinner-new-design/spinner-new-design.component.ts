import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuideStep, SpinnerSegment } from '../../Interfaces/interfaces';
import { ApiCallService } from '../../Services/api-call-service.service';
import Swal from 'sweetalert2';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { GameService } from '../../Services/game.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { LoaderService } from '../../Services/loader-service.service';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';

import {
  heroCurrencyDollar,
  heroGift,
  heroTrophy,
  heroUsers,
} from '@ng-icons/heroicons/outline';
import { ionDiamond } from '@ng-icons/ionicons';
import { hugeMoneyBag02 } from '@ng-icons/huge-icons';
import { UtilsService } from '../../Services/utils.service';

@Component({
  selector: 'app-spinner-new-design',
  standalone: true,
  templateUrl: './spinner-new-design.component.html',
  styleUrls: ['./spinner-new-design.component.scss'],
  imports: [CommonModule, FontAwesomeModule, NgIcon],
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
export class SpinnerNewDesignComponent implements OnInit {
  @Output() spinEnd = new EventEmitter<string>();

  isAmountCredited: boolean = true;

  private baseSegments: SpinnerSegment[] = [
    { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
    { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
    { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
    { id: 'seg-04', prize: '$5', icon: 'hugeMoneyBag02' },
    { id: 'seg-05', prize: '$6', icon: 'heroCurrencyDollar' },
    { id: 'seg-06', prize: '$8', icon: 'ionDiamond' },
    { id: 'seg-07', prize: '$9', icon: 'heroCurrencyDollar' },
    { id: 'seg-08', prize: '$13', icon: 'hugeMoneyBag02' },
    { id: 'seg-09', prize: '$15', icon: 'heroGift' },
    { id: 'seg-10', prize: '$20', icon: 'heroCurrencyDollar' },
  ];

  segments: SpinnerSegment[] = [...this.baseSegments];

  private readonly amountSegmentMap: Record<number, SpinnerSegment[]> = {
    5: [
      { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
      { id: 'seg-04', prize: '$5', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$6', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$8', icon: 'ionDiamond' },
      { id: 'seg-07', prize: '$9', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$13', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$15', icon: 'heroGift' },
      { id: 'seg-10', prize: '$20', icon: 'heroCurrencyDollar' },
    ],
    10: [
      { id: 'seg-01', prize: '$2', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$17', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$4', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$8', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-06', prize: '$12', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$7', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$20', icon: 'heroGift' },
      { id: 'seg-09', prize: '$10', icon: 'ionDiamond' },
      { id: 'seg-10', prize: '$14', icon: 'hugeMoneyBag02' },
    ],
    15: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$25', icon: 'hugeMoneyBag02' },
      { id: 'seg-03', prize: '$8', icon: 'heroTrophy' },
      { id: 'seg-04', prize: '$19', icon: 'ionDiamond' },
      { id: 'seg-05', prize: '$10', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$17', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$13', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$30', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$15', icon: 'heroGift' },
      { id: 'seg-10', prize: '$22', icon: 'hugeMoneyBag02' },
    ],
    20: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$45', icon: 'hugeMoneyBag02' },
      { id: 'seg-03', prize: '$10', icon: 'heroTrophy' },
      { id: 'seg-04', prize: '$35', icon: 'ionDiamond' },
      { id: 'seg-05', prize: '$15', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$30', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$20', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$50', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$25', icon: 'heroGift' },
      { id: 'seg-10', prize: '$40', icon: 'hugeMoneyBag02' },
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
    'seg-01': '#06b6d4',
    'seg-02': '#0a0e1f',
    'seg-03': '#0d9488',
    'seg-04': '#181d2e',
    'seg-05': '#22d3ee',
    'seg-06': '#0f172a',
    'seg-07': '#2dd4bf',
    'seg-08': '#1e293b',
    'seg-09': '#14b8a6',
    'seg-10': '#334155',
  };

  readonly positionColors: string[] = [
    '#06b6d4',
    '#0a0e1f',
    '#0d9488',
    '#181d2e',
    '#22d3ee',
    '#0f172a',
    '#2dd4bf',
    '#1e293b',
    '#14b8a6',
    '#334155',
  ];

  iconColors: Record<string, string> = {
    'seg-01': '#FDE68A',
    'seg-02': '#34D399',
    'seg-03': '#dfff00',
    'seg-04': '#5EEAD4',
    'seg-05': '#fa6515',
    'seg-06': '#A3E635',
    'seg-07': '#67E8F9',
    'seg-08': '#FDBA74',
    'seg-09': '#1953b4',
    'seg-10': '#67E8F9',
  };

  wheelGradient = this.buildWheelGradient();

  getIconColor(segmentOrIndex: string | number): string {
    if (typeof segmentOrIndex === 'number') {
      const idx = segmentOrIndex;
      const segId = this.segments[idx]?.id;
      if (segId && this.iconColors[segId]) return this.iconColors[segId];

      const base = this.positionColors[idx] || '#ffffff';
      return this.lightenColor(base, 35);
    }

    const explicit = this.iconColors[segmentOrIndex];
    if (explicit) return explicit;
    const base = this.segmentColors[segmentOrIndex] || '#ffffff';
    return this.lightenColor(base, 35);
  }

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
      const color =
        this.positionColors[i] || this.segmentColors[s.id] || '#444';
      parts.push(`${color} ${start}deg ${end}deg`);
    });
    return `conic-gradient(from -90deg, ${parts.join(',')})`;
  }

  constructor(
    private _apiCall: ApiCallService,
    private cdr: ChangeDetectorRef,
    private GameService: GameService,
    private _httpError: ErrorhandlingService,
    private loaderService: LoaderService,
    private router: Router,
    private _utils: UtilsService
  ) {
    const customerId = typeof localStorage !== 'undefined' ? localStorage.getItem('customerId') : null;
    this.customerid = customerId;
  }

  private lastBalanceFetchAt: number | null = null;
  private balanceFetchPromise: Promise<void> | null = null;
  private readonly BALANCE_TTL_MS = 15000;

  async ngOnInit(): Promise<void> {
    try {
      const saved = this.GameService.getTotalBalance?.();
      if (saved !== undefined && saved !== null) {
        const n = typeof saved === 'string' ? parseFloat(saved) : Number(saved);
        if (!Number.isNaN(n)) this.updateBalance = n;
      }
    } catch { }

    await this.ensureWalletBalance(true);

    await this.updateSegmentValues();

    if (!localStorage.getItem('totalBalance')) {
      this.getWalletBalance();
    }
  }

  private ensureWalletBalance(force: boolean = false): Promise<void> {
    const now = Date.now();

    if (
      !force &&
      this.lastBalanceFetchAt !== null &&
      now - this.lastBalanceFetchAt < this.BALANCE_TTL_MS &&
      this.updateBalance !== undefined
    ) {
      return Promise.resolve();
    }

    if (this.balanceFetchPromise) {
      return this.balanceFetchPromise;
    }

    this.balanceFetchPromise = this.getWalletBalance()
      .then(() => {
        this.lastBalanceFetchAt = Date.now();
      })
      .catch(() => { })
      .finally(() => {
        this.balanceFetchPromise = null;
      });

    return this.balanceFetchPromise;
  }

  private async updateSegmentValues(): Promise<void> {
    const selectedRaw = parseFloat(this.spinAmount) || 5;
    const allowed = [5, 10, 15, 20];
    const selectedAmount = allowed.includes(selectedRaw) ? selectedRaw : 5;

    if (this.updateBalance === undefined || this.updateBalance === null) {
      await this.ensureWalletBalance(true);
    } else {
      this.ensureWalletBalance(false);
    }

    const bal = this.walletBalance;
    if (typeof bal === 'number') {
      this.isBalanceSufficient = selectedAmount <= bal;
      this.isSpinAllowed = this.isBalanceSufficient;
    } else {
      this.isBalanceSufficient = true;
      this.isSpinAllowed = true;
    }

    const mapped =
      this.amountSegmentMap[selectedAmount] || this.amountSegmentMap[5];

    this.segments = mapped.map((s) => ({ ...s }));

    this.wheelGradient = this.buildWheelGradient();

    this.cdr.detectChanges();
  }

  freespincheck: boolean = false;
  paidSpin() {
    if (this.isSpinning || !this.checkTotalBalance()) return;
    this.rotation = 0;
    this.SpinAgainModal = false;
    this.isFreeSpin = false;
    this.highlightedIndex = null;
    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);
    this.testSpin();
  }

  isBalanceSufficient: boolean = false;

  async freeSpin() {
    const selectedAmount = parseFloat(this.spinAmount) || 5;

    this.ensureWalletBalance(false);

    const bal = this.walletBalance;
    if (typeof bal === 'number' && selectedAmount > bal) {
      this.isBalanceSufficient = false;
      Swal.fire({
        icon: 'warning',
        title: 'Insufficient Balance',
        text: 'Insufficient balance. Please add funds to your wallet.',
        customClass: { popup: 'swal-compact' },
      });
      return;
    }

    this.isSpinAllowed = true;
    this.isBalanceSufficient = true;

    await this.updateSegmentValues();

    this.startSpinAnimation();

    this.customerBetWithoutLoader();
  }

  private startSpinAnimation(): void {
    if (this.isSpinning) return;

    this.isSpinning = true;
    document.body.style.pointerEvents = 'none';
    this.highlightedIndex = null;
    if (this.highlightTimeout) clearTimeout(this.highlightTimeout);

    const spinnerContainer = document.querySelector('.spinner-container');
    spinnerContainer?.classList.add('spinning');

    let speed = 20;
    let rotationStep = -20;

    const spinInterval = setInterval(() => {
      this.rotation += rotationStep;
      if (speed < 80) {
        speed += 0.3;
        clearInterval(spinInterval);
        setTimeout(() => {
          const newInterval = setInterval(() => {
            this.rotation += rotationStep;
          }, speed);

          this.currentSpinInterval = newInterval;
        }, speed);
      }
    }, speed);

    this.currentSpinInterval = spinInterval;
  }

  private currentSpinInterval: any = null;

  private checkTotalBalance(): boolean {
    if (!localStorage.getItem('totalBalance')) {
      this.getWalletBalance();
      return false;
    }
    return true;
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

    let chosenIndex: number;

    if (typeof winningIndex === 'number' && winningIndex > 0) {
      const prizeToFind = '$' + winningIndex;

      this.segments.forEach((segment, index) => { });

      const prizeIndex = this.segments.findIndex(
        (segment) => segment.prize === prizeToFind
      );

      if (prizeIndex !== -1) {
        chosenIndex = prizeIndex;
      } else {
        const numericPrizes = this.segments.map((segment) => {
          const numValue = parseFloat(segment.prize.replace(/[^0-9.]/g, ''));
          return {
            index: this.segments.indexOf(segment),
            id: segment.id,
            prize: segment.prize,
            numValue: numValue,
            difference: Math.abs(numValue - winningIndex),
          };
        });

        numericPrizes.sort((a, b) => a.difference - b.difference);

        if (numericPrizes.length > 0) {
          chosenIndex = numericPrizes[0].index;
        } else {
          chosenIndex = Math.floor(Math.random() * this.segments.length);
        }
      }
    } else {
      chosenIndex = Math.floor(Math.random() * this.segments.length);
    }

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

    if (this.customerBetWinningAmount > 0) {
      const actualWinningAmount = parseFloat(seg.prize.replace(/[^0-9.]/g, ''));
      this.lastWin = '$' + this.customerBetWinningAmount;
    }

    this.highlightedIndex = chosenIndex;
    this.spinEnd.emit(this.lastWin);

    this.isSpinning = false;
    document.body.style.pointerEvents = 'auto';

    spinnerContainer?.classList.remove('spinning', 'spin-ending');

    if (seg.prize === 'Free Spin') {
      setTimeout(() => {
        this.testSpin();
      }, 1000);
    }

    this.customerBetWinningAmount = 0;

    this.scheduleHighlightClear();
    this.cdr.markForCheck();
    this.addPointerSettleEffect();

    setTimeout(() => {
      spinnerContainer?.classList.remove('spin-ending');
    }, 3000);
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

  resetSpinner() {
    this.lastWin = null;
    this.highlightedIndex = null;
    this.isSpinning = false;
  }

  serverTimeData: any;
  sppinertime: any;

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
      Swal.fire({
        icon: 'info',
        title: 'Rewards',
        text: 'Rewards, Your daily free spin is ready',
        customClass: { popup: 'swal-compact' },
      });
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

WalletPayload() {
    return {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate:'',
    }
  }
  // getWalletBalance(pageNumber: number = 1, searchText: string = '') {
  //   this.loaderService.show();
  //   const CustomerID = localStorage.getItem('customerId');
  //   // let payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=${pageNumber}&PageSize=${10}`;
  //   let payload = this.WalletPayload();

  //   // if (searchText.trim()) {
  //   //   payload += `&SearchText=${encodeURIComponent(searchText.trim())}`;
  //   // }




  private getWalletBalance(): Promise<void> {
    return new Promise((resolve, reject) => {
      const CustomerID = localStorage.getItem('customerId');
      // const payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=1&PageSize=10`;
      const payload = this.WalletPayload();

      this._apiCall.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.updateBalance = parseFloat(response.data.totalBalance || 0);
            this.GameService.saveTotalBalance(response.data.totalBalance || 0);
            this.cdr.detectChanges();
            resolve();
          } else {
            this._httpError.handleResponseError(response);
            reject();
          }
        },
        (error) => {
          this._httpError.handleHttpError(error);
          reject(error);
        }
      );
    });
  }

  SpinAgainModal = false;

  OpenSpinAgain() {
    this.isAmountCredited = false;
    this.getWalletBalance();
    this.SpinAgainModal = true;
  }

  CloseSpinAgainModal() {
    this.SpinAgainModal = false;
  }

  isFreeSpin: boolean = false;

  redirectToLottery() {
    this.router.navigate(['/dashboard/lottery']);
  }

  incrementSpinAmount(): void {
    let currentAmount = Math.floor(parseFloat(this.spinAmount) || 5);
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
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (this.isSpinning || !this.spinAmount || !this.isSpinAllowed) {
      return;
    }

    this.freeSpin();
  }

  customerBetWithoutLoader() {
    const payload = this.createCustomerBetPayload();
    this._apiCall.PostCallWithToken(payload, 'Spinner/CustomerBet').subscribe(
      (response) => {
        if (response.responseCode === 200) {
          this.customerBetWinningAmount = response.data;

          setTimeout(() => {
            this.loaderService?.triggerWalletFunction();
          }, 2500);

          const prizeToFind = '$' + this.customerBetWinningAmount;
          const prizeIndex = this.segments.findIndex(
            (segment) => segment.prize === prizeToFind
          );

          if (this.currentSpinInterval) {
            clearInterval(this.currentSpinInterval);
            this.currentSpinInterval = null;
          }

          if (prizeIndex === -1) {
            const hasCloseMatch = this.findClosestPrizeMatch(
              this.customerBetWinningAmount
            );

            if (!hasCloseMatch) {
              this.completeSpinToRandomIndex();
              Swal.fire({
                icon: 'warning',
                title: 'Try Again',
                text: 'Prize not found. Please try again.',
                customClass: { popup: 'swal-compact' },
              });
            } else {
              this.completeSpinToTarget(this.customerBetWinningAmount);
            }
          } else {
            this.completeSpinToTarget(this.customerBetWinningAmount);
          }
        } else {
          this.stopSpinningWithError();
          this._httpError.handleResponseError(response);
        }
      },
      (error) => {
        this.stopSpinningWithError();
        this._httpError.handleHttpError(error);
      }
    );
  }

  private completeSpinToTarget(winningAmount: number): void {
    if (this.currentSpinInterval) {
      clearInterval(this.currentSpinInterval);
      this.currentSpinInterval = null;
    }

    const prizeToFind = '$' + winningAmount;
    const prizeIndex = this.segments.findIndex(
      (segment) => segment.prize === prizeToFind
    );

    let chosenIndex: number;

    if (prizeIndex !== -1) {
      chosenIndex = prizeIndex;
    } else {
      const numericPrizes = this.segments.map((segment) => {
        const numValue = parseFloat(segment.prize.replace(/[^0-9.]/g, ''));
        return {
          index: this.segments.indexOf(segment),
          id: segment.id,
          prize: segment.prize,
          numValue: numValue,
          difference: Math.abs(numValue - winningAmount),
        };
      });

      numericPrizes.sort((a, b) => a.difference - b.difference);

      if (
        numericPrizes.length > 0 &&
        numericPrizes[0].difference <= winningAmount * 0.2
      ) {
        chosenIndex = numericPrizes[0].index;
      } else {
        chosenIndex = Math.floor(Math.random() * this.segments.length);
        Swal.fire({
          icon: 'warning',
          title: 'Try Again',
          text: 'No matching prize found. Please try again.',
          customClass: { popup: 'swal-compact' },
        });
      }
    }

    const spinnerContainer = document.querySelector('.spinner-container');
    const segmentAngle = this.segmentAngle;
    const currentPointerAngle = ((-this.rotation % 360) + 360) % 360;
    const sliceStart = chosenIndex * segmentAngle;
    const sliceEnd = sliceStart + segmentAngle;
    const desiredCenterAngle = sliceStart + segmentAngle / 2;

    const settleOffset = 8 + Math.random() * 10;

    let delta = (desiredCenterAngle - currentPointerAngle + 360) % 360;
    const FULL_ROTATIONS = 6;
    delta += FULL_ROTATIONS * 360;
    const finalTargetRotation = this.rotation - delta + settleOffset;

    const startTime = performance.now();
    const initialRotation = this.rotation;
    const totalDistance = Math.abs(finalTargetRotation - initialRotation);

    const TOTAL_DURATION = 5000;

    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / TOTAL_DURATION, 1);

      const eased = 1 - Math.pow(1 - t, 3);

      const currentRotation = initialRotation - totalDistance * eased;

      this.rotation = currentRotation;
      if (t >= 1) {
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
    }, TOTAL_DURATION * 0.6);
  }

  private findClosestPrizeMatch(winningAmount: number): boolean {
    const numericPrizes = this.segments.map((segment) => {
      const numValue = parseFloat(segment.prize.replace(/[^0-9.]/g, ''));
      return {
        index: this.segments.indexOf(segment),
        prize: segment.prize,
        numValue: numValue,
        difference: Math.abs(numValue - winningAmount),
      };
    });

    numericPrizes.sort((a, b) => a.difference - b.difference);

    if (
      numericPrizes.length > 0 &&
      numericPrizes[0].difference <= winningAmount * 0.2
    ) {
      return true;
    }
    return false;
  }

  private completeSpinToRandomIndex(): void {
    if (this.currentSpinInterval) {
      clearInterval(this.currentSpinInterval);
      this.currentSpinInterval = null;
    }

    const randomIndex = Math.floor(Math.random() * this.segments.length);

    const spinnerContainer = document.querySelector('.spinner-container');
    const segmentAngle = this.segmentAngle;
    const currentPointerAngle = ((-this.rotation % 360) + 360) % 360;
    const sliceStart = randomIndex * segmentAngle;
    const sliceEnd = sliceStart + segmentAngle;
    const desiredCenterAngle = sliceStart + segmentAngle / 2;

    const settleOffset = 8 + Math.random() * 10;

    let delta = (desiredCenterAngle - currentPointerAngle + 360) % 360;
    const FULL_ROTATIONS = 4;
    delta += FULL_ROTATIONS * 360;
    const finalTargetRotation = this.rotation - delta + settleOffset;

    const startTime = performance.now();
    const initialRotation = this.rotation;
    const totalDistance = Math.abs(finalTargetRotation - initialRotation);

    const TOTAL_DURATION = 4000;

    let animationFrame: number;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / TOTAL_DURATION, 1);

      const eased = 1 - Math.pow(1 - t, 3);
      const currentRotation = initialRotation - totalDistance * eased;

      this.rotation = currentRotation;
      if (t >= 1) {
        this.rotation = finalTargetRotation;
        this.completeRandomSpinAnimation(randomIndex, spinnerContainer);
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
    }, TOTAL_DURATION * 0.6);
  }

  private completeRandomSpinAnimation(
    chosenIndex: number,
    spinnerContainer: Element | null
  ): void {
    this.isSpinning = false;
    document.body.style.pointerEvents = 'auto';

    spinnerContainer?.classList.remove('spinning', 'spin-ending');

    this.addPointerSettleEffect();

    this.highlightedIndex = chosenIndex;
    this.scheduleHighlightClear();

    this.cdr.detectChanges();
  }

  private stopSpinningWithError(): void {
    if (this.currentSpinInterval) {
      clearInterval(this.currentSpinInterval);
      this.currentSpinInterval = null;
    }

    if (this.isSpinning) {
      this.completeSpinToRandomIndex();
      return;
    }

    document.body.style.pointerEvents = 'auto';
    const spinnerContainer = document.querySelector('.spinner-container');
    spinnerContainer?.classList.remove('spinning', 'spin-ending');
    this.highlightedIndex = null;
    this.rotation = this.rotation % 360;
    this.cdr.detectChanges();
  }

  customerBetWinningAmount: number = 0;

  createCustomerBetPayload() {
    return {
      betType: 'spinner',
      customerId: localStorage.getItem('customerId'),
      bet: this.spinAmount,
    };
  }

  showGuide() {
    const steps: GuideStep[] = [
      {
        imageUrlSm: '/Images/user-manual/spinner/user-manual.png',

        imageUrlLg: '/Images/user-manual/spinner/user-manual.png',
        alt: 'Wallet overview screenshot',
      },
    ];

    this._utils.open(steps, 0, {
      title: 'Spinner Walkthrough',
    });
  }
}
