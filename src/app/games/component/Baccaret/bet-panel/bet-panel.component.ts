import { Component, Output, EventEmitter, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { BetType } from '../models/card.model';

@Component({
  selector: 'app-bet-panel',
  standalone: true,
  imports: [CommonModule, ToastrModule],
  templateUrl: './bet-panel.component.html',
  styles: [`
    .chip {
      transition: all 0.2s ease;
    }

    .chip:active {
      transform: scale(0.95);
    }

    .bet-button:active {
      transform: scale(0.95);
    }
  `]
})
export class BetPanelComponent {
  readonly MAX_BET = 50;
  @Input() isGameInProgress: boolean = false;
  @Input() balance: number = 0;
  @Output() betPlaced = new EventEmitter<{ betType: BetType; amount: number }>();

  chipValues = [10, 25, 50];
  selectedChip = 10;
  currentBet = 0;
  selectedBetType: BetType | null = null;

  constructor(private toastr: ToastrService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['balance']) {
      const bal = Number(changes['balance'].currentValue) || 0;
      const valid = this.chipValues.filter(v => v <= bal);
      if (valid.length > 0) {
        // choose largest chip not exceeding balance
        this.selectedChip = valid[valid.length - 1];
      }
    }
  }

  selectChip(value: number): void {
    if (this.isGameInProgress) return;
    if (value > this.balance) {
      this.toastr.error('Insufficient balance!');
      return;
    }
    this.selectedChip = value;
  }

  placeBet(betType: BetType): void {
    if (this.isGameInProgress) return;
    if (this.currentBet + this.selectedChip > this.MAX_BET) {
      this.toastr.error(`Maximum total bet is $${this.MAX_BET}!`);
      return;
    }
    if (this.currentBet + this.selectedChip > this.balance) {
      this.toastr.error('Insufficient balance!');
      return;
    }

    this.selectedBetType = betType;
    this.currentBet += this.selectedChip;
  }

  clearBet(): void {
    this.currentBet = 0;
    this.selectedBetType = null;
  }

  confirmBet(): void {
    if (this.currentBet > this.MAX_BET) {
      this.toastr.error(`Maximum total bet is $${this.MAX_BET}!`);
      return;
    }
    if (this.selectedBetType && this.currentBet > 0) {
      this.betPlaced.emit({ betType: this.selectedBetType, amount: this.currentBet });
    }
  }

  getChipColorClass(value: number): string {
    switch (value) {
      case 10: return 'bg-gradient-to-br from-red-500 to-red-700';
      case 25: return 'bg-gradient-to-br from-green-500 to-green-700';
      case 50: return 'bg-gradient-to-br from-blue-500 to-blue-700';
      default: return 'bg-gray-500';
    }
  }

  reset(): void {
    this.clearBet();
  }
}