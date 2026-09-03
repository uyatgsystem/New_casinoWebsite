export type BetType = 
  | 'straight' 
  | 'split' 
  | 'street' 
  | 'corner' 
  | 'line' 
  | 'dozen' 
  | 'column' 
  | 'red' 
  | 'black' 
  | 'odd' 
  | 'even' 
  | 'low' 
  | 'high';

export interface Bet {
  id: string;
  type: BetType;
  numbers: number[];
  amount: number;
  position?: { x: number; y: number }; // For UI positioning
  label?: string; // Display label (e.g., "1st 12", "RED")
}

export interface BetPosition {
  type: BetType;
  numbers: number[];
  label?: string;
  gridArea?: string; // CSS grid area name for positioning
}
