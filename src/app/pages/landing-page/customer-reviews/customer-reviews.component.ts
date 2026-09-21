import { CommonModule } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../../Services/utils.service';

export interface ReviewItem {
  id: number;
  name: string;
  role: string;
  badge: string;
  winAmount: string;
  game: string;
  rating: number;
  timeAgo: string;
  img: string;
  text: string;
}

@Component({
  selector: 'app-customer-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-reviews.component.html',
  styleUrl: './customer-reviews.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CustomerReviewsComponent implements OnInit, OnDestroy {
  constructor(private utils: UtilsService, private router: Router) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }

  grainBackdrop: SafeHtml = '';

  feedbacks: ReviewItem[] = [
    {
      id: 1,
      name: 'Jay G.',
      role: 'Diamond VIP Member',
      badge: 'JACKPOT WINNER',
      winAmount: '$5,000.00',
      game: 'VIP Fortune Wheel',
      rating: 5,
      timeAgo: '2 hours ago',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client1.jpg',
      text: "I recently hit a $5,000 jackpot on Crown Spin and the payout process was incredibly smooth. From verification to withdrawal, everything was handled professionally. It's easily one of the most trustworthy casinos I've ever played on.",
    },
    {
      id: 2,
      name: 'Ryan V.',
      role: 'Platinum High Roller',
      badge: 'TOP MULTIPLIER',
      winAmount: '$7,420.00',
      game: 'Aviator Turbo',
      rating: 5,
      timeAgo: '5 hours ago',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client2.jpg',
      text: 'Crown Spin is hands down my favorite gaming platform. The bonus offers are generous, and I really appreciate the 24/7 VIP live support. Withdrawals are processed under 60 seconds with zero hidden deductions. Highly recommended!',
    },
    {
      id: 3,
      name: 'Daniel T.',
      role: 'Elite Club Winner',
      badge: 'MEGA CASHOUT',
      winAmount: '$12,850.00',
      game: 'Plinko Multiplier',
      rating: 5,
      timeAgo: 'Yesterday',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client3.jpg',
      text: 'After trying multiple sites, Crown Spin became my clear #1 pick. Games load instantaneously even on mobile, and the provably fair RNG algorithms give total peace of mind. My big cashout arrived in minutes without any fuss.',
    },
    {
      id: 4,
      name: 'Michael R.',
      role: 'Gold VIP Spinner',
      badge: 'DAILY WINNER',
      winAmount: '$9,200.00',
      game: 'Mega Wheel & Slots',
      rating: 5,
      timeAgo: '2 days ago',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client4.jpg',
      text: "I've been playing here for several months and the experience has been phenomenal. Top-tier game library, excellent rakeback rates, and customer service that actually cares. Consistent wins and flawless payouts every time.",
    },
    {
      id: 5,
      name: 'Sarah K.',
      role: 'Diamond VIP Member',
      badge: 'INSTANT CASHOUT',
      winAmount: '$14,600.00',
      game: 'Live VIP Roulette',
      rating: 5,
      timeAgo: '3 days ago',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client2.jpg',
      text: 'The payout speed on Crown Spin is unparalleled. Requested a crypto withdrawal at 11 PM and funds were in my personal wallet in under 45 seconds. The daily reloads and VIP tournaments make every session thrilling.',
    },
    {
      id: 6,
      name: 'David L.',
      role: 'High Roller Champion',
      badge: 'PROVABLY FAIR',
      winAmount: '$15,300.00',
      game: 'Blackjack VIP',
      rating: 5,
      timeAgo: '4 days ago',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client3.jpg',
      text: 'Provably fair gaming at its finest. The RTP rates across slots and tables are visibly higher than standard online casinos. Their VIP host responded immediately to my requests. 10/10 platform for serious players.',
    },
  ];

  autoplayInterval: any;
  autoplaySpeed = 4500;
  currentSlide = 0;

  get maxSlideIndex(): number {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1024) return Math.max(0, this.feedbacks.length - 3);
      if (window.innerWidth >= 768) return Math.max(0, this.feedbacks.length - 2);
    }
    return Math.max(0, this.feedbacks.length - 1);
  }

  @HostListener('window:resize')
  onResize() {
    if (this.currentSlide > this.maxSlideIndex) {
      this.currentSlide = this.maxSlideIndex;
    }
  }

  ngOnInit(): void {
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoplaySpeed);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }

  previousSlide(): void {
    this.currentSlide =
      this.currentSlide <= 0 ? this.maxSlideIndex : this.currentSlide - 1;
  }

  nextSlide(): void {
    this.currentSlide =
      this.currentSlide >= this.maxSlideIndex ? 0 : this.currentSlide + 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = Math.min(index, this.maxSlideIndex);
  }

  getDots(): number[] {
    return Array(this.maxSlideIndex + 1)
      .fill(0)
      .map((_, i) => i);
  }

  redirectToSignUp() {
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem('token')
        : null;
    if (token) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
