
import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ActivityTrackService {
  // private inactivityTime = 5 * 60 * 1000; 
  private inactivityTime = 10 * 1000; 
  private timeoutId: any;

  constructor(private ngZone: NgZone, @Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      this.startTracking();
    }
  }

  private resetTimer() {
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      // alert('user unactive')
      console.log('User is inactive for 1 minutes.');
    }, this.inactivityTime);
  }

  private startTracking() {
    if (!isPlatformBrowser(this.platformId)) return; // Ensure this runs only in the browser

    this.ngZone.runOutsideAngular(() => {
      const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
      events.forEach(event => window.addEventListener(event, () => this.resetTimer()));

      this.resetTimer(); // Start the initial timer
    });
  }
}
