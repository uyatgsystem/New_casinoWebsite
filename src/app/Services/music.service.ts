import { Injectable } from '@angular/core';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  private audio: any;
  private audioBell: any;
  private isMuted = true;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
   this.audio = new Audio();
      this.audioBell = new Audio();
      this.audio.src = 'Audio/music.mp3';
      this.audioBell.src = 'Audio/bell.wav';
      this.audio.loop = true;
  }}

  playMusic() {
    if (isPlatformBrowser(this.platformId) && this.audio && !this.isMuted) {
      this.audio
        .play()
        .catch((error: any) => console.error('Error playing audio:', error));
    }
  }
  playBell() {
    if (isPlatformBrowser(this.platformId) && this.audioBell) {
      this.audioBell
        .play()
        .catch((error:any) => console.error('Error playing audio:', error));
    }
  }
  muteUnmute() {
    if (isPlatformBrowser(this.platformId) && this.audio) {
      this.isMuted = !this.isMuted;
      if (this.isMuted) {
        this.audio.pause();
      } else {
        this.audio.play();
      }
    }
  }
  isMusicMuted(): boolean {
    return this.isMuted;
  }
}
