import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { register } from 'swiper/element/bundle';
import { UtilsService } from '../../../Services/utils.service';

@Component({
  selector: 'app-customer-reviews',
  imports: [CommonModule, CarouselModule],
  templateUrl: './customer-reviews.component.html',
  styleUrl: './customer-reviews.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CustomerReviewsComponent implements OnInit {
  constructor(private utils: UtilsService) {
    register();
    this.grainBackdrop = this.utils.getGrainBackdrop();
  }
  grainBackdrop: SafeHtml = '';
  feedbacks = [
    {
      text: "I recently hit a $5,000 jackpot on CasinoMaxs and the payout process was incredibly smooth. From verification to withdrawal, everything was handled professionally. The platform feels secure. It's easily one of the most trustworthy online casinos I’ve used so far.",
      name: 'Jay G.',
      role: 'CasinoMaxs Player',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client1.jpg',
    },
    {
      text: 'CasinoMaxs is my favorite online casino. The bonus offers are generous, and I really appreciate the 24/7 live chat support. I’ve never had a bad experience here. Withdrawals are quick, and the games run without lag. I play regularly and have recommended it to several of my friends.',
      name: 'Ryan V.',
      role: 'CasinoMaxs Player',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client2.jpg',
    },
    {
      text: 'After trying multiple sites, CasinoMaxs became my top pick. The game variety is excellent and everything loads fast, even on mobile. Support helped me verify my account in minutes. Once that was done, my first withdrawal arrived in less than 72 hours. Great experience from start to finish.',
      name: 'Daniel T.',
      role: 'CasinoMaxs Player',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client3.jpg',
    },
    {
      text: 'I’ve been using CasinoMaxs for a few months and I’m really impressed. They offer a huge selection of slots and table games. Plus, the welcome bonus gave me a great start. Their customer service is fast and helpful. I’ve had consistent wins and fast payouts every time.',
      name: 'Michael R.',
      role: 'CasinoMaxs Player',
      img: 'https://cmaxv2images2.pages.dev/assets/avatars/client4.jpg',
    },
  ];

  autoplayInterval: any;
  autoplaySpeed = 4000;

  currentSlide = 1;
  totalSlides = this.feedbacks.length;

  ngOnInit(): void {
    this.startAutoplay();
  }

  startAutoplay() {
    this.autoplayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoplaySpeed);
  }

  stopAutoplay() {
    clearInterval(this.autoplayInterval);
  }

  previousSlide(): void {
    this.currentSlide =
      this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
  }

  nextSlide(): void {
    this.currentSlide =
      this.currentSlide === this.totalSlides - 1 ? 0 : this.currentSlide + 1;
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
  }

  getDots(): number[] {
    return Array(this.totalSlides)
      .fill(0)
      .map((_, i) => i);
  }
}
