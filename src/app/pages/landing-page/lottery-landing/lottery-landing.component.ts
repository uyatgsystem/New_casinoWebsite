import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../../Services/utils.service';
interface Step {
  number: string;
  title: string;
  highlightWord: string;
  description: string;
  icon: string;
}
@Component({
  selector: 'app-lottery-landing',
  imports: [CommonModule],
  templateUrl: './lottery-landing.component.html',
  styleUrl: './lottery-landing.component.scss',
})
export class LotteryLandingComponent {
  grainBackdrop: SafeHtml = '';
  steps: Step[] = [
    {
      number: '1',
      title: 'Choose Your Lottery',
      highlightWord: 'Lottery',
      description:
        'Select from our exciting daily, weekly, or special jackpot draws. Play your favorite or try them all for more chances to win.',
      icon: '🎫',
    },
    {
      number: '2',
      title: 'Pick Your Numbers',
      highlightWord: 'Numbers',
      description:
        'Choose your lucky numbers manually or let the system auto-generate them for you. It’s fast, simple, and designed to maximize your chances of winning.',
      icon: '🎱',
    },
    {
      number: '3',
      title: 'Check Your Numbers',
      highlightWord: 'Numbers',
      description:
        'Once the results are announced, see if you’ve won your cash rewards. Don’t forget: prizes must be claimed within 48 Hours, so you never miss your winnings!',
      icon: '🏆',
    },
  ];
  constructor(private utils: UtilsService) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }
  getTitle(
    title: string,
    highlightWord: string,
  ): { before: string; after: string } {
    const index = title.indexOf(highlightWord);
    if (index === -1) {
      return { before: title, after: '' };
    }
    return {
      before: title.substring(0, index),
      after: title.substring(index + highlightWord.length),
    };
  }
}
