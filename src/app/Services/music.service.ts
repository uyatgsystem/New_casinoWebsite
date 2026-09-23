import { Injectable, Inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

export type MusicMode = 'pre-login' | 'post-login';

@Injectable({
  providedIn: 'root',
})
export class MusicService {
  private isBrowser: boolean;
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private preLoginGain: GainNode | null = null;
  private postLoginGain: GainNode | null = null;

  private isMuted = true;
  private isInitialized = false;
  private currentMode: MusicMode = 'pre-login';
  private loopIntervalId: any = null;
  private beatCount = 0;
  private compressor: DynamicsCompressorNode | null = null;

  // Balanced, gentle volume level for a comfortable background atmosphere
  private readonly MASTER_VOLUME = 0.45;

  // Reactive subjects for UI components
  public isMuted$ = new BehaviorSubject<boolean>(true);
  public trackTitle$ = new BehaviorSubject<string>('Crown Chill Lounge');
  public isPlaying$ = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      // Restore user audio settings or default to muted
      const savedMute = localStorage.getItem('crownspin_sound_muted');
      this.isMuted = savedMute !== null ? savedMute === 'true' : false;
      this.isMuted$.next(this.isMuted);

      // Set initial mode based on active route
      this.updateModeFromRoute(this.router.url);

      // Automatically crossfade music mode on route change
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.updateModeFromRoute(event.urlAfterRedirects || event.url);
        });

      // Handle browser autoplay policy restrictions
      this.setupAutoplayUnlock();
    }
  }

  /**
   * Determine whether view uses Pre-Login Ambient Lounge or Post-Login Velvet VIP Groove
   */
  private updateModeFromRoute(url: string): void {
    const isDashboard = url.startsWith('/dashboard') || !!localStorage.getItem('token');
    const newMode: MusicMode = isDashboard ? 'post-login' : 'pre-login';

    if (newMode !== this.currentMode) {
      this.currentMode = newMode;
      this.trackTitle$.next(
        newMode === 'post-login' ? 'Crown Velvet Silk Groove' : 'Crown Chill Lounge'
      );
      this.crossfadeMode(newMode);
    }
  }

  /**
   * Setup interaction listener to resume AudioContext per browser policy
   */
  private setupAutoplayUnlock(): void {
    const unlock = () => {
      if (!this.isInitialized) {
        this.initAudioEngine();
      } else if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.isMuted) {
        this.startGenerativeMusic();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('click', unlock, { once: true, passive: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true, passive: true });
  }

  /**
   * Initialize Web Audio Graph with warm filtering and ultra-smooth compression
   */
  private initAudioEngine(): void {
    if (!this.isBrowser || this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.MASTER_VOLUME, this.audioCtx.currentTime);

      // Warm Low-Pass Filter: Filters out high harsh frequencies for non-intrusive sound
      const masterFilter = this.audioCtx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);
      masterFilter.Q.setValueAtTime(0.5, this.audioCtx.currentTime);

      // Smooth compressor for gentle dynamic leveling
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-20, this.audioCtx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.audioCtx.currentTime);
      this.compressor.ratio.setValueAtTime(3, this.audioCtx.currentTime);
      this.compressor.attack.setValueAtTime(0.01, this.audioCtx.currentTime);
      this.compressor.release.setValueAtTime(0.4, this.audioCtx.currentTime);

      // Discrete Channels
      this.preLoginGain = this.audioCtx.createGain();
      this.preLoginGain.gain.setValueAtTime(this.currentMode === 'pre-login' ? 1 : 0, this.audioCtx.currentTime);

      this.postLoginGain = this.audioCtx.createGain();
      this.postLoginGain.gain.setValueAtTime(this.currentMode === 'post-login' ? 1 : 0, this.audioCtx.currentTime);

      this.preLoginGain.connect(masterFilter);
      this.postLoginGain.connect(masterFilter);
      masterFilter.connect(this.compressor);
      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.audioCtx.destination);

      this.isInitialized = true;
      if (!this.isMuted) {
        this.startGenerativeMusic();
      }
    } catch (e) {
      console.warn('AudioContext initialization failed:', e);
    }
  }

  /**
   * Smoothly crossfade between Pre-Login Chill and Post-Login Velvet Groove
   */
  private crossfadeMode(targetMode: MusicMode): void {
    if (!this.audioCtx || !this.preLoginGain || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;
    const fadeDuration = 2.5;

    if (targetMode === 'pre-login') {
      this.preLoginGain.gain.cancelScheduledValues(now);
      this.preLoginGain.gain.setValueAtTime(this.preLoginGain.gain.value, now);
      this.preLoginGain.gain.linearRampToValueAtTime(1, now + fadeDuration);

      this.postLoginGain.gain.cancelScheduledValues(now);
      this.postLoginGain.gain.setValueAtTime(this.postLoginGain.gain.value, now);
      this.postLoginGain.gain.linearRampToValueAtTime(0, now + fadeDuration);
    } else {
      this.preLoginGain.gain.cancelScheduledValues(now);
      this.preLoginGain.gain.setValueAtTime(this.preLoginGain.gain.value, now);
      this.preLoginGain.gain.linearRampToValueAtTime(0, now + fadeDuration);

      this.postLoginGain.gain.cancelScheduledValues(now);
      this.postLoginGain.gain.setValueAtTime(this.postLoginGain.gain.value, now);
      this.postLoginGain.gain.linearRampToValueAtTime(1, now + fadeDuration);
    }
  }

  /**
   * Generative Ambient Music Engine (Outside Angular Zone for zero performance impact)
   */
  private startGenerativeMusic(): void {
    if (this.loopIntervalId) return;

    this.isPlaying$.next(true);

    this.ngZone.runOutsideAngular(() => {
      // Ethereal & Relaxing Jazz Lounge Chords
      const relaxingLoungeChords = [
        [174.61, 220.0, 261.63, 329.63, 392.0],  // Fmaj9
        [220.0, 261.63, 329.63, 392.0, 493.88],  // Am9
        [146.83, 174.61, 220.0, 261.63, 329.63], // Dm9
        [130.81, 164.81, 196.0, 246.94, 329.63]  // Cmaj9
      ];

      // Deep Organic Sub-Bass Frequencies
      const relaxingBassNotes = [87.31, 110.0, 73.42, 65.41];

      const tick = () => {
        if (!this.audioCtx || this.isMuted) return;

        const chordIndex = Math.floor(this.beatCount / 4) % 4;
        const beatInMeasure = this.beatCount % 4;

        if (this.currentMode === 'pre-login') {
          // Pre-Login Ambient Lounge
          if (beatInMeasure === 0) {
            this.playRelaxingPad(relaxingLoungeChords[chordIndex], 4.2);
          }
          if (beatInMeasure === 2 && Math.random() > 0.3) {
            const freq = relaxingLoungeChords[chordIndex][3] * 1.5;
            this.playSoftCrystalChime(freq);
          }
        } else {
          // Post-Login Velvet VIP Silk Groove
          if (beatInMeasure === 0) {
            this.playRelaxingPad(relaxingLoungeChords[chordIndex], 3.8);
            this.playSubBass(relaxingBassNotes[chordIndex]);
          }
          if (beatInMeasure === 1 || beatInMeasure === 3) {
            this.playSoftVelvetTap();
          }
        }

        this.beatCount++;
      };

      // Calm tempo (~68 BPM = 880ms interval)
      tick();
      this.loopIntervalId = setInterval(tick, 880);
    });
  }

  private stopGenerativeMusic(): void {
    if (this.loopIntervalId) {
      clearInterval(this.loopIntervalId);
      this.loopIntervalId = null;
    }
    this.isPlaying$.next(false);
  }

  // ----------------------------------------------------
  // SOOTHING SYNTHESIS VOICES
  // ----------------------------------------------------

  /**
   * Ultra-warm sine-wave ambient pad with breathing envelope
   */
  private playRelaxingPad(frequencies: number[], duration: number): void {
    if (!this.audioCtx) return;
    const targetGain = this.currentMode === 'post-login' ? this.postLoginGain : this.preLoginGain;
    if (!targetGain) return;

    const now = this.audioCtx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 2) * 3, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(targetGain);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Deep soothing sub-bass pulse
   */
  private playSubBass(freq: number): void {
    if (!this.audioCtx || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

    osc.connect(gain);
    gain.connect(this.postLoginGain);

    osc.start(now);
    osc.stop(now + 2.8);
  }

  /**
   * Gentle crystal bell touch
   */
  private playSoftCrystalChime(freq: number): void {
    if (!this.audioCtx || !this.preLoginGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.025, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

    osc.connect(gain);
    gain.connect(this.preLoginGain);

    osc.start(now);
    osc.stop(now + 1.8);
  }

  /**
   * Velvet lofi percussion tap (replaces loud snares/hi-hats)
   */
  private playSoftVelvetTap(): void {
    if (!this.audioCtx || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.06);

    osc.connect(gain);
    gain.connect(this.postLoginGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // ----------------------------------------------------
  // PUBLIC API CONTROLS
  // ----------------------------------------------------

  public playMusic(): void {
    if (!this.isBrowser) return;

    if (!this.isInitialized) {
      this.initAudioEngine();
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isMuted = false;
    this.isMuted$.next(false);
    localStorage.setItem('crownspin_sound_muted', 'false');

    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.MASTER_VOLUME, now + 0.8);
    }

    this.startGenerativeMusic();
  }

  public muteUnmute(): void {
    if (!this.isBrowser) return;

    if (!this.isInitialized) {
      this.initAudioEngine();
    }

    this.isMuted = !this.isMuted;
    this.isMuted$.next(this.isMuted);
    localStorage.setItem('crownspin_sound_muted', this.isMuted ? 'true' : 'false');

    if (this.audioCtx && this.masterGain) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);

      if (this.isMuted) {
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
        setTimeout(() => {
          if (this.isMuted) this.stopGenerativeMusic();
        }, 500);
      } else {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        this.masterGain.gain.linearRampToValueAtTime(this.MASTER_VOLUME, now + 0.8);
        this.startGenerativeMusic();
      }
    }
  }

  public isMusicMuted(): boolean {
    return this.isMuted;
  }

  public getCurrentMode(): MusicMode {
    return this.currentMode;
  }

  public playBell(): void {
    if (!this.isBrowser || this.isMuted) return;

    try {
      if (!this.isInitialized) this.initAudioEngine();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const chord = [1318.51, 1661.22, 1975.53];

      chord.forEach((freq, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.03, now + i * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain || this.audioCtx!.destination);

        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 1.2);
      });
    } catch (e) {
      // Fallback
    }
  }
}