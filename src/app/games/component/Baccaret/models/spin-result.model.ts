export interface SpinResult {
  number: number;
  color: 'red' | 'black' | 'green';
  timestamp: Date;
  winningBets: string[]; // Array of bet IDs that won
  totalPayout: number;
  netProfit: number; // Payout minus total bet amount
  responseMessage?: string; // optional message from backend
  isWin?: boolean; // Win flag from backend API
}
