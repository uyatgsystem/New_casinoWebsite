import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KenoService, PaytableEntry } from '../../services/keno.service';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';
import { firstValueFrom } from 'rxjs';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';

export type GameStatus = 'idle' | 'drawing' | 'results';

@Component({
  selector: 'app-keno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './keno.component.html',
  styleUrl: './keno.component.scss'
})
export class KenoComponent {
  readonly MAX_BET = 50;
  showResultToast = false;
  resultToastMessage = '';
  isControlPanelCollapsed = false;
  private readonly kenoService = inject(KenoService);
  private readonly apiCallService = inject(ApiCallService);
  private readonly errorHandling = inject(ErrorhandlingService);
  private readonly utilsService = inject(UtilsService);
  readonly boardNumbers = this.kenoService.getBoardNumbers();
  readonly maxSpots = 10;

  selectedNumbers: number[] = [];
  winningNumbers: number[] = [];
  revealedWinningNumbers: number[] = [];
  matchedNumbers: number[] = [];
  gameStatus: GameStatus = 'idle';
  betAmount = 1;
  currentPayout = 0;
  statusMessage = 'SELECT UP TO 10 SPOTS';
  balance = 0;
  isAutoPlaying = false;
  currentAutoRound = 0;
  autoPlayRounds = 0;
  autoPlayTotalPayout = 0;
  customerId: string = '';
  grainBackdrop: SafeHtml = '';

  constructor(private location: Location, private router: Router) { }

  goBack() {
    this.router.navigate(['/dashboard/home']);
  }
  getRoundedBalance(): number {
    return this.balance;
  }


  selectedNumberSet = new Set<number>();
  winningNumberSet = new Set<number>();
  revealedWinningNumberSet = new Set<number>();
  matchedNumberSet = new Set<number>();

  get canPlay(): boolean {
    const normalizedBet = Math.floor(Number(this.betAmount) || 0);
    return (
      this.selectedNumbers.length > 0 &&
      !this.isInteractionLocked &&
      normalizedBet >= 1 &&
      normalizedBet <= this.MAX_BET &&
      normalizedBet <= Math.floor(this.balance)
    );
  }
  get isInteractionLocked(): boolean { return this.gameStatus === 'drawing' || this.isAutoPlaying; }
  get paytableSpotCount(): number { return this.selectedNumbers.length || 10; }
  get paytableEntries(): PaytableEntry[] { return this.kenoService.getPaytableEntries(this.paytableSpotCount); }

  ngOnInit(): void {
    this.customerId = localStorage.getItem('customerId') || '';
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.getWalletBalance();
    this.scrollToTopSmooth();
  }

  WalletPayload() {
    return {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
  }

  getWalletBalance(): void {
    const payload = this.WalletPayload();
    this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.balance = Number(response.data?.totalBalance ?? 0);
          this.utilsService.triggerWalletFunction();
        } else {
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.errorHandling.handleResponseError(error);
      }
    });
  }

  toggleNumber(value: number): void {
    if (this.isInteractionLocked) return;
    this.resetRoundState();
    if (this.selectedNumberSet.has(value)) {
      this.selectedNumbers = this.selectedNumbers.filter(n => n !== value);
    } else if (this.selectedNumbers.length < this.maxSpots) {
      this.selectedNumbers = [...this.selectedNumbers, value].sort((a, b) => a - b);
    }
    this.selectedNumberSet = new Set(this.selectedNumbers);
    this.statusMessage = `${this.selectedNumbers.length} SPOTS ACTIVE`;
  }

  quickPick(): void {
    if (this.isInteractionLocked) return;
    this.resetRoundState();
    this.selectedNumbers = this.kenoService.quickPick(this.maxSpots);
    this.selectedNumberSet = new Set(this.selectedNumbers);
  }

  clearBoard(): void {
    if (this.isInteractionLocked) return;
    this.selectedNumbers = [];
    this.selectedNumberSet.clear();
    this.resetRoundState();
    this.statusMessage = 'SELECT UP TO 10 SPOTS';
  }

  onBetKeyDown(event: KeyboardEvent): void {
    const blocked = ['.', ',', 'e', 'E', '+', '-'];
    if (blocked.includes(event.key)) {
      event.preventDefault();
    }
  }

  async play(): Promise<void> {
    this.normalizeBetAmount();
    if (!this.canPlay) return;
    this.isControlPanelCollapsed = true;
    this.isAutoPlaying = false;
    await this.runRound();
  }

  async startAutoPlay(rounds: number): Promise<void> {
    this.normalizeBetAmount();
    if (!this.canPlay) return;
    this.isAutoPlaying = true;
    this.autoPlayRounds = rounds;
    for (let i = 1; i <= rounds; i++) {
      this.currentAutoRound = i;
      await this.runRound(i, rounds);
      if (i < rounds) await new Promise(r => setTimeout(r, 400));
    }
    this.isAutoPlaying = false;
  }

  private async runRound(current?: number, total?: number): Promise<void> {
    this.normalizeBetAmount();
    if (this.betAmount > this.MAX_BET) {
      this.statusMessage = `MAX BET IS $${this.MAX_BET}`;
      return;
    }
    this.gameStatus = 'drawing';
    const payload = {
      betAmount: this.betAmount,
      customerId: this.customerId,
      playerNumbers: this.selectedNumbers
    };

    try {
      const response = await firstValueFrom(
        this.apiCallService.PostCallWithToken(payload, 'BACCHRAT/Playkino')
      );

      if (!(response && response.responseCode === 200)) {
        this.gameStatus = 'idle';
        this.errorHandling.handleResponseError(response);
        return;
      }

      this.winningNumbers = response.data?.winningNumbers ?? [];
      this.matchedNumbers = response.data?.matches ?? [];
      this.currentPayout = Number(response.data?.rewardAmount ?? 0);
    } catch (error) {
      this.gameStatus = 'idle';
      this.errorHandling.handleResponseError(error);
      return;
    }

    this.winningNumberSet = new Set(this.winningNumbers);
    this.revealedWinningNumbers = [];
    this.revealedWinningNumberSet.clear();
    this.matchedNumberSet.clear();

    for (const num of this.winningNumbers) {
      this.revealedWinningNumbers.push(num);
      this.revealedWinningNumberSet.add(num);
      const revealedMatches = this.matchedNumbers.filter((match) => this.revealedWinningNumberSet.has(match));
      this.matchedNumberSet = new Set(revealedMatches);
      await new Promise(r => setTimeout(r, 80)); // Snappy stagger
    }

    this.matchedNumberSet = new Set(this.matchedNumbers);
    this.gameStatus = 'results';
    this.statusMessage = this.currentPayout > 0 ? `WIN: $${this.currentPayout.toFixed(2)}` : `NO MATCH`;

    // Show result toast
    this.resultToastMessage = this.currentPayout > 0 ? `🎉 WIN: $${this.currentPayout.toFixed(2)}` : 'No Match. Try Again!';
    this.showResultToast = true;
    setTimeout(() => { this.showResultToast = false; }, 2600);

    this.getWalletBalance();
  }

  private resetRoundState() {
    this.gameStatus = 'idle';
    this.winningNumbers = [];
    this.revealedWinningNumbers = [];
    this.matchedNumbers = [];
    this.winningNumberSet.clear();
    this.revealedWinningNumberSet.clear();
    this.matchedNumberSet.clear();
  }

  getTileClasses(value: number) {
    const isSelected = this.selectedNumberSet.has(value);
    const isRevealed = this.revealedWinningNumberSet.has(value);
    const isMatched = isSelected && isRevealed;
    return {
      'tile-selected': isSelected && !isRevealed,
      'tile-drawing': isRevealed && !isSelected,
      'tile-hit': isMatched,
      'tile-miss': this.gameStatus === 'results' && isRevealed && !isSelected
    };
  }

  trackByNumber(index: number, value: number) { return value; }
  isPaytableHit(matchCount: number): boolean {
    return this.gameStatus === 'results' && this.matchedNumbers.length === matchCount;
  }

  onBetAmountChange(value: number | string): void {
    const parsed = Math.floor(Number(value) || 0);
    const maxByBalance = Math.floor(this.balance);
    const maxAllowed = Math.min(this.MAX_BET, maxByBalance > 0 ? maxByBalance : this.MAX_BET);

    if (parsed < 1) {
      this.betAmount = 1;
      return;
    }

    this.betAmount = Math.min(parsed, maxAllowed);
  }

  private normalizeBetAmount(): void {
    this.onBetAmountChange(this.betAmount);
  }



  private scrollToTopSmooth(): void {
    setTimeout(() => {
      try {
        const scrollElement =
          document.scrollingElement ||
          document.documentElement ||
          document.body;

        scrollElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } catch {
        const scrollElement =
          document.scrollingElement ||
          document.documentElement ||
          document.body;

        scrollElement.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    }, 100);
  }
}
