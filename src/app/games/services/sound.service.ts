import { Injectable } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class SoundService {
  private sounds: { [key: string]: HTMLAudioElement } = {}
  private soundsLoaded = false
  private loopingAudio?: HTMLAudioElement;

  constructor() {}

  preloadSounds(): void {
    const soundFiles: Record<
      "boxdrop" | "btnsound" | "reward" | "lose" | "loader",
      string
    > = {
      boxdrop: "boxdrop.mp3",
      btnsound: "btnsound.mp3",
      reward: "reward.wav",
      lose: "lose.mp3",
      loader: "load.mp3",

    };
    (Object.keys(soundFiles) as Array<keyof typeof soundFiles>).forEach((key) => {
      this.sounds[key] = new Audio(soundFiles[key]);
      this.sounds[key].preload = "auto";
      this.sounds[key].volume = 0.5;

      // Handle loading errors gracefully
      this.sounds[key].addEventListener("error", () => {
        console.warn(`Could not load sound: ${soundFiles[key]}`);
      });
    });

    this.soundsLoaded = true;
  }

  playSound(soundName: string): void {
    if (!this.soundsLoaded || !this.sounds[soundName]) {
      return;
    }

    try {
      const sound = this.sounds[soundName].cloneNode() as HTMLAudioElement;
      sound.volume = this.sounds[soundName].volume;
      sound.play().catch((error) => {
        console.warn(`Could not play sound ${soundName}:`, error);
      });
    } catch (error) {
      console.warn(`Error playing sound ${soundName}:`, error);
    }
  }

  playLoopingSound(soundName: string): void {
    if (!this.soundsLoaded || !this.sounds[soundName]) return;

    // Stop any currently looping sound
    this.stopLoopingSound();

    // Clone and loop
    const sound = this.sounds[soundName].cloneNode() as HTMLAudioElement;
    sound.volume = this.sounds[soundName].volume;
    sound.loop = true;
    sound.currentTime = 0;
    sound.play().catch(() => {});
    this.loopingAudio = sound;
  }

  stopLoopingSound(): void {
    if (this.loopingAudio) {
      this.loopingAudio.pause();
      this.loopingAudio.currentTime = 0;
      this.loopingAudio = undefined;
    }
  }

  setVolume(soundName: string, volume: number): void {
    if (this.sounds[soundName]) {
      this.sounds[soundName].volume = Math.max(0, Math.min(1, volume));
    }
  }

  setMasterVolume(volume: number): void {
    const masterVolume = Math.max(0, Math.min(1, volume));
    Object.keys(this.sounds).forEach((key) => {
      this.sounds[key].volume = masterVolume;
    });
  }
}