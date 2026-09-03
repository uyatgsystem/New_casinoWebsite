import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../services/game.service';
import { BetType } from '../../Baccaret/models/bet.model';
import { getNumberColor } from '../../Baccaret/models/wheel-number.model';

interface TableNumber {
  number: number;
  color: 'red' | 'black' | 'green';
}

@Component({
  selector: 'app-roulette-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roulette-table.component.html',
  styleUrls: ['./roulette-table.component.scss']
})
export class RouletteTableComponent {
  gameService = inject(GameService);

  @Input() highlightNumber: number | null = null;

  @Output() betPlaced = new EventEmitter<void>();

  // Generate table numbers (1-36 in roulette table layout)
  tableNumbers: TableNumber[] = [];

  // Table layout: 3 rows x 12 columns
  rows: TableNumber[][] = [];

  lastWinningNumber: number | null = null;

  constructor() {
    // Generate numbers 1-36 with colors
    for (let i = 1; i <= 36; i++) {
      this.tableNumbers.push({
        number: i,
        color: getNumberColor(i)
      });
    }

    // Organize into rows (roulette table layout: 3-36, 2-35, 1-34 reading top to bottom, left to right)
    this.rows = [
      this.getRow(3), // Top row: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
      this.getRow(2), // Middle row: 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
      this.getRow(1)  // Bottom row: 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
    ];
  }

  private getRow(start: number): TableNumber[] {
    const row: TableNumber[] = [];
    for (let i = start; i <= 36; i += 3) {
      row.push({
        number: i,
        color: getNumberColor(i)
      });
    }
    return row;
  }

  // Bet on single number
  betOnNumber(num: number): void {
    if (this.gameService.isSpinning()) return;
    const ok = this.gameService.placeBet('straight', [num], `${num}`);
    if (ok) this.betPlaced.emit();
  }

  // Bet on zero
  betOnZero(): void {
    if (this.gameService.isSpinning()) return;
    const ok = this.gameService.placeBet('straight', [0], '0');
    if (ok) this.betPlaced.emit();
  }

  // Outside bets
  betOnDozen(dozen: number): void {
    if (this.gameService.isSpinning()) return;
    const numbers = dozen === 1 
      ? Array.from({length: 12}, (_, i) => i + 1)
      : dozen === 2 
        ? Array.from({length: 12}, (_, i) => i + 13)
        : Array.from({length: 12}, (_, i) => i + 25);
    const ok = this.gameService.placeBet('dozen', numbers, `${dozen}st 12`);
    if (ok) this.betPlaced.emit();
  }

  betOnColumn(col: number): void {
    if (this.gameService.isSpinning()) return;
    const numbers: number[] = [];
    for (let i = col; i <= 36; i += 3) {
      numbers.push(i);
    }
    const ok = this.gameService.placeBet('column', numbers, `Col ${col}`);
    if (ok) this.betPlaced.emit();
  }

  betOnRed(): void {
    if (this.gameService.isSpinning()) return;
    const redNumbers = this.tableNumbers.filter(n => n.color === 'red').map(n => n.number);
    const ok = this.gameService.placeBet('red', redNumbers, 'RED');
    if (ok) this.betPlaced.emit();
  }

  betOnBlack(): void {
    if (this.gameService.isSpinning()) return;
    const blackNumbers = this.tableNumbers.filter(n => n.color === 'black').map(n => n.number);
    const ok = this.gameService.placeBet('black', blackNumbers, 'BLACK');
    if (ok) this.betPlaced.emit();
  }

  betOnOdd(): void {
    if (this.gameService.isSpinning()) return;
    const oddNumbers = this.tableNumbers.filter(n => n.number % 2 === 1).map(n => n.number);
    const ok = this.gameService.placeBet('odd', oddNumbers, 'ODD');
    if (ok) this.betPlaced.emit();
  }

  betOnEven(): void {
    if (this.gameService.isSpinning()) return;
    const evenNumbers = this.tableNumbers.filter(n => n.number % 2 === 0).map(n => n.number);
    const ok = this.gameService.placeBet('even', evenNumbers, 'EVEN');
    if (ok) this.betPlaced.emit();
  }

  betOnLow(): void {
    if (this.gameService.isSpinning()) return;
    const lowNumbers = Array.from({length: 18}, (_, i) => i + 1);
    const ok = this.gameService.placeBet('low', lowNumbers, '1-18');
    if (ok) this.betPlaced.emit();
  }

  betOnHigh(): void {
    if (this.gameService.isSpinning()) return;
    const highNumbers = Array.from({length: 18}, (_, i) => i + 19);
    const ok = this.gameService.placeBet('high', highNumbers, '19-36');
    if (ok) this.betPlaced.emit();
  }

  // Helper to get numbers for a given dozen (1,2,3)
  getDozenNumbers(dozen: number): number[] {
    if (dozen === 1) return Array.from({ length: 12 }, (_, i) => i + 1);
    if (dozen === 2) return Array.from({ length: 12 }, (_, i) => i + 13);
    return Array.from({ length: 12 }, (_, i) => i + 25);
  }

  hasDozenBet(dozen: number): boolean {
    const nums = this.getDozenNumbers(dozen);
    return !!this.gameService.getBetAtNumbers(nums);
  }

  getDozenBetAmount(dozen: number): number {
    const nums = this.getDozenNumbers(dozen);
    return this.gameService.getTotalOnNumbers(nums);
  }

  // Check if number has active bets
  hasActiveBet(num: number): boolean {
    return this.gameService.currentBets().some(bet => bet.numbers.includes(num));
  }

  // Get total bet amount on a number
  getBetAmount(num: number): number {
    return this.gameService.currentBets()
      .filter(bet => bet.numbers.includes(num) && bet.type === 'straight')
      .reduce((sum, bet) => sum + bet.amount, 0);
  }

  // Check if number is the last winning number
  isWinningNumber(num: number): boolean {
    // Prefer explicit highlight (from wheel) while animating
    if (this.highlightNumber !== null) {
      return this.highlightNumber === num;
    }
    const history = this.gameService.spinHistory();
    return history.length > 0 && history[0].number === num;
  }

  // Get bet amount on outside bet
  getOutsideBetAmount(type: BetType): number {
    return this.gameService.currentBets()
      .filter(bet => bet.type === type)
      .reduce((sum, bet) => sum + bet.amount, 0);
  }

  hasOutsideBet(type: BetType): boolean {
    return this.gameService.currentBets().some(bet => bet.type === type);
  }
}
