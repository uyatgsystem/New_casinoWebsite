export interface Card {
  suit: 'H' | 'D' | 'C' | 'S';
  rank: string;
  value: number;
  imagePath: string;
  id: string;
  isRevealed?: boolean;
  _imgLoaded?: boolean;
}

export interface Hand {
  cards: Card[];
  score: number;
}

export type BetType = 'player' | 'banker' | 'tie';

export interface GameResult {
  winner: BetType | null;
  playerScore: number;
  bankerScore: number;
  playerHand: Card[];
  bankerHand: Card[];
}

export interface GameStats {
  playerWins: number;
  bankerWins: number;
  ties: number;
}