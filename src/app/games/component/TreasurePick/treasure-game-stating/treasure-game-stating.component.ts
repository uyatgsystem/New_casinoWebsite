import { CommonModule } from '@angular/common';
import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { SoundService } from '../../../services/sound.service';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-treasure-game-stating',
  templateUrl: './treasure-game-stating.component.html',
  imports: [CommonModule],
  standalone: true,
  styleUrls: ['./treasure-game-stating.component.scss']
})
export class TreasureGameStatingComponent implements OnInit, OnDestroy {
  closedChest = 'https://treasure-box.pages.dev/houseOfLuck/treasure1.png';
  openChest = 'https://treasure-box.pages.dev/houseOfLuck/filledbox.png';
  coinImg = 'https://treasure-box.pages.dev/houseOfLuck/coin1.png';
  gameName = 'https://treasure-box.pages.dev/houseOfLuck/gamename.png';
  @Output() loadingComplete = new EventEmitter<void>();

  loaderState: 'shake' | 'open' | 'done' = 'shake';
  progress = 0;
  private progressInterval: any;
  private coinInterval: any;
  private coinId = 0;

  coins: {
    id: number;
    left: number;
    size: number;
    duration: number;
    delay: number;
    rotate: number;
  }[] = [];

  constructor(private ngZone: NgZone, private soundService: SoundService) {} // Inject SoundService

  ngOnInit() {
      this.soundService.preloadSounds();
    this.soundService.playLoopingSound('loader'); // Play loader sound

    // Chest shake, then open, then start progress
    setTimeout(() => {
      this.loaderState = 'open';
      setTimeout(() => this.startProgress(), 700);
    }, 1200);

    // Coin rain
    this.ngZone.runOutsideAngular(() => {
      this.coinInterval = setInterval(() => this.spawnCoin(), 120);
    });
  }

  ngOnDestroy() {
    clearInterval(this.progressInterval);
    clearInterval(this.coinInterval);
        this.soundService.stopLoopingSound(); // Stop loader sound when leaving

  }

  startProgress() {
    this.progress = 0;
    this.progressInterval = setInterval(() => {
      if (this.progress < 100) {
        this.progress += Math.floor(Math.random() * 6) + 2;
        if (this.progress > 100) this.progress = 100;
      } else {
        clearInterval(this.progressInterval);
        clearInterval(this.coinInterval);
        setTimeout(() => {
          this.loaderState = 'done';
          this.loadingComplete.emit(); // <-- Emit event here
        }, 800);
      }
    }, 90);
  }
  spawnCoin() {
    const left = Math.random() * 90 + 2;
  const size = Math.random() * 40 + 60; // Increase min/max size (was 24+32)
    const duration = Math.random() * 0.8 + 1.2;
    const delay = Math.random() * 0.2;
    const rotate = Math.random() * 360;
    const id = this.coinId++;
    this.coins.push({ id, left, size, duration, delay, rotate });

    setTimeout(() => {
      this.coins = this.coins.filter(c => c.id !== id);
    }, (duration + delay) * 1000 + 300);
  }
}