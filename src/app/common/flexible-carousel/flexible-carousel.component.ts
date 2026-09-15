import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CarouselSlide {
  id: number;
  heading?: string;
  content?: string;
  img?: string;
  alt?: string;
}

@Component({
  selector: 'app-flexible-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flexible-carousel.component.html',
  styleUrls: ['./flexible-carousel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlexibleCarouselComponent implements OnInit, OnDestroy {
  @Input() items: CarouselSlide[] = [];
  @Input() autoPlayInterval: number = 5000;
  @Input() showArrows: boolean = true;
  @Input() showDots: boolean = true;

  constructor(private cdr: ChangeDetectorRef) { }
  currentIndex: number = 0;
  private autoPlayTimer: any;

  ngOnInit() {
    this.startAutoPlay();
  }

  ngOnDestroy() {
    this.stopAutoPlay();
  }

  private startAutoPlay() {
    this.autoPlayTimer = setInterval(() => {
      this.goToNext();
    }, this.autoPlayInterval);
  }

  private stopAutoPlay() {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
    }
  }

  goToSlide(index: number) {
    this.currentIndex = index;
    this.resetAutoPlay();
    this.cdr.markForCheck();
  }

  goToPrevious() {
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this.resetAutoPlay();
    this.cdr.markForCheck();
  }

  goToNext() {
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.resetAutoPlay();
    this.cdr.markForCheck();
  }

  resetAutoPlay() {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
