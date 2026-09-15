export interface Lottery {
  SrNumber: number;
  Id: number;
  LotteryName: string;
  InitialCode: string;
  TotalTickets: number;
  TicketPrice: number;
  DrawTime: string;
  Status: 'Open' | 'Close' | 'Upcoming';
  IsActive: boolean;
  AddedBy: string;
  AddedDate: string;
  UpdatedBy: string;
  UpdatedDate: string;
  TotalRecords: number;
  // UI specific properties
  timeLeft: string[];
  buttonStyle: string;
  isDisabled: boolean;
}
