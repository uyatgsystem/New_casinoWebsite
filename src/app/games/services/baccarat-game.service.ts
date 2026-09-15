import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DeckService } from './deck.service';
import { Card, Hand, GameResult, BetType, GameStats } from '../component/Baccaret/models/card.model';

@Injectable({
  providedIn: 'root'
})
export class BaccaratGameService {
  private playerHand: Hand = { cards: [], score: 0 };
  private bankerHand: Hand = { cards: [], score: 0 };
  
  private playerHandSubject = new BehaviorSubject<Hand>(this.playerHand);
  private bankerHandSubject = new BehaviorSubject<Hand>(this.bankerHand);
  private gameResultSubject = new BehaviorSubject<GameResult | null>(null);
  private gameStatsSubject = new BehaviorSubject<GameStats>({ playerWins: 0, bankerWins: 0, ties: 0 });

  public playerHand$ = this.playerHandSubject.asObservable();
  public bankerHand$ = this.bankerHandSubject.asObservable();
  public gameResult$ = this.gameResultSubject.asObservable();
  public gameStats$ = this.gameStatsSubject.asObservable();

  constructor(private deckService: DeckService) {
    this.deckService.shuffleDeck();
  }

  private calculateScore(cards: Card[]): number {
    const total = cards.reduce((sum, card) => sum + card.value, 0);
    return total % 10;
  }

  async startNewRound(): Promise<void> {
    if (this.deckService.needsReshuffle()) {
      this.deckService.shuffleDeck();
    }

    this.playerHand = { cards: [], score: 0 };
    this.bankerHand = { cards: [], score: 0 };
    this.gameResultSubject.next(null);

    await this.dealInitialCards();
  }

  private async dealInitialCards(): Promise<void> {
    // Deal 2 cards to player (face down initially)
    const playerCard1 = this.deckService.dealCard()!;
    playerCard1.isRevealed = false;
    this.playerHand.cards.push(playerCard1);
    this.playerHandSubject.next({ ...this.playerHand });
    await this.delay(400);

    // Deal 2 cards to banker (face down initially)
    const bankerCard1 = this.deckService.dealCard()!;
    bankerCard1.isRevealed = false;
    this.bankerHand.cards.push(bankerCard1);
    this.bankerHandSubject.next({ ...this.bankerHand });
    await this.delay(400);

    const playerCard2 = this.deckService.dealCard()!;
    playerCard2.isRevealed = false;
    this.playerHand.cards.push(playerCard2);
    this.playerHandSubject.next({ ...this.playerHand });
    await this.delay(400);

    const bankerCard2 = this.deckService.dealCard()!;
    bankerCard2.isRevealed = false;
    this.bankerHand.cards.push(bankerCard2);
    this.bankerHandSubject.next({ ...this.bankerHand });
    await this.delay(600);

    // Now reveal cards one by one
    await this.revealCards();
  }

  private async revealCards(): Promise<void> {
    // Reveal player's first card
    if (this.playerHand.cards[0]) {
      this.playerHand.cards[0].isRevealed = true;
      this.playerHandSubject.next({ ...this.playerHand });
      await this.delay(500);
    }

    // Reveal banker's first card
    if (this.bankerHand.cards[0]) {
      this.bankerHand.cards[0].isRevealed = true;
      this.bankerHandSubject.next({ ...this.bankerHand });
      await this.delay(500);
    }

    // Reveal player's second card
    if (this.playerHand.cards[1]) {
      this.playerHand.cards[1].isRevealed = true;
      this.playerHand.score = this.calculateScore(this.playerHand.cards);
      this.playerHandSubject.next({ ...this.playerHand });
      await this.delay(500);
    }

    // Reveal banker's second card
    if (this.bankerHand.cards[1]) {
      this.bankerHand.cards[1].isRevealed = true;
      this.bankerHand.score = this.calculateScore(this.bankerHand.cards);
      this.bankerHandSubject.next({ ...this.bankerHand });
      await this.delay(500);
    }
  }

  async applyThirdCardRules(): Promise<void> {
    const playerScore = this.playerHand.score;
    const bankerScore = this.bankerHand.score;

    if (playerScore >= 8 || bankerScore >= 8) {
      this.determineWinner();
      return;
    }

    let playerThirdCard: Card | null = null;

    if (playerScore <= 5) {
      await this.delay(600);
      playerThirdCard = this.deckService.dealCard()!;
      playerThirdCard.isRevealed = false;
      this.playerHand.cards.push(playerThirdCard);
      this.playerHandSubject.next({ ...this.playerHand });
      
      await this.delay(600);
      playerThirdCard.isRevealed = true;
      this.playerHand.score = this.calculateScore(this.playerHand.cards);
      this.playerHandSubject.next({ ...this.playerHand });
    }

    await this.delay(600);
    const shouldBankerDraw = this.shouldBankerDrawThirdCard(bankerScore, playerThirdCard);
    
    if (shouldBankerDraw) {
      const bankerThirdCard = this.deckService.dealCard()!;
      bankerThirdCard.isRevealed = false;
      this.bankerHand.cards.push(bankerThirdCard);
      this.bankerHandSubject.next({ ...this.bankerHand });
      
      await this.delay(600);
      bankerThirdCard.isRevealed = true;
      this.bankerHand.score = this.calculateScore(this.bankerHand.cards);
      this.bankerHandSubject.next({ ...this.bankerHand });
    }

    await this.delay(400);
    this.determineWinner();
  }

  private shouldBankerDrawThirdCard(bankerScore: number, playerThirdCard: Card | null): boolean {
    if (!playerThirdCard) {
      return bankerScore <= 5;
    }

    const playerThirdValue = playerThirdCard.value;

    switch (bankerScore) {
      case 0:
      case 1:
      case 2:
        return true;
      case 3:
        return playerThirdValue !== 8;
      case 4:
        return [2, 3, 4, 5, 6, 7].includes(playerThirdValue);
      case 5:
        return [4, 5, 6, 7].includes(playerThirdValue);
      case 6:
        return [6, 7].includes(playerThirdValue);
      default:
        return false;
    }
  }

  private determineWinner(): void {
    const playerScore = this.playerHand.score;
    const bankerScore = this.bankerHand.score;

    let winner: BetType | null = null;

    if (playerScore > bankerScore) {
      winner = 'player';
    } else if (bankerScore > playerScore) {
      winner = 'banker';
    } else {
      winner = 'tie';
    }

    const result: GameResult = {
      winner,
      playerScore,
      bankerScore,
      playerHand: [...this.playerHand.cards],
      bankerHand: [...this.bankerHand.cards]
    };

    this.gameResultSubject.next(result);
    this.updateStats(winner);
  }

  private updateStats(winner: BetType | null): void {
    const currentStats = this.gameStatsSubject.value;
    
    if (winner === 'player') {
      currentStats.playerWins++;
    } else if (winner === 'banker') {
      currentStats.bankerWins++;
    } else if (winner === 'tie') {
      currentStats.ties++;
    }

    this.gameStatsSubject.next({ ...currentStats });
  }

  resetStats(): void {
    this.gameStatsSubject.next({ playerWins: 0, bankerWins: 0, ties: 0 });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getPlayerHand(): Hand {
    return { ...this.playerHand };
  }

  getBankerHand(): Hand {
    return { ...this.bankerHand };
  }
}