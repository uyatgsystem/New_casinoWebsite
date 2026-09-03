import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
  OnDestroy,
  Input,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { GuideStep, SpinnerSegment } from '../../Interfaces/interfaces';
import { ApiCallService } from '../../Services/api-call-service.service';
import Swal from 'sweetalert2';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
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
import { response } from 'express';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-spinner',
  standalone: true,
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
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
export class SpinnerComponent implements OnInit, OnDestroy {
  @Input() showHeaderSection: boolean = true;
  @Output() spinEnd = new EventEmitter<string>();
  grainBackdrop: SafeHtml = '';
  isAmountCredited: boolean = true;
  selectedNav: 'Games' | 'Quick' | 'Upcoming' = 'Games';
  selectNav(nav: 'Games' | 'Quick' | 'Upcoming') {
    this.selectedNav = nav;
  }
  private baseSegments: SpinnerSegment[] = [
    { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
    { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
    { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
    { id: 'seg-04', prize: '$5', icon: 'hugeMoneyBag02' },
    // { id: 'seg-05', prize: '$6', icon: 'heroCurrencyDollar' },
    { id: 'seg-06', prize: '$8', icon: 'ionDiamond' },
    // { id: 'seg-07', prize: '$9', icon: 'heroCurrencyDollar' },
    { id: 'seg-08', prize: '$13', icon: 'hugeMoneyBag02' },
    { id: 'seg-09', prize: '$15', icon: 'heroGift' },
    { id: 'seg-10', prize: '$20', icon: 'heroCurrencyDollar' },
  ];

  segments: SpinnerSegment[] = [...this.baseSegments];

  // Free Spin Segments with different values: [0, 1, 3, 2, 5, 4, 7, 6, 9, 8]
  private readonly freeSpinSegments: SpinnerSegment[] = [
    { id: 'seg-01', prize: '$0', icon: 'heroTrophy' },
    { id: 'seg-02', prize: '$1', icon: 'ionDiamond' },
    { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
    { id: 'seg-04', prize: '$2', icon: 'hugeMoneyBag02' },
    { id: 'seg-05', prize: '$5', icon: 'heroCurrencyDollar' },
    { id: 'seg-06', prize: '$4', icon: 'ionDiamond' },
    { id: 'seg-07', prize: '$7', icon: 'heroCurrencyDollar' },
    { id: 'seg-08', prize: '$6', icon: 'hugeMoneyBag02' },
    { id: 'seg-09', prize: '$9', icon: 'heroGift' },
    { id: 'seg-10', prize: '$8', icon: 'heroCurrencyDollar' },
  ];

  private readonly amountSegmentMap: Record<number, SpinnerSegment[]> = {
    1: [
      { id: 'seg-01', prize: '$0', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$1', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$2', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$2', icon: 'heroTrophy' },
      { id: 'seg-05', prize: '$0', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$3', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$4', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$5', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$2', icon: 'ionDiamond' },
      { id: 'seg-10', prize: '$1', icon: 'heroGift' },
    ],
    2: [
      { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$0', icon: 'heroCurrencyDollar' },
      { id: 'seg-03', prize: '$2', icon: 'ionDiamond' },
      { id: 'seg-04', prize: '$3', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$4', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$4', icon: 'heroTrophy' },
      { id: 'seg-07', prize: '$5', icon: 'ionDiamond' },
      { id: 'seg-08', prize: '$6', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$1', icon: 'heroGift' },
      { id: 'seg-10', prize: '$2', icon: 'heroCurrencyDollar' },
    ],
    3: [
      { id: 'seg-01', prize: '$0', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$1', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$2', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$1', icon: 'heroTrophy' },
      { id: 'seg-05', prize: '$2', icon: 'ionDiamond' },
      { id: 'seg-06', prize: '$3', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$4', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-09', prize: '$7', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$9', icon: 'heroGift' },
    ],
    4: [
      { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$3', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$4', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$6', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$7', icon: 'ionDiamond' },
      { id: 'seg-07', prize: '$8', icon: 'hugeMoneyBag02' },
      { id: 'seg-08', prize: '$9', icon: 'heroCurrencyDollar' },
      { id: 'seg-09', prize: '$0', icon: 'heroTrophy' },
      { id: 'seg-10', prize: '$12', icon: 'heroGift' },
    ],
    5: [
      { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
      { id: 'seg-04', prize: '$5', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$6', icon: 'heroCurrencyDollar' },
      { id: 'seg-06', prize: '$8', icon: 'ionDiamond' },
      { id: 'seg-07', prize: '$9', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$10', icon: 'hugeMoneyBag02' },
      { id: 'seg-09', prize: '$13', icon: 'heroGift' },
      { id: 'seg-10', prize: '$15', icon: 'heroCurrencyDollar' },
    ],
    10: [
      { id: 'seg-01', prize: '$2', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$4', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$5', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$7', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$8', icon: 'heroTrophy' },
      { id: 'seg-06', prize: '$10', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$12', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$14', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$17', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$20', icon: 'heroGift' },
    ],
    15: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$8', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$10', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$13', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$15', icon: 'heroTrophy' },
      { id: 'seg-06', prize: '$17', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$19', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$22', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$25', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$30', icon: 'heroGift' },
    ],
    20: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$10', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$13', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$15', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$20', icon: 'heroTrophy' },
      { id: 'seg-06', prize: '$22', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$25', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$30', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$35', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$40', icon: 'heroGift' },
    ],
    25: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$10', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$15', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$18', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$20', icon: 'heroTrophy' },
      { id: 'seg-06', prize: '$25', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$30', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$35', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$40', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$45', icon: 'heroGift' },
      { id: 'seg-11', prize: '$50', icon: 'heroCurrencyDollar' },
    ],
    30: [
      { id: 'seg-01', prize: '$5', icon: 'heroTrophy' },
      { id: 'seg-02', prize: '$10', icon: 'ionDiamond' },
      { id: 'seg-03', prize: '$15', icon: 'heroCurrencyDollar' },
      { id: 'seg-04', prize: '$20', icon: 'hugeMoneyBag02' },
      { id: 'seg-05', prize: '$25', icon: 'heroTrophy' },
      { id: 'seg-06', prize: '$30', icon: 'hugeMoneyBag02' },
      { id: 'seg-07', prize: '$35', icon: 'heroCurrencyDollar' },
      { id: 'seg-08', prize: '$40', icon: 'ionDiamond' },
      { id: 'seg-09', prize: '$45', icon: 'hugeMoneyBag02' },
      { id: 'seg-10', prize: '$50', icon: 'heroGift' },
      { id: 'seg-11', prize: '$60', icon: 'heroCurrencyDollar' },
    ],
  };

  private prizeImages = [
    'https://cmaxv2images2.pages.dev/assets/icons/money-bag.png',
    'https://cmaxv2images2.pages.dev/assets/icons/money-box.png',
  ];

  getPrizeImageByIndex(index: number): string {
    const imageIndex = index % this.prizeImages.length;
    return this.prizeImages[imageIndex];
  }

  private _spinAmount: string = '5';

  get spinAmount(): string {
    return this._spinAmount;
  }

  set spinAmount(value: string) {
    this._spinAmount = value;
    this.updateSegmentValues();
  }

  crossicon = faXmark;
  leftArrow = faChevronLeft;
  isSpinning = false;
  rotation = 0;
  lastWin: string | null = null;
  winningPrize: string = '$0';
  highlightedIndex: number | null = null;
  private highlightTimeout: any;
  private readonly HIGHLIGHT_DURATION_MS = 6000;

  customerid: any;
  showCongratsModal: boolean = false;
  private readonly SPIN_DURATION = 4000;
  private readonly MIN_SPINS = 5;

  public get segmentAngle(): number {
    return 360 / (this.segments.length || 1);
  }

  isSpinAllowed!: boolean;

  remainingTimeInSeconds: number = 0;
  formattedTime: string = '';
  private countdownInterval: any;

  segmentColors: Record<string, string> = {
    'seg-01': '#0A0E1FCC',
    'seg-02': '#0A0E1FCC',
    'seg-03': '#0A0E1FCC',
    'seg-04': '#0A0E1FCC',
    'seg-05': '#0A0E1FCC',
    'seg-06': '#0A0E1FCC',
    'seg-07': '#0A0E1FCC',
    'seg-08': '#0A0E1FCC',
    'seg-09': '#0A0E1FCC',
    'seg-10': '#0A0E1FCC',
    'seg-11': '#0A0E1FCC',
  };

  // segmentColors: Record<string, string> = {
  //   'seg-01': '#7DE7E5',
  //   'seg-02': '#0A0E1F',
  //   'seg-03': '#89F0EE',
  //   'seg-04': '#181D2E',
  //   'seg-05': '#6BD4D2',
  //   'seg-06': '#12172A',
  //   'seg-07': '#5BC2BF',
  //   'seg-08': '#151A2D',
  //   'seg-09': '#9AF3F1',
  //   'seg-10': '#1F2436',
  // };

  get positionColors(): string[] {
    return Array(this.segments.length || 1).fill('#0A0E1FCC');
  }

  // readonly positionColors: string[] = [
  //   '#7DE7E5',
  //   '#0A0E1F',
  //   '#89F0EE',
  //   '#181D2E',
  //   '#6BD4D2',
  //   '#12172A',
  //   '#5BC2BF',
  //   '#151A2D',
  //   '#9AF3F1',
  //   '#1F2436',
  // ];

  iconColors: Record<string, string> = {
    'seg-01': '#FFD166', // Warm contrast
    'seg-02': '#43E5C2', // Teal neon
    'seg-03': '#8BFFFB', // Aqua pop
    'seg-04': '#A4B4FF', // Soft violet
    'seg-05': '#FFEB3B', // Yellow highlight
    'seg-06': '#38E3D0', // Teal lite
    'seg-07': '#00F0FF', // Cyan neon
    'seg-08': '#FFAE63', // Orange warm
    'seg-09': '#4EFDD9', // Mint neon
    'seg-10': '#C7B6FF', // Light purple
    'seg-11': '#E0C9FF',
  };

  wheelGradient: string = '';

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
    private location: Location,
    private _utils: UtilsService,
  ) {
    const customerId = localStorage.getItem('customerId');
    this.customerid = customerId;
    this.grainBackdrop = this._utils.getGrainBackdrop();
  }

  goBack() {
    this.location.back();
  }

  isMobile() {
    return window.innerWidth < 768;
  }
  private lastBalanceFetchAt: number | null = null;
  private balanceFetchPromise: Promise<void> | null = null;
  private readonly BALANCE_TTL_MS = 15000;

  async ngOnInit(): Promise<void> {
    this.getCustomerSpinnerHistory();
    try {
      const saved = this.GameService.getTotalBalance?.();
      if (saved !== undefined && saved !== null) {
        const n = typeof saved === 'string' ? parseFloat(saved) : Number(saved);
        if (!Number.isNaN(n)) this.updateBalance = n;
      }
    } catch {}

    await this.ensureWalletBalance(true);

    await this.updateSegmentValues();

    if (!localStorage.getItem('totalBalance')) {
      this.getWalletBalance();
    }

    // Check free spin status on component load
    try {
      await this.getSpinnerStatus();
    } catch (error) {
      // Free spin check failed, continue normally
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
      .catch(() => {})
      .finally(() => {
        this.balanceFetchPromise = null;
      });

    return this.balanceFetchPromise;
  }

  private async updateSegmentValues(): Promise<void> {
    const selectedRaw = parseFloat(this.spinAmount) || 5;
    const allowed = this.allowedSpinAmounts;
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

      this.segments.forEach((segment, index) => {});

      const prizeIndex = this.segments.findIndex(
        (segment) => segment.prize === prizeToFind,
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
          desiredCenterAngle,
        );
        return;
      }

      this.cdr.detectChanges();

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    setTimeout(
      () => {
        if (this.isSpinning) {
          spinnerContainer?.classList.remove('spinning');
          spinnerContainer?.classList.add('spin-ending');
        }
      },
      FAST_PHASE_DURATION + SLOW_PHASE_DURATION * 0.7,
    );
  }

  private completeSpinAnimation(
    chosenIndex: number,
    spinnerContainer: Element | null,
    sliceStart: number,
    sliceEnd: number,
    desiredCenterAngle: number,
  ): void {
    const seg = this.segments[chosenIndex];

    this.lastWin = seg.prize;

    if (this.customerBetWinningAmount > 0) {
      const actualWinningAmount = parseFloat(seg.prize.replace(/[^0-9.]/g, ''));
      this.lastWin = '$' + this.customerBetWinningAmount;
      this.winningPrize = '$' + this.customerBetWinningAmount;
    }

    this.highlightedIndex = chosenIndex;
    this.spinEnd.emit(this.lastWin);

    // this.isSpinning = false;
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

    setTimeout(() => {
      this.showCongratsModalWithAutoClose();
      this.cdr.detectChanges();
    }, 3000);
  }

  private congratsModalTimeout: any;
  closeCongratsModal(): void {
    this.showCongratsModal = false;
    this.isSpinning = false;
    if (this.congratsModalTimeout) {
      clearTimeout(this.congratsModalTimeout);
      this.congratsModalTimeout = null;
    }
    this.cdr.detectChanges();
  }

  private showCongratsModalWithAutoClose(): void {
    this.refreshSpinnerHistory();
    this.showCongratsModal = true;
    this.cdr.detectChanges();

    // Refresh balance after showing the modal
    this.getWalletBalance()
      .then(() => {
        this.cdr.detectChanges();
        setTimeout(() => {
          this.loaderService?.triggerWalletFunction();
        }, 500);
      })
      .catch(() => {
        this.cdr.detectChanges();
      });

    this.congratsModalTimeout = setTimeout(() => {
      this.showCongratsModal = false;
      this.isSpinning = false;
      // Clear the highlight 1 second after modal closes
      setTimeout(() => {
        this.highlightedIndex = null;
        if (this.highlightTimeout) {
          clearTimeout(this.highlightTimeout);
          this.highlightTimeout = null;
        }
        this.cdr.detectChanges();
      }, 1000);
      this.cdr.detectChanges();
    }, 5000);
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
          serverDateTimeObj.getUTCDate() + 1,
        ),
      );

      const differenceInSeconds = Math.floor(
        (nextDayStart.getTime() - serverDateTimeObj.getTime()) / 1000,
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
    if (this.freeSpinCountdownInterval) {
      clearInterval(this.freeSpinCountdownInterval);
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

  private getWalletBalance(): Promise<void> {
    return new Promise((resolve, reject) => {
      const CustomerID = localStorage.getItem('customerId');
      const payload = this.WalletPayload();

      this._apiCall
        .PostCallWithToken(payload, 'Wallet/GetWalletBalance')
        .subscribe(
          (response) => {
            if (response && response.responseCode === 200) {
              this.updateBalance = parseFloat(response.data.totalBalance || 0);
              this.GameService.saveTotalBalance(
                response.data.totalBalance || 0,
              );

              // Update balance sufficiency flags
              const selectedAmount = parseFloat(this.spinAmount) || 5;
              this.isBalanceSufficient = selectedAmount <= this.updateBalance;
              this.isSpinAllowed = this.isBalanceSufficient;

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
          },
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

  // Free Spin related properties
  freeSpinWindowOpen: boolean = false;
  freeSpinReward: number = 0;
  freeSpinTimestamp: string = '';
  nextFreeSpinTimestamp: string = '';
  freeSpinCountdownTime: string = '00:00:00';
  private freeSpinCountdownInterval: any;
  isCurrentlyFreeSpin: boolean = false;

  redirectToLottery() {
    this.router.navigate(['/dashboard/lottery']);
  }

  // incrementSpinAmount(): void {
  //   let currentAmount = Math.floor(parseFloat(this.spinAmount) || 5);
  //   if (currentAmount < 5) currentAmount = 5;
  //   const next = Math.min(20, currentAmount + 5);
  //   this.spinAmount = next.toString();
  // }

  // decrementSpinAmount(): void {
  //   let currentAmount = Math.floor(parseFloat(this.spinAmount) || 5);
  //   if (currentAmount < 5) currentAmount = 5;
  //   const next = Math.max(5, currentAmount - 5);
  //   this.spinAmount = next.toString();
  // }
  allowedSpinAmounts = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];

  incrementSpinAmount(): void {
    let current = Number(this.spinAmount) || 1;

    const idx = this.allowedSpinAmounts.indexOf(current);
    if (idx < this.allowedSpinAmounts.length - 1) {
      this.spinAmount = this.allowedSpinAmounts[idx + 1].toString();
    }
  }

  decrementSpinAmount(): void {
    let current = Number(this.spinAmount) || 1;

    const idx = this.allowedSpinAmounts.indexOf(current);
    if (idx > 0) {
      this.spinAmount = this.allowedSpinAmounts[idx - 1].toString();
    }
  }

  private getNextValidAmount(
    currentAmount: number,
    increment: boolean,
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

    if (this.isSpinning) {
      return;
    }

    // Check free spin availability first
    this.checkAndExecuteFreeSpin();
  }

  async checkAndExecuteFreeSpin(): Promise<void> {
    try {
      await this.getSpinnerStatus();

      if (this.isCurrentlyFreeSpin && this.freeSpinWindowOpen) {
        // Free spin is available
        await this.executeFreeSpin();
      } else {
        // Free spin not available, proceed with paid spin
        if (!this.spinAmount || !this.isSpinAllowed) {
          return;
        }
        this.freeSpin();
      }
    } catch (error) {
      // On error, try paid spin
      if (!this.spinAmount || !this.isSpinAllowed) {
        return;
      }
      this.freeSpin();
    }
  }

  customerSpinnerHistory: any[] = [];
  currentPage: number = 1;
  pageSize: number = 10;
  isLoadingMore: boolean = false;
  hasReachedEnd: boolean = false;

  onScroll(event: Event) {
    const element = event.target as HTMLElement;
    const threshold = 50; // px from bottom to trigger load
    const distanceFromBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight;

    if (
      distanceFromBottom <= threshold &&
      !this.isLoadingMore &&
      !this.hasReachedEnd
    ) {
      this.loadMore();
    }
  }

  loadMore() {
    this.currentPage++;
    this.getCustomerSpinnerHistory();
  }

  private refreshSpinnerHistory(): void {
    this.customerSpinnerHistory = [];
    this.currentPage = 1;
    this.hasReachedEnd = false;
    this.isLoadingMore = false;
    this.getCustomerSpinnerHistory();
  }

  getCustomerSpinnerHistory() {
    if (this.isLoadingMore || this.hasReachedEnd) return;

    this.isLoadingMore = true;
    const payload = this.createSpinnerHistoryPayload();

    this._apiCall
      .PostCallWithToken(payload, 'Spinner/GetCustomerSpinnerHistory')
      .subscribe(
        (response) => {
          if (response.responseCode === 200) {
            const newData = response.data.filter(
              (x: any) => x.Type === 'Credit',
            );

            if (newData.length < this.pageSize) {
              // Received fewer items than pageSize — we've hit the end
              this.hasReachedEnd = true;
            }

            if (newData.length === 0) {
              this.isLoadingMore = false;
              return;
            }

            // Append new data to existing list (infinite scroll effect)
            this.customerSpinnerHistory = [
              ...this.customerSpinnerHistory,
              ...newData,
            ];
          }
          this.isLoadingMore = false;
        },
        (error) => {
          this.isLoadingMore = false;
        },
      );
  }

  createSpinnerHistoryPayload() {
    return {
      customerId: localStorage.getItem('customerId'),
      pageNumber: this.currentPage,
      pageSize: this.pageSize,
    };
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
            (segment) => segment.prize === prizeToFind,
          );

          if (this.currentSpinInterval) {
            clearInterval(this.currentSpinInterval);
            this.currentSpinInterval = null;
          }

          if (prizeIndex === -1) {
            const hasCloseMatch = this.findClosestPrizeMatch(
              this.customerBetWinningAmount,
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
      },
    );
  }

  private completeSpinToTarget(winningAmount: number): void {
    if (this.currentSpinInterval) {
      clearInterval(this.currentSpinInterval);
      this.currentSpinInterval = null;
    }

    const prizeToFind = '$' + winningAmount;
    const prizeIndex = this.segments.findIndex(
      (segment) => segment.prize === prizeToFind,
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
        this.winningPrize = '$' + winningAmount;
        this.completeSpinAnimation(
          chosenIndex,
          spinnerContainer,
          sliceStart,
          sliceEnd,
          desiredCenterAngle,
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
    spinnerContainer: Element | null,
  ): void {
    // this.isSpinning = false;
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
        imageUrlSm:
          'https://cmaxv2images2.pages.dev/assets/user-manual/spinguide.png',

        // imageUrlLg: '/Images/user-manual/spinner/user-manual.png',
        // alt: 'Wallet overview screenshot',
      },
    ];

    this._utils.open(steps, 0, {
      title: 'Spinner Walk through',
    });
  }

  // Get Spinner status to check if free spin is available
  getSpinnerStatus(): Promise<void> {
    return new Promise((resolve, reject) => {
      const customerId = localStorage.getItem('customerId');
      const payload = {
        customerId: customerId,
      };

      this._apiCall
        .GetCallWithToken(`Spinner/GetSpinner?CustomerId=${customerId}`)
        .subscribe(
          (response) => {
            if (response && response.responseCode === 200) {
              this.freeSpinWindowOpen = response.data.fresspinWindowIsOpen;
              const spinnerTime = response.data.spinnerTime;
              const serverDateTime = response.data.serverDateTime;

              if (this.freeSpinWindowOpen) {
                // User still has free spins remaining, check if 24 hours have passed since last spin
                this.calculateTimerFor24HourWindow(spinnerTime, serverDateTime);
              } else {
                // User has used all 3 free spins, cannot use free spin anymore
                this.isCurrentlyFreeSpin = false;
                this.freeSpinCountdownTime = 'Make Deposit To Unlock More FreeSpin';
              }

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
          },
        );
    });
  }

  // Calculate if 24 hours have passed since last spin
  private calculateTimerFor24HourWindow(
    spinnerTime: string,
    serverDateTime: string,
  ): void {
    try {
      const lastSpinDate = new Date(
        spinnerTime.endsWith('Z') ? spinnerTime : `${spinnerTime}Z`,
      );
      const currentServerDate = new Date(serverDateTime);

      // Calculate 24 hours from last spin
      const nextSpinAvailableTime = new Date(lastSpinDate);
      nextSpinAvailableTime.setHours(nextSpinAvailableTime.getHours() + 24);

      const timeRemaining =
        nextSpinAvailableTime.getTime() - currentServerDate.getTime();

      if (timeRemaining <= 0) {
        // 24 hours have passed, free spin is available
        this.isCurrentlyFreeSpin = true;
        this.freeSpinCountdownTime = 'READY';
      } else {
        // 24 hours have NOT passed yet, show countdown
        this.isCurrentlyFreeSpin = false;
        this.nextFreeSpinTimestamp = nextSpinAvailableTime.toISOString();
        this.startCountdownFromServerTime(
          currentServerDate,
          nextSpinAvailableTime,
        );
      }

      this.cdr.detectChanges();
    } catch (error) {
      this.isCurrentlyFreeSpin = false;
    }
  }

  // Start countdown using server time as reference
  private startCountdownFromServerTime(serverNow: Date, endTime: Date): void {
    if (this.freeSpinCountdownInterval) {
      clearInterval(this.freeSpinCountdownInterval);
    }

    // Calculate initial remaining time
    let timeRemaining = endTime.getTime() - serverNow.getTime();

    const updateCountdown = () => {
      if (timeRemaining <= 0) {
        clearInterval(this.freeSpinCountdownInterval);
        this.isCurrentlyFreeSpin = true;
        this.freeSpinCountdownTime = 'READY';
        Swal.fire({
          icon: 'success',
          title: 'Free Spin Ready!',
          text: 'Your daily free spin is now available!',
          customClass: { popup: 'swal-compact' },
        });
        this.cdr.detectChanges();
        return;
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      this.freeSpinCountdownTime = `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      timeRemaining -= 1000; // Decrease by 1 second
      this.cdr.detectChanges();
    };

    updateCountdown();
    this.freeSpinCountdownInterval = setInterval(updateCountdown, 1000);
  }

  // Call Free Spin API
  callFreeSpinAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      const customerId = localStorage.getItem('customerId');
      const payload = {
        customerid: customerId,
        isFreeSpin: true,
      };

      this._apiCall.PostCallWithToken(payload, 'Spinner/Spinner').subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.freeSpinReward = response.data.reward;
            this.freeSpinTimestamp = response.data.timestamp;

            // Update remaining free spins and window expiry
            if (response.data.remainingFreeSpins !== undefined) {
              // If remaining free spins > 0, start 24-hour countdown from current timestamp
              if (response.data.remainingFreeSpins > 0) {
                this.freeSpinWindowOpen = true;
                this.isCurrentlyFreeSpin = false; // Hide free spin button, show timer

                // Start 24-hour countdown from the response timestamp
                const currentTime = new Date(this.freeSpinTimestamp);
                const nextSpinTime = new Date(currentTime);
                nextSpinTime.setHours(nextSpinTime.getHours() + 24);

                this.startCountdownFromServerTime(currentTime, nextSpinTime);
              } else {
                // No more free spins remaining
                this.freeSpinWindowOpen = false;
                this.isCurrentlyFreeSpin = false;
                this.freeSpinCountdownTime = 'No more free spins';
              }
            }

            // Use the reward in the spin
            this.customerBetWinningAmount = this.freeSpinReward;
            this.winningPrize = '$' + this.freeSpinReward;

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
        },
      );
    });
  }

  // Start 24-hour countdown for next free spin

  // Execute free spin
  async executeFreeSpin(): Promise<void> {
    if (this.isSpinning) return;

    try {
      if (!this.isCurrentlyFreeSpin) {
        Swal.fire({
          icon: 'warning',
          title: 'Free Spin Not Available',
          text:
            'Your free spin will be available in ' + this.freeSpinCountdownTime,
          customClass: { popup: 'swal-compact' },
        });
        return;
      }

      // Prepare free spin segments
      this.segments = this.freeSpinSegments.map((s) => ({ ...s }));
      this.wheelGradient = this.buildWheelGradient();
      this.cdr.detectChanges();

      // Start spin animation
      this.isSpinning = true;
      this.rotation = 0;
      this.highlightedIndex = null;
      if (this.highlightTimeout) clearTimeout(this.highlightTimeout);

      this.startSpinAnimation();

      // Call free spin API and then complete the spin immediately
      await this.callFreeSpinAPI();
      this.completeSpinToTarget(this.freeSpinReward);
    } catch (error) {
      this.isSpinning = false;
      document.body.style.pointerEvents = 'auto';
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to process free spin. Please try again.',
        customClass: { popup: 'swal-compact' },
      });
    }
  }
}
