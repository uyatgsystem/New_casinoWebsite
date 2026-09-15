import { Injectable, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../Services/error-handling.service';

export interface PlinkoSlot {
  multiplier: number;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlinkoService {
  readonly MAX_BET = 50;
  // Game State
  readonly balance = signal<number>(0);
  readonly currentBet = signal<number>(10);
  readonly isGameRunning = signal<boolean>(false);

  // Configuration
  readonly rows = 12; // Number of rows of pegs

  readonly multipliers: number[] = [10, 5, 2, 1, 0, 0, 0, 0, 0, 1, 2, 5, 10];

  constructor(private toastr: ToastrService, private errorHandling: ErrorhandlingService) { }

  updateBet(amount: number) {
    if (this.isGameRunning()) return;
    // Bets must be whole numbers — coerce to integer
    amount = Math.floor(Number(amount) || 0);
    if (amount < 1) amount = 1;
    const maxBet = Math.min(this.MAX_BET, Math.floor(this.balance()));
    // If user has no available balance, keep UI bet at 1 but block play
    if (maxBet < 1) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      this.currentBet.set(1);
      return;
    }
    if (amount > this.MAX_BET) {
      this.toastr.warning(`Maximum bet is $${this.MAX_BET}!`);
      amount = this.MAX_BET;
    }
    if (amount > maxBet) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      amount = maxBet;
    }
    this.currentBet.set(amount);
  }

  incrementBet(val: number) {
    this.updateBet(this.currentBet() + val);
  }

  decrementBet(val: number) {
    const newAmount = this.currentBet() - val;
    // Ensure we don't go below 1, but allow 1 as minimum
    this.updateBet(Math.max(1, newAmount));
  }

  halveBet() {
    this.updateBet(Math.max(1, Math.floor(this.currentBet() / 2)));
  }

  doubleBet() {
    this.updateBet(this.currentBet() * 2);
  }

  maxBet() {
    this.updateBet(this.MAX_BET);
  }

  startGame(): boolean {
    const available = Math.floor(this.balance());
    if (this.currentBet() > this.MAX_BET) {
      this.toastr.warning(`Maximum bet is $${this.MAX_BET}!`);
      this.updateBet(this.MAX_BET);
      return false;
    }
    if (available < this.currentBet()) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      return false;
    }
    this.balance.update(b => b - this.currentBet());
    this.isGameRunning.set(true);
    return true;
  }

  endGame(winAmount: number) {
    this.balance.update(b => b + winAmount);
    this.isGameRunning.set(false);
    return winAmount;
  }

  // Calculate the path of the ball
  // Returns an array of directions: -0.5 (left) or +0.5 (right) for x-axis shift per row
  calculatePath(startSlotIndex: number): { path: number[], finalSlot: number } {
    const path: number[] = [];
    let currentPosition = 0; // Relative to center or start?
    // Let's say the board is a grid.
    // We simulate the drop.

    // For a simple visual plinko, the ball hits a peg and goes Left or Right.
    // We need 'rows' number of decisions.
    let rightMoves = 0;

    for (let i = 0; i < this.rows; i++) {
      const dir = Math.random() > 0.5 ? 1 : 0; // 0 for Left, 1 for Right
      path.push(dir === 0 ? -1 : 1); // Visual direction
      rightMoves += dir;
    }

    // The final slot index depends on how many times it went right.
    // If we start at the "center" conceptually, the distribution lands in the bins.
    // However, the UI usually has drop zones.
    // If the user drops from a specific zone, does it affect the outcome?
    // In real Plinko, yes. In this game, usually the drop is centered or the board is wide.
    // Let's assume the drop is always centered relative to the pyramid for the "Game" logic,
    // or we map the result to the bins.

    // With 12 rows, we have 13 bins (0 to 12).
    // rightMoves will be between 0 and 12.
    const finalSlot = rightMoves;

    console.log('Path:', path);

    return { path, finalSlot };
  }
}
