import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-loading-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-page.component.html',
  styleUrl: './loading-page.component.scss'
})
export class LoadingPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('loadingBar', { static: false }) loadingBarRef!: ElementRef<HTMLDivElement>;
  @ViewChild('loadingPercentage', { static: false }) loadingPercentageRef!: ElementRef<HTMLDivElement>;
    @Output() loadingComplete = new EventEmitter<void>();

  private animationFrameId: number | null = null;
  private loadingProgress = 0;
  private targetProgress = 0;
  private loadingSpeed = 0.5;
  particles = Array.from({ length: 25 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3
  }));
  ngAfterViewInit() {
    this.simulateLoading();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private simulateLoading() {
    // Simulate realistic loading stages
    const loadingStages = [
      { target: 15, delay: 800 },
      { target: 35, delay: 1200 },
      { target: 60, delay: 1000 },
      { target: 85, delay: 1500 },
      { target: 100, delay: 800 }
    ];

    let stageIndex = 0;

    const progressToNextStage = () => {
      if (stageIndex < loadingStages.length) {
        this.targetProgress = loadingStages[stageIndex].target;
        
        setTimeout(() => {
          stageIndex++;
          if (stageIndex < loadingStages.length) {
            progressToNextStage();
          }
        }, loadingStages[stageIndex].delay);
      }
    };

    // Start the loading animation
    this.animateProgressBar();
    progressToNextStage();
  }

  private animateProgressBar() {
    const animate = () => {
      // Smooth progress animation
      const diff = this.targetProgress - this.loadingProgress;
      this.loadingProgress += diff * 0.02;

      if (Math.abs(diff) < 0.1) {
        this.loadingProgress = this.targetProgress;
      }

      // Update UI elements
      if (this.loadingBarRef?.nativeElement) {
        this.loadingBarRef.nativeElement.style.width = `${this.loadingProgress}%`;
      }
      
      if (this.loadingPercentageRef?.nativeElement) {
        this.loadingPercentageRef.nativeElement.textContent = `${Math.floor(this.loadingProgress)}%`;
      }

      // Continue animation
      if (this.loadingProgress < 100) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Loading complete - you can emit an event or call a callback here
        setTimeout(() => {
          this.onLoadingComplete();
        }, 500);
      }
    };

    animate();
  }

  private onLoadingComplete() {
    this.loadingComplete.emit();
  }
  // Method to manually set progress (useful for real loading scenarios)
  setProgress(progress: number) {
    this.targetProgress = Math.max(0, Math.min(100, progress));
  }
}