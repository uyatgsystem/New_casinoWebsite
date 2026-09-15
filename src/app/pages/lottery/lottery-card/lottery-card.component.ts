import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Lottery } from '../lottery.type';

@Component({
  selector: 'app-lottery-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lottery-card.component.html',
  styleUrl: './lottery-card.component.scss',
})
export class LotteryCardComponent implements OnInit, OnDestroy {
  @Input() lotteries: Lottery[] = [];
  private timerInterval: any;
  constructor(private router: Router) { }
  ngOnInit(): void {
    // Initialize UI properties for each lottery
    this.lotteries.forEach((lottery) => {
      lottery.timeLeft = ['00', '00', '00', '00'];
      lottery.buttonStyle = this.getInitialButtonStyle(lottery.Status);
    });
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private getInitialButtonStyle(status: 'Open' | 'Close' | 'Upcoming'): string {
    return status === 'Open'
      ? 'bg-green-600 text-white hover:bg-green-700'
      : status === 'Close'
        ? 'bg-yellow-500 text-black hover:bg-yellow-600'
        : 'bg-blue-600 text-white hover:bg-blue-700';
  }

  private startTimer(): void {
    this.updateTimers(); // Initial update
    this.timerInterval = setInterval(() => {
      this.updateTimers();
    }, 1000);
  }

  private updateTimers(): void {
    const now = new Date().getTime();

    this.lotteries.forEach((lottery) => {
      const drawTime = new Date(lottery.DrawTime).getTime();
      const timeRemaining = drawTime - now;

      lottery.isDisabled = lottery.Status === 'Close' ? true : false;
      if (timeRemaining <= 0) {
        // Past the draw time
        lottery.timeLeft = ['00', '00', '00', '00'];
        lottery.Status = 'Close';
        lottery.buttonStyle = 'bg-gray-500 text-white hover:bg-gray-600';
        return;
      }

      // Calculate time units
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      // Update timeLeft array
      lottery.timeLeft = [
        this.padNumber(days),
        this.padNumber(hours),
        this.padNumber(minutes),
        this.padNumber(seconds),
      ];

      // Update status based on remaining time
      if (days > 30) {
        // More than a month remaining
        lottery.Status = 'Upcoming';
        lottery.buttonStyle = 'bg-blue-600 text-white hover:bg-blue-700';
      } else if (days <= 30) {
        lottery.Status = 'Open';
        lottery.buttonStyle = 'bg-green-600 text-white hover:bg-green-700';
      } else {
        // Less than a month remaining
        lottery.Status = 'Close';
        lottery.buttonStyle = 'bg-yellow-500 text-black hover:bg-yellow-600';
      }
    });
  }

  private padNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  redirectToTicketPage(lotteryData: any) {
    const LotteryDetails = {
      IDO: lotteryData?.Id || 0,
      LYN: lotteryData?.LotteryName || '',
      ILC: lotteryData?.InitialCode || '',
      TLT: lotteryData?.TotalTickets || 0,
      TIP: lotteryData?.TicketPrice || 0,
      DTM: lotteryData?.DrawTime || '',
    };
    localStorage.setItem('LID', JSON.stringify(LotteryDetails));

    this.router.navigate(['/dashboard/lottery-tickets']);
  }
  // Helper function to determine time label
  getTimeLabel(index: number): string {
    switch (index) {
      case 0:
        return 'Days';
      case 1:
        return 'Hours';
      case 2:
        return 'Minutes';
      case 3:
        return 'Seconds';
      default:
        return '';
    }
  }
}
