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
  stars = Array(30).fill(0).map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    duration: 2000 + Math.random() * 3000
  }));

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
