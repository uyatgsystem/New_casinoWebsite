import { Injectable } from '@angular/core';
import { Card } from '../component/Baccaret/models/card.model';

@Injectable({
  providedIn: 'root'
})
export class DeckService {
  private deck: Card[] = [];
  private readonly suits: Array<'H' | 'D' | 'C' | 'S'> = ['H', 'D', 'C', 'S'];
  private readonly ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  constructor() {
    this.initializeDeck();
  }

  private initializeDeck(): void {
    this.deck = [];
    
    for (const suit of this.suits) {
      for (const rank of this.ranks) {
        const card: Card = {
          suit,
          rank,
          value: this.getCardValue(rank),
          imagePath: this.getImagePath(rank, suit),
          id: `${rank}${suit}`
        };
        this.deck.push(card);
      }
    }
  }

  private getImagePath(rank: string, suit: 'H' | 'D' | 'C' | 'S'): string {
    // Try multiple possible paths for card images
    return `DeckCards/${rank}${suit}.png`;
  }

  private getCardValue(rank: string): number {
    if (rank === 'A') return 1;
    if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
    return parseInt(rank, 10);
  }

  shuffleDeck(): void {
    this.initializeDeck();
    
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCard(): Card | null {
    if (this.deck.length === 0) {
      this.shuffleDeck();
    }
    return this.deck.pop() || null;
  }

  dealCards(count: number): Card[] {
    const cards: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.dealCard();
      if (card) {
        cards.push(card);
      }
    }
    return cards;
  }

  getRemainingCards(): number {
    return this.deck.length;
  }

  needsReshuffle(): boolean {
    return this.deck.length < 10;
  }
}