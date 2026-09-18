// filepath: /H:/WordSense Projects/Social-casino_frontend/src/app/splash-screen/splash-screen.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './splash-screen.component.html',
  styleUrl: './splash-screen.component.scss'
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  progress = 0;
  isVisible = true;
  showWelcome = false;
  circles = [1, 2, 3, 4, 5];

  get statusText(): string {
    if (this.progress < 25) return 'INITIALIZING SYSTEM CORES...';
    if (this.progress < 55) return 'AUTHENTICATING PROVABLY FAIR VAULTS...';
    if (this.progress < 85) return 'DECRYPTING CASINO ENGINE...';
    return 'SYSTEM READY • WELCOME TO SPIN HUB';
  }

  private intervalId: any;
  private totalDuration = 5000; // Total duration to show splash screen (5 seconds)

  constructor() { }

  ngOnInit() {
    // Ensure splash screen is visible immediately
    this.isVisible = true;
    // Start the loading progress
    this.startLoading();
    // Set a timeout to forcibly end the splash screen
    setTimeout(() => {
      this.completeSplashScreen();
    }, this.totalDuration);
  }
  private startLoading() {
    this.intervalId = setInterval(() => {
      this.progress += 2;
      if (this.progress >= 100) {
        clearInterval(this.intervalId);
        this.showWelcome = true;
      }
    }, 50); // Fast enough to look smooth
  }
  private completeSplashScreen() {
    // Ensure interval is cleared
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isVisible = false;
  }
  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
