import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type GamePhase = 'menu' | 'playing' | 'gameover';

@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly highScoreStorageKey = 'perfect-stack-high-score';
  private readonly defaultBalance = 0;

  readonly phase = signal<GamePhase>('menu');
  readonly score = signal<number>(0);
  readonly highScore = signal<number>(0);
  readonly balance = signal<number>(this.defaultBalance);
  readonly currentBet = signal<number>(0);
  readonly multiplier = signal<number>(1);
  readonly lastCrashMultiplier = signal<number | null>(null);
  readonly lastRoundPayout = signal<number>(0);
  readonly lastOutcome = signal<string>('');
  readonly perfectHits = signal<number>(0);
  readonly consecutivePerfects = signal<number>(0);
  readonly roundsPlayed = signal<number>(0);
  readonly isPlaying = computed(() => this.phase() === 'playing');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const savedValue = Number.parseInt(localStorage.getItem(this.highScoreStorageKey) ?? '0', 10);
    if (!Number.isNaN(savedValue) && savedValue > 0) {
      this.highScore.set(savedValue);
    }
  }

  canStartWithBet(betAmount: number): boolean {
    const bet = this.normalizeMoney(betAmount);
    return bet > 0 && bet <= this.balance() && this.phase() !== 'playing';
  }

  startGameWithBet(betAmount: number): boolean {
    const bet = this.normalizeMoney(betAmount);
    if (!this.canStartWithBet(bet)) {
      return false;
    }

    this.balance.update((amount) => this.normalizeMoney(amount - bet));
    this.currentBet.set(bet);
    this.multiplier.set(1);
    this.lastCrashMultiplier.set(null);
    this.lastRoundPayout.set(0);
    this.lastOutcome.set('');

    this.score.set(0);
    this.perfectHits.set(0);
    this.consecutivePerfects.set(0);
    this.phase.set('playing');
    return true;
  }

  addScore(points: number): void {
    if (points <= 0) return;
    this.score.update((s) => s + points);
  }

  registerPerfectHit(): void {
    this.perfectHits.update((c) => c + 1);
    this.consecutivePerfects.update((c) => c + 1);
  }

  rewardLanding(isPerfect: boolean): number {
    if (this.phase() !== 'playing' || this.currentBet() <= 0) {
      return 0;
    }

    const rewardRate = isPerfect ? 0.08 : 0.03;
    const reward = this.normalizeMoney(this.currentBet() * rewardRate);
    if (reward <= 0) {
      return 0;
    }

    this.balance.update((amount) => this.normalizeMoney(amount + reward));
    return reward;
  }

  applyLandingMultiplier(isPerfect: boolean): void {
    if (this.phase() !== 'playing') {
      return;
    }

    const gain = 0.3;
    this.multiplier.update((current) => this.normalizeMoney(current + gain));
  }

  cashOut(): number {
    if (this.phase() !== 'playing' || this.currentBet() <= 0) {
      return 0;
    }

    const payout = this.normalizeMoney(this.currentBet() * this.multiplier());
    this.lastRoundPayout.set(payout);
    this.lastOutcome.set(`Cashed out at ${this.multiplier().toFixed(2)}x`);

    this.currentBet.set(0);
    this.multiplier.set(1);
    this.phase.set('menu');
    this.score.set(0);
    this.perfectHits.set(0);
    this.consecutivePerfects.set(0);

    return payout;
  }

  resetConsecutive(): void {
    this.consecutivePerfects.set(0);
  }

  openMenu(): void {
    this.phase.set('menu');
    this.score.set(0);
    this.perfectHits.set(0);
    this.consecutivePerfects.set(0);
    this.currentBet.set(0);
    this.multiplier.set(1);
  }

  finishGame(crashMultiplier = 0.5): void {
    this.phase.set('gameover');
    this.roundsPlayed.update((c) => c + 1);

    const safeCrashMultiplier = Math.min(1, Math.max(0, crashMultiplier));
    const fallbackPayout = this.normalizeMoney(this.currentBet() * safeCrashMultiplier);
    this.lastCrashMultiplier.set(safeCrashMultiplier);
    this.lastRoundPayout.set(fallbackPayout);
    this.lastOutcome.set(`Tower fell, ${safeCrashMultiplier.toFixed(2)}x returned`);

    this.currentBet.set(0);
    this.multiplier.set(1);

    const finalScore = this.score();
    if (finalScore > this.highScore()) {
      this.highScore.set(finalScore);
      this.persistHighScore(finalScore);
    }
  }

  private normalizeMoney(value: number): number {
    return Math.floor(value * 100) / 100;
  }

  private persistHighScore(score: number): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.highScoreStorageKey, String(score));
  }
}