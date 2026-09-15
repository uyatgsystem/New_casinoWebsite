import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Bet, BetType } from '../component/Baccaret/models/bet.model';
import { SpinResult } from '../component/Baccaret/models/spin-result.model';
import { WHEEL_ORDER, getNumberColor, RED_NUMBERS, BLACK_NUMBERS } from '../component/Baccaret/models/wheel-number.model';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../Services/error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // Game state signals
  private balanceSignal = signal<number>(0);
  private currentBetsSignal = signal<Bet[]>([]);
  private spinHistorySignal = signal<SpinResult[]>([]);
  private isSpinningSignal = signal<boolean>(false);
  private upcomingWinningNumberSignal = signal<number | null>(null);
  private selectedChipSignal = signal<number>(1);

  // Computed values
  readonly balance = this.balanceSignal.asReadonly();
  readonly currentBets = this.currentBetsSignal.asReadonly();
  readonly spinHistory = this.spinHistorySignal.asReadonly();
  readonly isSpinning = this.isSpinningSignal.asReadonly();
  readonly upcomingWinningNumber = this.upcomingWinningNumberSignal.asReadonly();
  readonly selectedChip = this.selectedChipSignal.asReadonly();

  readonly totalBetAmount = computed(() => 
    this.currentBetsSignal().reduce((sum, bet) => sum + bet.amount, 0)
  );

  // Floored balance for UI comparisons (no decimals)
  readonly flooredBalance = computed(() => Math.floor(this.balanceSignal()));
  // Whether placing bets is possible given MIN_BET and available balance
  readonly canPlaceBets = computed(() => this.flooredBalance() >= this.MIN_BET);

  readonly canSpin = computed(() => 
    !this.isSpinningSignal() && 
    this.currentBetsSignal().length > 0 && 
    this.totalBetAmount() >= 1
  );

  // Constants
  readonly MIN_BET = 1;
  readonly MAX_BET = 50;
  readonly CHIP_VALUES = [1, 5, 10, 25, 50];

  // RNG seed for deterministic testing (optional)
  private rngSeed: number | null = null;

  constructor(private apiCallService: ApiCallService, private toastr: ToastrService, private errorHandling: ErrorhandlingService) {}

  // Chip selection
  selectChip(value: number): void {
    if (!this.CHIP_VALUES.includes(value)) return;
    if (value > this.MAX_BET) {
      this.toastr.warning(`Maximum chip value is $${this.MAX_BET}`);
      return;
    }
    // Prevent selecting a chip larger than available balance
    if (this.balanceSignal() < value) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      return;
    }
    this.selectedChipSignal.set(value);
  }

  // Place a bet
  placeBet(type: BetType, numbers: number[], label?: string): boolean {
    const chipValue = this.selectedChipSignal();
    const currentTotal = this.totalBetAmount();

    // Validate bet constraints
    if (currentTotal + chipValue > this.MAX_BET) {
      this.toastr.warning('Max bet exceeded');
      return false;
    }

    if (this.balanceSignal() < chipValue) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      return false;
    }

    // Check if bet already exists on these numbers
    const existingBet = this.currentBetsSignal().find(
      bet => this.arraysEqual(bet.numbers, numbers) && bet.type === type
    );

    if (existingBet) {
      // Add to existing bet
      const updatedBets = this.currentBetsSignal().map(bet =>
        bet.id === existingBet.id
          ? { ...bet, amount: bet.amount + chipValue }
          : bet
      );
      this.currentBetsSignal.set(updatedBets);
    } else {
      // Create new bet
      const newBet: Bet = {
        id: this.generateBetId(),
        type,
        numbers,
        amount: chipValue,
        label
      };
      this.currentBetsSignal.update(bets => [...bets, newBet]);
    }

    // Deduct bet amount from balance immediately so header shows updated wallet
    this.balanceSignal.update(bal => bal - chipValue);

    return true;
  }

  // Clear all bets
  clearBets(): void {
    // refund all placed bets back to balance
    const total = this.currentBetsSignal().reduce((sum, b) => sum + b.amount, 0);
    if (total > 0) this.balanceSignal.update(bal => bal + total);
    this.currentBetsSignal.set([]);
  }

  // Remove specific bet
  removeBet(betId: string): void {
    const bet = this.currentBetsSignal().find(b => b.id === betId);
    if (bet) {
      // refund this bet amount
      this.balanceSignal.update(bal => bal + bet.amount);
    }
    this.currentBetsSignal.update(bets => bets.filter(bet => bet.id !== betId));
  }

  // Spin the wheel using backend API
  async spin(): Promise<SpinResult> {
    if (!this.canSpin()) {
      // Provide user feedback for common failure reasons
      if (this.currentBetsSignal().length === 0) {
        this.toastr.error('Place a bet before spinning');
      } else if (this.totalBetAmount() < this.MIN_BET) {
        this.toastr.error(`Total bet must be at least ${this.MIN_BET}`);
      } else {
        this.toastr.error('Cannot spin right now');
      }
      throw new Error('Cannot spin: invalid state');
    }
    this.isSpinningSignal.set(true);
    const totalBet = this.totalBetAmount();
    const bets = this.currentBetsSignal();
    const customerId = localStorage.getItem('customerId');
    // Map bets to API format: one entry per number bet
    const apiPayload = bets.flatMap(bet =>
      bet.numbers.map(num => ({
        betAmount: bet.amount / bet.numbers.length, // split amount if multiple numbers
        numbers: num,
        customerId: customerId ? +customerId : null
      }))
    );


    // Call backend API (use firstValueFrom for Observable->Promise)
    let apiResponse: any;
    try {
      apiResponse = await firstValueFrom(this.apiCallService.PostCallWithToken(apiPayload, 'BACCHRAT/SpinRoulette'));
    } catch (error) {
      // API failed — stop spinning and clear upcoming number. Balance already deducted at bet time,
      // so don't double-refund here. Re-throw so caller can handle UI.
      this.upcomingWinningNumberSignal.set(null);
      this.isSpinningSignal.set(false);
      throw error;
    }

    // Simulate spin delay (9 seconds to match wheel animation)
    // we will set upcoming number before waiting so UI animates
    

    // Parse backend response
    let winningNumber = 0;
    let winningAmount = 0;
    let currentBalance = this.balanceSignal();
    let isWin = false;
    let responseMessage = '';
    if (apiResponse && apiResponse.responseCode === 200 && apiResponse.data) {
      winningNumber = apiResponse.data.winningNumber;
      winningAmount = apiResponse.data.winningAmount;
      currentBalance = apiResponse.data.currentBalance;
      isWin = apiResponse.data.isWin;
      responseMessage = apiResponse.responseMessage;
    }

    const winningColor = getNumberColor(winningNumber);
    // Update balance with backend value
    this.balanceSignal.set(currentBalance);

    // Expose upcoming winning number to UI immediately for wheel animation
    this.upcomingWinningNumberSignal.set(winningNumber);

    // Let the wheel animate (match visual duration)
    await this.delay(9000);

    // Find which bets won (by number)
    const winningBets = bets.filter(bet => bet.numbers.includes(winningNumber));
    const totalPayout = winningAmount;

    const result: SpinResult = {
      number: winningNumber,
      color: winningColor,
      timestamp: new Date(),
      winningBets: winningBets.map(bet => bet.id),
      totalPayout,
      netProfit: totalPayout - totalBet,
      responseMessage, // include backend message when available
      isWin // include backend win flag
    };

    // Add to history
    this.spinHistorySignal.update(history => [result, ...history].slice(0, 10));

    // Clear bets for next round
    this.currentBetsSignal.set([]);

    // Clear the upcoming number and stop spinning
    this.upcomingWinningNumberSignal.set(null);
    this.isSpinningSignal.set(false);

    return result;
  }

  // Calculate payouts for winning bets
  private calculatePayouts(winningNumber: number): { winningBets: Bet[], totalPayout: number } {
    const winningBets: Bet[] = [];
    let totalPayout = 0;

    for (const bet of this.currentBetsSignal()) {
      if (this.isBetWinner(bet, winningNumber)) {
        winningBets.push(bet);
        const payout = this.calculateBetPayout(bet);
        totalPayout += payout;
      }
    }

    return { winningBets, totalPayout };
  }

  // Check if a bet wins
  private isBetWinner(bet: Bet, winningNumber: number): boolean {
    switch (bet.type) {
      case 'straight':
      case 'split':
      case 'street':
      case 'corner':
      case 'line':
        return bet.numbers.includes(winningNumber);

      case 'dozen':
        return bet.numbers.includes(winningNumber);

      case 'column':
        return bet.numbers.includes(winningNumber);

      case 'red':
        return RED_NUMBERS.includes(winningNumber);

      case 'black':
        return BLACK_NUMBERS.includes(winningNumber);

      case 'odd':
        return winningNumber !== 0 && winningNumber % 2 === 1;

      case 'even':
        return winningNumber !== 0 && winningNumber % 2 === 0;

      case 'low':
        return winningNumber >= 1 && winningNumber <= 18;

      case 'high':
        return winningNumber >= 19 && winningNumber <= 36;

      default:
        return false;
    }
  }

  // Calculate payout for a winning bet
  private calculateBetPayout(bet: Bet): number {
    const payoutMultipliers: Record<BetType, number> = {
      straight: 36,    // 35:1 + original bet
      split: 18,       // 17:1 + original bet
      street: 12,      // 11:1 + original bet
      corner: 9,       // 8:1 + original bet
      line: 6,         // 5:1 + original bet
      dozen: 3,        // 2:1 + original bet
      column: 3,       // 2:1 + original bet
      red: 2,          // 1:1 + original bet
      black: 2,        // 1:1 + original bet
      odd: 2,          // 1:1 + original bet
      even: 2,         // 1:1 + original bet
      low: 2,          // 1:1 + original bet
      high: 2          // 1:1 + original bet
    };

    return bet.amount * payoutMultipliers[bet.type];
  }

  // Generate random winning number
  private generateWinningNumber(): number {
    if (this.rngSeed !== null) {
      // Seeded random for testing
      this.rngSeed = (this.rngSeed * 9301 + 49297) % 233280;
      const rnd = this.rngSeed / 233280;
      return WHEEL_ORDER[Math.floor(rnd * WHEEL_ORDER.length)];
    }
    
    // True random
    return WHEEL_ORDER[Math.floor(Math.random() * WHEEL_ORDER.length)];
  }

  // Set RNG seed for deterministic results
  setSeed(seed: number | null): void {
    this.rngSeed = seed;
  }

  // Reset game to initial state
  resetGame(initialBalance: number = 1000): void {
    this.balanceSignal.set(initialBalance);
    this.currentBetsSignal.set([]);
    this.spinHistorySignal.set([]);
    this.isSpinningSignal.set(false);
    this.selectedChipSignal.set(1);
  }

  // Helper methods
  private generateBetId(): string {
    return `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort((x, y) => x - y);
    const sortedB = [...b].sort((x, y) => x - y);
    return sortedA.every((val, idx) => val === sortedB[idx]);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Allow external components to set balance (e.g., initial wallet fetch or API response)
  setBalance(amount: number): void {
    this.balanceSignal.set(amount);
  }

  // Get bet by position on table (for UI)
  getBetAtNumbers(numbers: number[]): Bet | undefined {
    return this.currentBetsSignal().find(bet => 
      this.arraysEqual(bet.numbers, numbers)
    );
  }

  // Get total amount bet on specific numbers
  getTotalOnNumbers(numbers: number[]): number {
    return this.currentBetsSignal()
      .filter(bet => this.arraysEqual(bet.numbers, numbers))
      .reduce((sum, bet) => sum + bet.amount, 0);
  }
}
