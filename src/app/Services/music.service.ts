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

  // Reactive subjects for components to observe
  public isMuted$ = new BehaviorSubject<boolean>(true);
  public trackTitle$ = new BehaviorSubject<string>('Crown Chill Lounge');
  public isPlaying$ = new BehaviorSubject<boolean>(false);

  // Soft fallback HTML audio element if needed
  private audioBell: HTMLAudioElement | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    if (this.isBrowser) {
      // Check saved user preference (defaults to unmuted for ambient experience, or respects previous preference)
      const savedMute = localStorage.getItem('crownspin_sound_muted');
      this.isMuted = savedMute !== null ? savedMute === 'true' : false;
      this.isMuted$.next(this.isMuted);

      // Determine initial mode based on current URL and auth token
      this.updateModeFromRoute(this.router.url);

      // Listen for route changes to automatically switch tracks between pre-login and post-login
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event: NavigationEnd) => {
          this.updateModeFromRoute(event.urlAfterRedirects || event.url);
        });

      // Register global interaction unlocker for browser autoplay policies
      this.setupAutoplayUnlock();
    }
  }

  /**
   * Determine whether current view should use pre-login ambient lounge or post-login VIP groove
   */
  private updateModeFromRoute(url: string): void {
    const isDashboard = url.startsWith('/dashboard') || !!localStorage.getItem('token');
    const newMode: MusicMode = isDashboard ? 'post-login' : 'pre-login';

    if (newMode !== this.currentMode) {
      this.currentMode = newMode;
      this.trackTitle$.next(
        newMode === 'post-login' ? 'Crown VIP Platinum Lounge' : 'Crown Ambient Chill Lounge'
      );
      this.crossfadeMode(newMode);
    }
  }

  /**
   * Browser autoplay policy requires user interaction before AudioContext can play.
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
   * Initialize Web Audio Graph with high-end master filtering, soft limiter, and discrete channels
   */
  private initAudioEngine(): void {
    if (!this.isBrowser || this.isInitialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();

      // Master Gain
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.22, this.audioCtx.currentTime);

      // Master Warmth Low-Pass Filter (removes harsh frequencies, gives warm analog casino vibe)
      const masterFilter = this.audioCtx.createBiquadFilter();
      masterFilter.type = 'lowpass';
      masterFilter.frequency.setValueAtTime(2400, this.audioCtx.currentTime);
      masterFilter.Q.setValueAtTime(0.7, this.audioCtx.currentTime);

      // Pre-Login Channel Gain
      this.preLoginGain = this.audioCtx.createGain();
      this.preLoginGain.gain.setValueAtTime(this.currentMode === 'pre-login' ? 1 : 0, this.audioCtx.currentTime);

      // Post-Login VIP Channel Gain
      this.postLoginGain = this.audioCtx.createGain();
      this.postLoginGain.gain.setValueAtTime(this.currentMode === 'post-login' ? 1 : 0, this.audioCtx.currentTime);

      this.preLoginGain.connect(masterFilter);
      this.postLoginGain.connect(masterFilter);
      masterFilter.connect(this.masterGain);
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
   * Smoothly crossfade between Pre-Login Ambient Lounge and Post-Login VIP Groove
   */
  private crossfadeMode(targetMode: MusicMode): void {
    if (!this.audioCtx || !this.preLoginGain || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;
    const fadeDuration = 1.8;

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
   * Generative Harmonic Music Clock
   * Plays serene celestial chords & 432Hz ambient waves (Pre-login)
   * or warm deep sub-groove with lo-fi casino electric keys (Post-login)
   */
  private startGenerativeMusic(): void {
    if (this.loopIntervalId) return;

    this.isPlaying$.next(true);

    // Run music scheduler outside Angular zone for peak performance
    this.ngZone.runOutsideAngular(() => {
      // Chords for Pre-Login (Ethereal Alpha-Wave Chill: Fmaj9 -> G6 -> Am9 -> Em7)
      const preLoginChords = [
        [174.61, 220.0, 261.63, 329.63, 392.0], // Fmaj9
        [196.0, 246.94, 293.66, 392.0, 440.0],  // G6
        [220.0, 261.63, 329.63, 392.0, 493.88], // Am9
        [164.81, 196.0, 246.94, 293.66, 392.0], // Em7
      ];

      // Chords & Bass for Post-Login (VIP Platinum Groove at ~72 BPM)
      const postLoginBassProgression = [87.31, 98.0, 110.0, 82.41]; // F, G, A, E
      const postLoginKeys = [
        [261.63, 329.63, 392.0, 493.88], // Fmaj7
        [293.66, 349.23, 440.0, 523.25], // G9
        [329.63, 392.0, 493.88, 587.33], // Am9
        [246.94, 293.66, 370.0, 440.0],  // Em7
      ];

      const tick = () => {
        if (!this.audioCtx || this.isMuted) return;

        const chordIndex = Math.floor(this.beatCount / 4) % 4;
        const beatInMeasure = this.beatCount % 4;

        if (this.currentMode === 'pre-login') {
          // Pre-login: Trigger long warm pad swell on measure start
          if (beatInMeasure === 0) {
            this.playAmbientPad(preLoginChords[chordIndex], 3.8);
          }
          // Delicate occasional chime sparkle
          if (beatInMeasure === 2 && Math.random() > 0.4) {
            const notes = [523.25, 659.25, 783.99, 880.0, 1046.5];
            const note = notes[Math.floor(Math.random() * notes.length)];
            this.playShimmerNote(note);
          }
        } else {
          // Post-login VIP Groove:
          // 1. Warm sub-bass note
          if (beatInMeasure === 0 || beatInMeasure === 2) {
            const root = postLoginBassProgression[chordIndex];
            this.playWarmSubBass(root, beatInMeasure === 0 ? 1.4 : 0.8);
          }

          // 2. Smooth electric keys comping
          if (beatInMeasure === 0 || beatInMeasure === 3) {
            this.playElectricKeys(postLoginKeys[chordIndex], 1.2);
          }

          // 3. Subtle velvet lo-fi percussion tick (very soft and relaxing)
          this.playVelvetTick(beatInMeasure === 1 || beatInMeasure === 3);
        }

        this.beatCount++;
      };

      // 72 BPM = 833ms per beat
      tick();
      this.loopIntervalId = setInterval(tick, 833);
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
  // SYNTHESIZER VOICES (Engineered for Mind Relaxation)
  // ----------------------------------------------------

  /**
   * Pre-Login: Lush warm analog pad with slow breathing envelope
   */
  private playAmbientPad(frequencies: number[], duration: number): void {
    if (!this.audioCtx || !this.preLoginGain) return;

    const now = this.audioCtx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      const filter = this.audioCtx!.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for rich celestial chorus
      osc.detune.setValueAtTime((idx - 2) * 4, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550, now);
      filter.frequency.exponentialRampToValueAtTime(850, now + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(450, now + duration);

      // Smooth attack and long gentle release
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.preLoginGain!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Pre-Login: Soft crystalline shimmer touch
   */
  private playShimmerNote(freq: number): void {
    if (!this.audioCtx || !this.preLoginGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.02, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);

    osc.connect(gain);
    gain.connect(this.preLoginGain);

    osc.start(now);
    osc.stop(now + 2.0);
  }

  /**
   * Post-Login VIP: Deep soothing sub-bass pulse
   */
  private playWarmSubBass(freq: number, duration: number): void {
    if (!this.audioCtx || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.postLoginGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Post-Login VIP: Warm neo-soul electric piano chords
   */
  private playElectricKeys(frequencies: number[], duration: number): void {
    if (!this.audioCtx || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;

    frequencies.forEach((freq, idx) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      const filter = this.audioCtx!.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.postLoginGain!);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  /**
   * Post-Login VIP: Velvet subtle soft rhythm tick (unobtrusive micro-groove)
   */
  private playVelvetTick(isAccent: boolean): void {
    if (!this.audioCtx || !this.postLoginGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 380 : 260, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);

    gain.gain.setValueAtTime(isAccent ? 0.012 : 0.006, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.postLoginGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // ----------------------------------------------------
  // PUBLIC CONTROL INTERFACE
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
      this.masterGain.gain.linearRampToValueAtTime(0.22, now + 0.6);
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
        this.masterGain.gain.linearRampToValueAtTime(0, now + 0.4);
        setTimeout(() => {
          if (this.isMuted) this.stopGenerativeMusic();
        }, 400);
      } else {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        this.masterGain.gain.linearRampToValueAtTime(0.22, now + 0.6);
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
      // Celestial crystal bell chord (E6, G#6, B6, E7)
      const chord = [1318.51, 1661.22, 1975.53, 2637.02];

      chord.forEach((freq, i) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);

        gain.gain.setValueAtTime(0, now + i * 0.04);
        gain.gain.linearRampToValueAtTime(0.04, now + i * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 1.2);

        osc.connect(gain);
        gain.connect(this.masterGain || this.audioCtx!.destination);

        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 1.2);
      });
    } catch (e) {
      // Fallback
    }
  }
}
