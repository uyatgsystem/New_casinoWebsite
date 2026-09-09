import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaccaratGameService } from '../../../services/baccarat-game.service';
import { DeckService } from '../../../services/deck.service';
import { Hand, GameResult, BetType, GameStats, Card } from '../models/card.model';
import { CardComponent } from '../card/card.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ApiCallService } from '../../../../Services/api-call-service.service';
import { UtilsService } from '../../../../Services/utils.service';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-game-table',
  standalone: true,
  imports: [CommonModule, CardComponent, ToastrModule],
  templateUrl: './game-table.component.html',
  styleUrls: ['./game-table.component.scss'],
  providers: [ApiCallService]
})
export class GameTableComponent implements OnInit {
  readonly MAX_BET = 50;
  grainBackdrop: SafeHtml = '';
  playerHand: Hand = { cards: [], score: 0 };
  bankerHand: Hand = { cards: [], score: 0 };
  gameResult: GameResult | null = null;
  gameStats: GameStats = { playerWins: 0, bankerWins: 0, ties: 0 };
  gameHistory: BetType[] = [];
  isGameInProgress = false;
  gameMessage = '';
  remainingCards = 52;
  balance = 0;
  chipValues = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  selectedChip = 1;
  betAmounts = { player: 0, banker: 0, tie: 0 };
  currentBetAmount = 0;

  constructor(
    private apiCallService: ApiCallService,
    private utilsService: UtilsService,
    private router: Router
    , private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.preloadCardImages();
    this.getWalletBalance();
    this.scrollToTopSmooth();
  }
  goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }
  // --- BETTING LOGIC ---
  selectChip(value: number): void {
    if (this.isGameInProgress) return;
    if (value > this.MAX_BET) {
      this.toastr.error(`Maximum bet is $${this.MAX_BET}!`);
      return;
    }
    if (value > this.balance) {
      this.toastr.error('Insufficient balance!');
      return;
    }
    this.selectedChip = value;
  }
  trackByCardId(index: number, card: Card): string {
    return card.id;
  }
  // placeBetOnArea(betType: BetType): void {
  //   if (this.isGameInProgress) return;
  //   if (this.currentBetAmount + this.selectedChip > this.MAX_BET) {
  //     this.toastr.error(`Maximum total bet is $${this.MAX_BET}!`);
  //     return;
  //   }
  //   if (this.balance < this.selectedChip) {
  //     this.toastr.error('Insufficient balance!');
  //     return;
  //   }
  //   this.betAmounts[betType] += this.selectedChip;
  //   this.balance -= this.selectedChip;
  //   this.updateCurrentBetAmount();
  // }

  placeBetOnArea(betType: BetType): void {
    if (this.isGameInProgress) return;

    const hasOtherBet = (Object.keys(this.betAmounts) as BetType[])
      .some(key => key !== betType && this.betAmounts[key] > 0);

    if (hasOtherBet) {
      this.toastr.error('Only one bet type is allowed!');
      return;
    }

    if (this.currentBetAmount + this.selectedChip > this.MAX_BET) {
      this.toastr.error(`Maximum total bet is $${this.MAX_BET}!`);
      return;
    }

    if (this.balance < this.selectedChip) {
      this.toastr.error('Insufficient balance!');
      return;
    }
    this.betAmounts[betType] += this.selectedChip;
    this.balance -= this.selectedChip;

    this.updateCurrentBetAmount();
  }
  updateCurrentBetAmount(): void {
    this.currentBetAmount = this.betAmounts.player + this.betAmounts.banker + this.betAmounts.tie;
  }

  clearAllBets(): void {
    if (this.isGameInProgress) return;
    this.balance += this.currentBetAmount;
    this.betAmounts = { player: 0, banker: 0, tie: 0 };
    this.currentBetAmount = 0;
  }

  // --- DEAL CARDS & API INTEGRATION ---
  async dealCards(): Promise<void> {
    if (this.currentBetAmount === 0 || this.isGameInProgress) return;
    if (this.currentBetAmount > this.MAX_BET) {
      this.toastr.error(`Maximum total bet is $${this.MAX_BET}!`);
      return;
    }
    this.isGameInProgress = true;
    this.gameResult = null;
    this.gameMessage = 'Dealing...';
    ;
    // Prepare bets array for API
    const bets = [];
    if (this.betAmounts.player > 0) bets.push({ betType: 'Player', betAmount: this.betAmounts.player });
    if (this.betAmounts.banker > 0) bets.push({ betType: 'Banker', betAmount: this.betAmounts.banker });
    if (this.betAmounts.tie > 0) bets.push({ betType: 'Tie', betAmount: this.betAmounts.tie });

    const customerID = Number(this.utilsService.getItem('customerId'));
    const payload = { customerID, bets };

    this.apiCallService.PostCallWithToken(payload, 'BACCHRAT/PlayBACCHRATBets').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          const data = response.data;
          // Map numeric cards to Card objects for display
          this.playerHand.cards = data.playerCards.map((num: number) => this.mapNumberToCard(num));
          this.playerHand.score = this.getBaccaratScore(data.playerTotal);
          this.bankerHand.cards = data.bankerCards.map((num: number) => this.mapNumberToCard(num));
          this.bankerHand.score = this.getBaccaratScore(data.bankerTotal);

          // Winner, payouts, balance
          this.gameResult = {
            winner: data.winner?.toLowerCase(),
            playerScore: this.playerHand.score,
            bankerScore: this.bankerHand.score,
            playerHand: this.playerHand.cards,
            bankerHand: this.bankerHand.cards
          };
          this.balance = data.finalBalance;
          setTimeout(() => {
            this.gameMessage = `Winner: ${data.winner}. ${this.getResultMessage(data.bets)}`;

          }, 3000);
        } else {
          this.gameMessage = response.errorMessage || 'Error dealing cards.';
        }
        this.isGameInProgress = false;
      },
      error: () => {
        this.gameMessage = 'API error. Please try again.';
        this.isGameInProgress = false;
      }
    });
  }

  private suitCounter = 0;



  mapNumberToCard(num: number): Card {
    // num: 1-13 (1=Ace, 13=King)
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const suitNames: { [key: string]: 'H' | 'D' | 'C' | 'S' } = {
      hearts: 'H',
      diamonds: 'D',
      clubs: 'C',
      spades: 'S'
    };
    const ranks = [
      { short: 'A', long: 'ace' },
      { short: '2', long: '2' },
      { short: '3', long: '3' },
      { short: '4', long: '4' },
      { short: '5', long: '5' },
      { short: '6', long: '6' },
      { short: '7', long: '7' },
      { short: '8', long: '8' },
      { short: '9', long: '9' },
      { short: '10', long: '10' },
      { short: 'J', long: 'jack' },
      { short: 'Q', long: 'queen' },
      { short: 'K', long: 'king' }
    ];
    const rankIndex = num - 1;

    // Cycle through suits for each card dealt
    const suitIndex = this.suitCounter % 4;
    const suit = suits[suitIndex];
    const suitShort = suitNames[suit];
    this.suitCounter++;

    const rank = ranks[rankIndex];

    return {
      id: `${rank.short}${suitShort}`,
      suit: suitShort,
      rank: rank.short,
      value: rankIndex === 0 ? 1 : rankIndex > 9 ? 0 : rankIndex + 1,
      imagePath: `/DeckCards/${rank.long}_of_${suit}.png`,
      isRevealed: true
    };
  }
  getBaccaratScore(total: number): number {
    return total % 10;
  }

  getResultMessage(bets: any[]): string {
    ;
    const winBets = bets.filter((b: any) => b.result === 'Win');
    if (winBets.length > 0) {
      return `You won $${winBets.reduce((sum: number, b: any) => sum + b.payout, 0)}`;
    }
    return 'You lost';
  }

  resetRound(): void {
    this.gameResult = null;
    this.gameMessage = '';
    this.betAmounts = { player: 0, banker: 0, tie: 0 };
    this.currentBetAmount = 0;
    this.playerHand = { cards: [], score: 0 };
    this.bankerHand = { cards: [], score: 0 };
  }

  // --- WALLET ---
  getWalletBalance(): void {
    const payload = {
      customerId: this.utilsService.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: ''
    };
    this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.balance = parseFloat(response.data.totalBalance || '0');
          this.utilsService.triggerWalletFunction();
        }
      }
    });
  }
  preloadCardImages(): void {
    const suits: Array<'S' | 'H' | 'C' | 'D'> = ['S', 'H', 'C', 'D'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    for (const suit of suits) {
      for (const rank of ranks) {
        const img = new Image();
        img.src = `/DeckCards/${rank}${suit}.png`;
      }
    }
  }

  // --- CHIP CONTROLS ---
  increaseChip(): void {
    if (this.isGameInProgress) return;
    const currentIndex = this.chipValues.indexOf(this.selectedChip);
    if (currentIndex < this.chipValues.length - 1) {
      const next = this.chipValues[currentIndex + 1];
      if (next > this.balance) {
        this.toastr.error('Insufficient balance!');
        return;
      }
      this.selectedChip = next;
    }
  }

  decreaseChip(): void {
    if (this.isGameInProgress) return;
    const currentIndex = this.chipValues.indexOf(this.selectedChip);
    if (currentIndex > 0) {
      this.selectedChip = this.chipValues[currentIndex - 1];
    }
  }

  getChipColor(value: number): string {
    const colors: { [key: number]: string } = {
      1: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      2: 'linear-gradient(135deg, #34d399, #10b981)',
      3: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
      4: 'linear-gradient(135deg, #f472b6, #ec4899)',
      5: 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
      10: 'linear-gradient(135deg, #2563eb, #1e40af)',
      15: 'linear-gradient(135deg, #dc2626, #991b1b)',
      20: 'linear-gradient(135deg, #10b981, #059669)',
      25: 'linear-gradient(135deg, #ea580c, #c2410c)',
      30: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
      35: 'linear-gradient(135deg, #0891b2, #0e7490)',
      40: 'linear-gradient(135deg, #be185d, #9d174d)',
      45: 'linear-gradient(135deg, #4338ca, #3730a3)',
      50: 'linear-gradient(135deg, #1f2937, #111827)',
      55: 'linear-gradient(135deg, #92400e, #78350f)',
      60: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
      65: 'linear-gradient(135deg, #166534, #14532d)',
      70: 'linear-gradient(135deg, #1e3a8a, #1e40af)',
      75: 'linear-gradient(135deg, #581c87, #4c1d95)',
      80: 'linear-gradient(135deg, #0f766e, #134e4a)',
      85: 'linear-gradient(135deg, #713f12, #451a03)',
      90: 'linear-gradient(135deg, #374151, #1f2937)',
      95: 'linear-gradient(135deg, #7c2d12, #431407)',
      100: 'linear-gradient(135deg, #000000, #1f2937)'
    };
    return colors[value] || 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
  getRoundedBalance(): number {
    return this.balance;
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
