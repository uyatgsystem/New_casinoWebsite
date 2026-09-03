import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';

export type CoinSide = 'heads' | 'tails';
type ApiCoinSide = 'heads' | 'tails';

export interface FlipRoll {
  side: CoinSide;
}

function toApiSide(side: CoinSide): ApiCoinSide {
  return side === 'heads' ? 'heads' : 'tails';
}

function fromApiSide(side: ApiCoinSide | string): CoinSide {
  return side === 'heads' ? 'heads' : 'tails';
}

const FLIP_DURATION_MS = 2200; 
const HEADS_ROTATION = 2160; 
const TAILS_ROTATION = 2340; 
const COUNTDOWN_DURATION = 7.0;
const RESULT_PHASE_DURATION = 3500;

@Component({
  selector: 'app-coin-flip',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coin.component.html',
  styleUrls: ['./coin.component.scss'],
})
export class CoinFlipComponent implements OnInit, OnDestroy {
  private api        = inject(ApiCallService);
  private err        = inject(ErrorhandlingService);
  private loc        = inject(Location);
  private platformId = inject(PLATFORM_ID);
  private utils      = inject(UtilsService);

  @ViewChild('coinRef') coinRef?: ElementRef<HTMLElement>;

  // ── State ──────────────────────────────────────────────────────────────────
  balance                = 0;
  betAmount              = 1;
  selectedSide: CoinSide = 'heads';
  isFlipping             = false;
  isWaiting              = false;
  resultMessage          = 'Place your bet!';
  resultType: 'win' | 'lose' | 'neutral' = 'neutral';
  rolls: FlipRoll[]      = [];
  customerId             = 0;
  showInsufficientBanner = false;

  coinRotation = 0;

  flashWin  = false;
  flashLose = false;

  readonly presets = [1, 5, 10, 15, 20];

  roundPhase: 'betting' | 'flipping' | 'result' = 'betting';
  countdown  = COUNTDOWN_DURATION;
  betLocked  = false;

  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private pendingResult: { side: CoinSide; winAmount: number; currentBalance: number } | null = null;
  private pendingSide: CoinSide | null = null;
  private animationEndListener: (() => void) | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.customerId = Number(localStorage.getItem('customerId'));
    }
    this.loadBalance();
    this.startBettingPhase();
  }

  ngOnDestroy() {
    this.stopCountdown();
    this.removeAnimationListener();
    if (this.fallbackTimer) clearTimeout(this.fallbackTimer);
    this.utils.triggerWalletFunction();
  }

  // ── Round Management ───────────────────────────────────────────────────────

  private startBettingPhase() {
    this.roundPhase    = 'betting';
    this.countdown     = COUNTDOWN_DURATION;
    this.betLocked     = false;
    this.pendingSide   = null;
    this.pendingResult = null;
    this.resultType    = 'neutral';
    this.resultMessage = `Rolling In ${this.countdown.toFixed(1)}s`;
    this.isFlipping    = false;
    this.flashWin      = false;
    this.flashLose     = false;
    this.coinRotation  = 0;

    this.startCountdown();
  }

  private startCountdown() {
    this.stopCountdown();
    this.countdownInterval = setInterval(() => {
      this.countdown = Math.max(0, parseFloat((this.countdown - 0.1).toFixed(1)));
      this.resultMessage = `Rolling In ${this.countdown.toFixed(1)}s`;
      if (this.countdown <= 0) {
        this.stopCountdown();
        this.triggerFlip();
      }
    }, 100);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private resumeCountdown() {
    if (this.countdownInterval) return;
    if (this.roundPhase !== 'betting') return;
    this.startCountdown();
  }

  private triggerFlip() {
    this.roundPhase    = 'flipping';
    this.resultType    = 'neutral';
    this.resultMessage = 'Flipping...';
    this.stopCountdown();

    const landingSide: CoinSide = this.pendingSide ?? this.getRandomSide();
    this.runCoinAnimation(landingSide);
  }

  private getRandomSide(): CoinSide {
    return Math.random() < 0.5 ? 'heads' : 'tails';
  }

  // ── Coin Animation ─────────────────────────────────────────────────────────

  private runCoinAnimation(landingSide: CoinSide) {
    this.removeAnimationListener();
    if (this.fallbackTimer) clearTimeout(this.fallbackTimer);

    const finalRotation = landingSide === 'heads' ? HEADS_ROTATION : TAILS_ROTATION;
    this.coinRotation = finalRotation;

    if (!isPlatformBrowser(this.platformId)) {
      this.isFlipping = true;
      setTimeout(() => this.onAnimationComplete(landingSide), FLIP_DURATION_MS);
      return;
    }

    this.isFlipping = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.isFlipping = true;

        const el = this.coinRef?.nativeElement ?? null;
        if (el) {
          this.animationEndListener = () => this.onAnimationComplete(landingSide);
          el.addEventListener('animationend', this.animationEndListener, { once: true });
        }

        this.fallbackTimer = setTimeout(() => {
          if (this.isFlipping) this.onAnimationComplete(landingSide);
        }, FLIP_DURATION_MS + 400);
      });
    });
  }

  private onAnimationComplete(landingSide: CoinSide) {
    this.removeAnimationListener();
    if (this.fallbackTimer) {
      clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    this.isFlipping = false;
    this.finalize(landingSide);
  }

  private removeAnimationListener() {
    if (this.animationEndListener && isPlatformBrowser(this.platformId)) {
      const el = this.coinRef?.nativeElement;
      if (el) {
        el.removeEventListener('animationend', this.animationEndListener);
      }
      this.animationEndListener = null;
    }
  }

  // ── Finalize Round ─────────────────────────────────────────────────────────

  private finalize(landingSide: CoinSide) {
    this.rolls.unshift({ side: landingSide });
    if (this.rolls.length > 30) this.rolls.pop();

    const sideLabel = landingSide === 'heads' ? 'Heads' : 'Tails';

    if (this.betLocked && this.pendingResult) {
      const { winAmount } = this.pendingResult;
      if (winAmount > 0) {
        this.resultType    = 'win';
        this.resultMessage = `${sideLabel}! You Won $${winAmount.toFixed(2)}!`;
      } else {
        this.resultType    = 'lose';
        this.resultMessage = `${sideLabel}! Better Luck Next Time`;
      }
    } else if (this.betLocked) {
      const won          = landingSide === this.selectedSide;
      this.resultType    = won ? 'win' : 'lose';
      this.resultMessage = won
        ? `${sideLabel}! You Won $${(this.betAmount * 2).toFixed(2)}!`
        : `${sideLabel}! Better Luck Next Time`;
    } else {
      this.resultType    = 'neutral';
      this.resultMessage = `${sideLabel}!`;
    }

    this.roundPhase = 'result';

    this.flashWin  = false;
    this.flashLose = false;
    if (this.resultType === 'win') {
      this.flashWin = true;
      setTimeout(() => (this.flashWin = false), 800);
    } else if (this.resultType === 'lose') {
      this.flashLose = true;
      setTimeout(() => (this.flashLose = false), 800);
    }

    this.pendingResult = null;
    this.isWaiting     = false;

    setTimeout(() => {
      this.utils.triggerWalletFunction();
      this.loadBalance();
      this.startBettingPhase();
    }, RESULT_PHASE_DURATION);
  }

  // ── Bet Placement ──────────────────────────────────────────────────────────

  placeBet() {
    if (this.isBetDisabled()) return;
    if (!this.validateBetAmount()) return;

    const isDemo = this.betAmount === 0;

    if (!isDemo && this.betAmount > this.balance) {
      this.err.showAlert('error', 'Insufficient balance');
      return;
    }

    this.betLocked = true;
    this.stopCountdown();

    if (isDemo) {
      this.pendingSide = this.getRandomSide();
      this.resultMessage = `Bet Placed! Rolling In ${this.countdown.toFixed(1)}s`;
      return;
    }

    this.isWaiting = true;
    this.resultMessage = 'Confirming...';

    const payload = {
      customerId:   this.customerId,
      betAmount:    Math.floor(this.betAmount * 100) / 100,
      selectedSide: toApiSide(this.selectedSide),
    };

    this.api
      .PostCallWithToken(payload, 'BACCHRAT/Coin/PlaceBet')
      .subscribe({
        next: (r) => {
          if (r.responseCode === 200) {
            const resultSide   = fromApiSide(r.data.result);
            this.pendingSide   = resultSide;
            this.pendingResult = {
              side:           resultSide,
              winAmount:      r.data.winAmount ?? 0,
              currentBalance: r.data.currentBalance ?? this.balance,
            };
            this.isWaiting     = false;
            this.resultMessage = `Bet Placed! Rolling In ${this.countdown.toFixed(1)}s`;
            this.resumeCountdown();
          } else {
            this.handleBetError();
            this.err.handleResponseError(r);
          }
        },
        error: (e) => {
          this.handleBetError();
          const msg = e?.message ?? '';
          if (typeof msg === 'string' && msg.toLowerCase().includes('insufficient')) {
            this.showInsufficientBanner = true;
            setTimeout(() => (this.showInsufficientBanner = false), 6000);
          } else {
            this.api.handleError(e);
          }
        },
      });
  }

  private handleBetError() {
    this.betLocked     = false;
    this.pendingSide   = null;
    this.isWaiting     = false;
    this.resultMessage = `Rolling In ${this.countdown.toFixed(1)}s`;
    this.resumeCountdown();
  }

  private validateBetAmount(): boolean {
    const amount = Number(this.betAmount);
    if (isNaN(amount) || amount < 0) {
      this.err.showAlert('error', 'Invalid bet amount');
      return false;
    }
    return true;
  }

  // ── Bet Helpers (Fixed Arithmetic) ───────────────────────────────────────

  setMinus() {
    const current = Number(this.betAmount) || 0;
    this.betAmount = Math.max(0, current - 1);
  }

  setPlus() {
    const current = Number(this.betAmount) || 0;
    const maxBalance = Math.floor(this.balance || 0);
    const increased = current + 1;
    this.betAmount = maxBalance > 0 ? Math.min(maxBalance, increased) : increased;
  }

  setPreset(v: number) {
    const current = Number(this.betAmount) || 0;
    const valueToAdd = Number(v) || 0;
    const maxBalance = Math.floor(this.balance || 0);
    const newValue = current + valueToAdd;
    this.betAmount = maxBalance > 0 ? Math.min(maxBalance, newValue) : newValue;
  }

  selectSide(s: CoinSide) {
    if (!this.isBetDisabled()) {
      this.selectedSide = s;
    }
  }

  // ── Wallet ─────────────────────────────────────────────────────────────────

  private loadBalance() {
    const p = {
      customerId: this.customerId,
      pageNumber: 1,
      pageSize:   10,
      searchText: '',
      startDate:  '',
      endDate:    '',
    };
    this.api.PostCallWithToken(p, 'Wallet/GetWalletBalance').subscribe({
      next: (r) => {
        if (r.responseCode === 200) {
          this.balance = r.data.totalBalance ?? 0;
          this.utils.triggerWalletFunction();
        }
      },
      error: (e) => this.api.handleError(e),
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goBack() {
    this.stopCountdown();
    this.loadBalance();
    try {
      if (isPlatformBrowser(this.platformId) && window.history?.length > 1) {
        this.loc.back();
      } else {
        if (isPlatformBrowser(this.platformId)) {
          window.location.href = '/dashboard/home';
        }
      }
    } catch {
      if (isPlatformBrowser(this.platformId)) {
        window.location.href = '/dashboard/home';
      }
    }
  }

  // ── Template Helpers ───────────────────────────────────────────────────────

  get floorBalance(): string {
    return (Math.floor(this.balance * 100) / 100).toFixed(2);
  }

  get winAmount(): number {
    return this.pendingResult?.winAmount ?? 0;
  }

  getBetButtonLabel(): string {
    if (this.isWaiting)                 return 'Confirming...';
    if (this.betLocked)                 return 'Bet Placed ✓';
    if (this.roundPhase === 'flipping') return 'Flipping...';
    if (this.roundPhase === 'result')   return 'Next Round...';
    return 'Flip Coin';
  }

  isBetDisabled(): boolean {
    return (
      this.isFlipping ||
      this.isWaiting  ||
      this.betLocked  ||
      this.roundPhase !== 'betting'
    );
  }

  get countdownFraction(): number {
    return this.countdown / COUNTDOWN_DURATION;
  }
}