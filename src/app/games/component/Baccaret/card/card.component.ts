import { Component, Input, OnInit, OnChanges, SimpleChanges, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../Baccaret/models/card.model';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit, OnChanges {
  @Input() card: Card | null = null;
  @Input() animate: boolean = true;
  @Input() isRevealed: boolean = false;
  @Input() dealFromDeck: boolean = false;
  @Input() dealDelay: number = 0;
  
  isActive: boolean = false;

  @HostBinding('style.transform-style') transformStyle = 'preserve-3d';

  ngOnInit(): void {
    // Component initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Add active state when card is revealed
    if (changes['isRevealed']) {
      const current = changes['isRevealed'].currentValue;
      const previous = changes['isRevealed'].previousValue;
      
      if (current && !previous) {
        this.isActive = true;
        setTimeout(() => {
          this.isActive = false;
        }, 1200);
      }
    }
  }

  onImageError(event: any): void {
    console.warn('Card image failed to load:', this.card?.imagePath);
    const svg = this.createFallbackCard();
    event.target.src = svg;
  }

  private createFallbackCard(): string {
    if (!this.card) return '';
    
    const color = this.card.suit === 'H' || this.card.suit === 'D' ? '#dc2626' : '#1a1a1a';
    const suitSymbol = this.getSuitSymbol();
    const suitColor = this.card.suit === 'H' || this.card.suit === 'D' ? '#dc2626' : '#1a1a1a';
    
    const svg = `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="90" height="126" viewBox="0 0 90 126">
        <defs>
          <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#fafafa;stop-opacity:1" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
          </filter>
        </defs>
        <rect width="90" height="126" rx="12" fill="url(#cardGrad)" stroke="#e5e7eb" stroke-width="3"/>
        <g filter="url(#shadow)">
          <text x="12" y="28" font-size="22" font-weight="bold" fill="${color}" font-family="Arial, sans-serif">${this.card.rank}</text>
          <text x="12" y="48" font-size="20" fill="${suitColor}" font-family="Arial, sans-serif">${suitSymbol}</text>
          <text x="45" y="75" font-size="42" text-anchor="middle" fill="${suitColor}" font-family="Arial, sans-serif">${suitSymbol}</text>
        </g>
        <g transform="rotate(180 78 118)" filter="url(#shadow)">
          <text x="78" y="118" font-size="22" font-weight="bold" fill="${color}" font-family="Arial, sans-serif">${this.card.rank}</text>
          <text x="78" y="98" font-size="20" fill="${suitColor}" font-family="Arial, sans-serif">${suitSymbol}</text>
        </g>
        <rect width="90" height="126" rx="12" fill="none" stroke="rgba(0,0,0,0.05)" stroke-width="1"/>
      </svg>
    `)}`;
    
    return svg;
  }

  private getSuitSymbol(): string {
    if (!this.card) return '';
    switch (this.card.suit) {
      case 'H': return '♥';
      case 'D': return '♦';
      case 'C': return '♣';
      case 'S': return '♠';
      default: return '';
    }
  }
}