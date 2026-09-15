import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';

// ─────────────────────────────────────────────────────────────────────────────
// REEL: 15 slots
//   0        = Diamond  → green   ×14
//   1 – 7    = numbers  → red     ×2
//   8 – 14   = numbers  → gray    ×2
// ─────────────────────────────────────────────────────────────────────────────
const REEL_SEQ = [1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8] as const;
const REEL_LEN = REEL_SEQ.length; // 15

export type BetColor = 'red' | 'green' | 'gray';

export interface Roll {
  value: number; // 0-14; 0 = diamond
  color: BetColor;
}

interface ColorMeta {
  label: string;
  mult: number;
  primary: string;
  glow: string;
  bg: string;
  border: string;
  activeBg: string;
  activeBorder: string;
  activeGlow: string;
}

export const COLOR_META: Record<BetColor, ColorMeta> = {
  red: {
    label: '×2',
    mult: 2,
    primary: '#ff5555',
    glow: 'rgba(255,70,70,0.55)',
    bg: 'rgba(80,18,18,0.5)',
    border: 'rgba(160,40,40,0.45)',
    activeBg: 'rgba(170,35,35,0.72)',
    activeBorder: '#ff6666',
    activeGlow: 'rgba(255,80,80,0.45)',
  },
  green: {
    label: '×14',
    mult: 14,
    primary: '#44ee88',
    glow: 'rgba(50,210,100,0.55)',
    bg: 'rgba(10,55,25,0.5)',
    border: 'rgba(25,130,65,0.4)',
    activeBg: 'rgba(18,110,55,0.72)',
    activeBorder: '#44ff88',
    activeGlow: 'rgba(50,220,100,0.45)',
  },
  gray: {
    label: '×2',
    mult: 2,
    primary: '#aabbdd',
    glow: 'rgba(140,170,220,0.45)',
    bg: 'rgba(28,38,66,0.5)',
    border: 'rgba(75,95,140,0.4)',
    activeBg: 'rgba(70,90,145,0.72)',
    activeBorder: '#aabbdd',
    activeGlow: 'rgba(140,170,210,0.4)',
  },
};

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-double',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './double.component.html',
  styleUrl: './double.component.scss',
})
export class DoubleComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiCallService);
  private err = inject(ErrorhandlingService);
  private loc = inject(Location);
  private platformId = inject(PLATFORM_ID);
  private utils = inject(UtilsService);

  @ViewChild('reelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private rafId = 0;

  // ── UI state ──
  balance = 0;
  betAmount = 1;
  selectedColor: BetColor = 'red';
  isSpinning = false;
  isWaiting = false;
  resultMessage = 'Place your bet and spin!';
  resultType: 'win' | 'lose' | 'neutral' = 'neutral';
  rolls: Roll[] = [];
  customerId = '';
  showControls = true;
  isMobileView = false;
  showInsufficientBanner = false;
  isFullscreen = false;

  // ── Round / countdown state ──
  roundPhase: 'betting' | 'spinning' | 'result' = 'betting';
  countdown = 7.0;
  betLocked = false; // true once user clicked Bet this round
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private pendingSpinIdx: number | null = null; // reel index received from API
  private pendingWin: {
    winAmount: number;
    mult: number;
    currentBalance: number;
  } | null = null;

  // ── Canvas dimensions ──
  private cW = 700;
  private readonly cH = 150;

  // ── Animation ──
  private offset = 0; // accumulated reel position (pixels)
  private spinFrom = 0;
  private spinDist = 0;
  private spinStart = 0; // performance.now() when spin began
  private spinDur = 3800;
  private lastTs = 0; // last RAF timestamp for idle scroll
  /** px/ms — slow leftward idle drift (cards creep left continuously) */
  private readonly IDLE_SPEED = 0.045;

  // ── Flash effect ──
  private flashA = 0;
  private flashC = '#ff4444';

  // ── Constants ──
  readonly TW = 118; // tile width px
  readonly FULL_ROT = REEL_LEN * this.TW; // 1770 px
  readonly COLOR_META = COLOR_META;
  readonly betColors: BetColor[] = ['red', 'green', 'gray'];

  private resizeListener?: () => void;

  // ─────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────

  ngOnInit() {
    this.customerId = localStorage.getItem('customerId') || '';
    this.loadBalance();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.resize();
      this.resizeListener = () => this.resize();
      window.addEventListener('resize', this.resizeListener);
      this.startLoop();
      this.startBettingPhase();
    }
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId);
    this.stopCountdown();
    if (this.resizeListener)
      window.removeEventListener('resize', this.resizeListener);
    // Trigger wallet balance update in header before leaving
    this.utils.triggerWalletFunction();
  }

  // ─────────────────────────────────────────────────────
  // Countdown / round management
  // ─────────────────────────────────────────────────────

  private startBettingPhase() {
    this.roundPhase = 'betting';
    this.countdown = 7.0;
    this.betLocked = false;
    this.pendingSpinIdx = null;
    this.pendingWin = null;
    this.resultType = 'neutral';
    this.resultMessage = 'Rolling In 7.0s';

    this.countdownInterval = setInterval(() => {
      this.countdown = parseFloat(Math.max(0, this.countdown - 0.1).toFixed(1));
      this.resultMessage = `Rolling In ${this.countdown.toFixed(1)}s`;
      if (this.countdown <= 0) {
        this.stopCountdown();
        this.triggerAutoSpin();
      }
    }, 100);
  }

  private stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /** Resume the countdown from wherever it was paused. */
  private resumeCountdown() {
    if (this.countdownInterval) return; // already running
    if (this.roundPhase !== 'betting') return;
    this.countdownInterval = setInterval(() => {
      this.countdown = parseFloat(Math.max(0, this.countdown - 0.1).toFixed(1));
      this.resultMessage = `Rolling In ${this.countdown.toFixed(1)}s`;
      if (this.countdown <= 0) {
        this.stopCountdown();
        this.triggerAutoSpin();
      }
    }, 100);
  }

  private triggerAutoSpin() {
    this.roundPhase = 'spinning';
    this.resultType = 'neutral';
    this.resultMessage = 'Rolling...';
    const idx = this.pendingSpinIdx ?? Math.floor(Math.random() * REEL_LEN);
    this.kickSpin(idx);
  }

  // ─────────────────────────────────────────────────────
  // Canvas setup
  // ─────────────────────────────────────────────────────

  private resize() {
    const c = this.canvasRef?.nativeElement;
    if (!c) return;
    const parent = c.parentElement;
    if (parent) this.cW = parent.clientWidth;
    c.width = this.cW;
    c.height = this.cH;
    this.ctx = c.getContext('2d')!;
    this.isMobileView = window.innerWidth < 1024;
    if (!this.isMobileView) this.showControls = true;
  }

  // ─────────────────────────────────────────────────────
  // Render loop
  // ─────────────────────────────────────────────────────

  private startLoop() {
    const loop = (ts: number) => {
      this.tick(ts);
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private tick(ts: number) {
    const dt = this.lastTs > 0 ? ts - this.lastTs : 0;
    this.lastTs = ts;

    if (this.isSpinning && this.spinStart > 0) {
      // Driven spin: easeOutCubic to target
      const t = Math.min((ts - this.spinStart) / this.spinDur, 1);
      const e = this.easeOutCubic(t);
      this.offset = this.spinFrom + this.spinDist * e;
      if (t >= 1) {
        this.isSpinning = false;
        this.spinStart = 0;
        this.finalize();
      }
    } else if (this.roundPhase === 'spinning') {
      // Still in spinning phase but eased spin just finished — keep ticking until finalize runs
      // (no-op: finalize is called above when t>=1)
    }
    // betting / result phases: reel is frozen — no idle drift
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  // ─────────────────────────────────────────────────────
  // Draw
  // ─────────────────────────────────────────────────────

  private draw() {
    const ctx = this.ctx;
    if (!ctx) return;
    const W = this.cW,
      H = this.cH;

    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1c2448');
    bg.addColorStop(1, '#0d1228');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2;
    const TW = this.TW;
    const padV = 12;
    const TH = H - padV * 2;
    const TY = padV;

    // Current center tile (fractional)
    const cf = this.offset / TW;
    const ci = Math.round(cf);
    const nSide = Math.ceil(W / (2 * TW)) + 2;

    for (let i = ci - nSide; i <= ci + nSide; i++) {
      const ri = ((i % REEL_LEN) + REEL_LEN) % REEL_LEN;
      const val = REEL_SEQ[ri];
      const col = this.getColor(val);
      const rawX = cx + (i - cf) * TW - TW / 2;
      const gap = 7;
      const drawX = rawX + gap / 2;
      const drawW = TW - gap;

      if (drawX + drawW < 0 || drawX > W) continue;

      const midX = drawX + drawW / 2;
      const dist = Math.abs(midX - cx);
      const prox = Math.max(0, 1 - dist / (W * 0.48));
      const scale = 0.58 + 0.42 * prox;
      const alpha = 0.3 + 0.7 * prox;

      const tW = drawW * scale;
      const tH = TH * scale;
      const tX = drawX + (drawW - tW) / 2;
      const tY = TY + (TH - tH) / 2;

      this.drawTile(ctx, val, col, tX, tY, tW, tH, alpha, i === ci);
    }

    // Edge fades
    this.drawEdgeFade(ctx, W, H);

    // Center indicator
    this.drawCenterIndicator(ctx, W, H);

    // Flash overlay
    if (this.flashA > 0) {
      ctx.save();
      ctx.globalAlpha = this.flashA * 0.28;
      ctx.fillStyle = this.flashC;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      this.flashA = Math.max(0, this.flashA - 0.022);
    }
  }

  // ─────────────────────────────────────────────────────
  // Draw helpers
  // ─────────────────────────────────────────────────────

  private drawTile(
    ctx: CanvasRenderingContext2D,
    val: number,
    col: BetColor,
    x: number,
    y: number,
    w: number,
    h: number,
    alpha: number,
    isCenter: boolean,
  ) {
    const R = 13;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Glow shadow
    if (isCenter) {
      const gc =
        col === 'red' ? '#ff5555' : col === 'green' ? '#44ff99' : '#99aacc';
      ctx.shadowColor = gc;
      ctx.shadowBlur = this.flashA > 0.3 ? 55 : 24;
    }

    // Main gradient
    let [c0, c1, c2]: [string, string, string] = ['', '', ''];
    if (col === 'red') {
      [c0, c1, c2] = isCenter
        ? ['#ff7060', '#dd2828', '#991100']
        : ['#6b1c1c', '#3a1010', '#1d0808'];
    } else if (col === 'green') {
      [c0, c1, c2] = isCenter
        ? ['#55ee99', '#00bb55', '#007733']
        : ['#1a6838', '#0e4020', '#071810'];
    } else {
      [c0, c1, c2] = isCenter
        ? ['#8a9bc0', '#445577', '#293a5a']
        : ['#2a3550', '#192440', '#101828'];
    }

    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, c0);
    g.addColorStop(0.52, c1);
    g.addColorStop(1, c2);
    this.rrect(ctx, x, y, w, h, R);
    ctx.fillStyle = g;
    ctx.fill();

    // Top sheen
    const sh = ctx.createLinearGradient(x, y, x, y + h * 0.45);
    sh.addColorStop(0, 'rgba(255,255,255,0.24)');
    sh.addColorStop(1, 'rgba(255,255,255,0)');
    this.rrect(ctx, x + 2, y + 2, w - 4, h * 0.45, R - 2);
    ctx.fillStyle = sh;
    ctx.fill();

    // Border
    this.rrect(ctx, x, y, w, h, R);
    ctx.strokeStyle = isCenter
      ? 'rgba(255,255,255,0.55)'
      : 'rgba(255,255,255,0.11)';
    ctx.lineWidth = isCenter ? 2 : 1;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Content
    if (val === 0) {
      this.drawDiamond(ctx, x + w / 2, y + h / 2, h * 0.42, isCenter);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(h * (isCenter ? 0.48 : 0.44))}px "Inter","Segoe UI",Arial,sans-serif`;
      if (isCenter) {
        ctx.shadowColor = 'rgba(255,255,255,0.55)';
        ctx.shadowBlur = 9;
      }
      ctx.fillText(String(val), x + w / 2, y + h / 2 + 1);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  private drawDiamond(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    bright: boolean,
  ) {
    const w = size * 1.22;
    const h = size * 1.08;
    ctx.save();

    // Body
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.5); // top point
    ctx.lineTo(cx + w * 0.5, cy - h * 0.08); // right shoulder
    ctx.lineTo(cx + w * 0.38, cy + h * 0.5); // right bottom
    ctx.lineTo(cx - w * 0.38, cy + h * 0.5); // left bottom
    ctx.lineTo(cx - w * 0.5, cy - h * 0.08); // left shoulder
    ctx.closePath();

    const dg = ctx.createLinearGradient(
      cx - w / 2,
      cy - h / 2,
      cx + w / 2,
      cy + h / 2,
    );
    if (bright) {
      dg.addColorStop(0, '#edfff5');
      dg.addColorStop(0.22, '#aaffcc');
      dg.addColorStop(0.6, '#00ee66');
      dg.addColorStop(1, '#007733');
    } else {
      dg.addColorStop(0, '#88bbaa');
      dg.addColorStop(0.5, '#226644');
      dg.addColorStop(1, '#0e3322');
    }
    ctx.fillStyle = dg;
    ctx.fill();

    // Facet lines
    const fc = bright ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.22)';
    ctx.strokeStyle = fc;
    ctx.lineWidth = 1;

    // Crown girdle (horizontal)
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, cy - h * 0.08);
    ctx.lineTo(cx, cy - h * 0.08);
    ctx.lineTo(cx + w * 0.5, cy - h * 0.08);
    ctx.stroke();

    // Center axis (vertical)
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.5);
    ctx.lineTo(cx, cy + h * 0.5);
    ctx.stroke();

    // Inner diagonal facets
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.5, cy - h * 0.08);
    ctx.lineTo(cx - w * 0.28, cy + h * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + w * 0.5, cy - h * 0.08);
    ctx.lineTo(cx + w * 0.28, cy + h * 0.5);
    ctx.stroke();

    // Glow for bright state
    if (bright) {
      ctx.shadowColor = '#44ff88';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(100,255,160,0.5)';
      this.drawDiamondOutline(ctx, cx, cy, w, h);
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  private drawDiamondOutline(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    w: number,
    h: number,
  ) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.5);
    ctx.lineTo(cx + w * 0.5, cy - h * 0.08);
    ctx.lineTo(cx + w * 0.38, cy + h * 0.5);
    ctx.lineTo(cx - w * 0.38, cy + h * 0.5);
    ctx.lineTo(cx - w * 0.5, cy - h * 0.08);
    ctx.closePath();
    ctx.stroke();
  }

  private drawEdgeFade(ctx: CanvasRenderingContext2D, W: number, H: number) {
    const fade = W * 0.2;
    const bg = '#0d1228';

    const gl = ctx.createLinearGradient(0, 0, fade, 0);
    gl.addColorStop(0, bg);
    gl.addColorStop(1, 'rgba(13,18,40,0)');
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, fade, H);

    const gr = ctx.createLinearGradient(W - fade, 0, W, 0);
    gr.addColorStop(0, 'rgba(13,18,40,0)');
    gr.addColorStop(1, bg);
    ctx.fillStyle = gr;
    ctx.fillRect(W - fade, 0, fade, H);
  }

  private drawCenterIndicator(
    ctx: CanvasRenderingContext2D,
    W: number,
    H: number,
  ) {
    const cx = W / 2;

    // Glowing vertical line
    const lg = ctx.createLinearGradient(0, 0, 0, H);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.18, 'rgba(255,255,255,0.88)');
    lg.addColorStop(0.82, 'rgba(255,255,255,0.88)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 7;
    ctx.strokeStyle = lg as any;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Top arrow
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.moveTo(cx, 11);
    ctx.lineTo(cx - 9, 0);
    ctx.lineTo(cx + 9, 0);
    ctx.closePath();
    ctx.fill();

    // Bottom arrow
    ctx.beginPath();
    ctx.moveTo(cx, H - 11);
    ctx.lineTo(cx - 9, H);
    ctx.lineTo(cx + 9, H);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  /** Axis-aligned rounded rect path (no stroke/fill — caller decides). */
  private rrect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ) {
    const R = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + R, y);
    ctx.arcTo(x + w, y, x + w, y + h, R);
    ctx.arcTo(x + w, y + h, x, y + h, R);
    ctx.arcTo(x, y + h, x, y, R);
    ctx.arcTo(x, y, x + w, y, R);
    ctx.closePath();
  }

  // ─────────────────────────────────────────────────────
  // Spin logic
  // ─────────────────────────────────────────────────────

  /** Called when spin finishes – reads result from reel offset */
  private finalize() {
    // Keep the jittered offset as-is so the bar sits off-centre naturally.
    // Math.round still correctly identifies the tile as long as jitter < ±0.5 TW.
    const norm =
      ((this.offset % this.FULL_ROT) + this.FULL_ROT) % this.FULL_ROT;
    const ri = Math.round(norm / this.TW) % REEL_LEN;
    const val = REEL_SEQ[ri];
    const col = this.getColor(val);

    this.rolls.unshift({ value: val, color: col });
    if (this.rolls.length > 24) this.rolls.pop();

    const valDisplay = val === 0 ? '◆' : String(val);
    const won = col === this.selectedColor;
    const mult = COLOR_META[col].mult;

    // ✅ Show result messages but DON'T update balance yet
    if (this.betLocked) {
      if (this.pendingWin) {
        // Real bet — show result message only
        const { winAmount } = this.pendingWin;
        if (winAmount > 0) {
          this.resultType = 'win';
          this.resultMessage = `Rolled ${valDisplay}! You won $${winAmount.toFixed(2)} (×${mult})`;
        } else {
          this.resultType = 'lose';
          this.resultMessage = `Rolled ${valDisplay}! Better luck next time`;
        }
        // ❌ DON'T update balance here - let triggerWalletFunction handle it
      } else {
        // Demo bet
        if (this.betAmount > 0) this.balance -= this.betAmount;
        this.resultType = won ? 'win' : 'lose';
        this.resultMessage = won
          ? `Rolled ${valDisplay}! You won ×${mult}`
          : `Rolled ${valDisplay}! Better luck next time`;
      }
    } else {
      this.resultType = 'neutral';
      this.resultMessage = `Rolled ${valDisplay}!`;
    }

    this.roundPhase = 'result';

    const flashColors: Record<BetColor, string> = {
      red: '#ff4444',
      green: '#44ff88',
      gray: '#8899cc',
    };
    this.flashC = flashColors[col];
    this.flashA = 1;
    this.isWaiting = false;
    this.isSpinning = false;

    // ✅ Clear pending win data
    this.pendingWin = null;

    // ✅ After 3.5s: refresh wallet (which will fetch updated balance from server) and start next round
    setTimeout(() => {
      this.utils.triggerWalletFunction(); // ← This fetches fresh balance from server
      this.loadBalance(); // ← Also refresh local balance
      this.startBettingPhase();
    }, 3500);
  }

  /** Kick off the reel spin animation to land on `targetIdx`. */
  private kickSpin(targetIdx: number) {
    // Normalise current offset into [0, FULL_ROT)
    const curNorm =
      ((this.offset % this.FULL_ROT) + this.FULL_ROT) % this.FULL_ROT;
    // Random sub-tile jitter: ±32 % of tile width so bar looks natural
    const jitter = (Math.random() - 0.5) * this.TW * 0.64;
    const tgtNorm = targetIdx * this.TW + jitter;
    // How far forward (left) we need to travel to reach target
    let diff = (tgtNorm - curNorm + this.FULL_ROT) % this.FULL_ROT;
    // Guarantee at least 3 full extra rotations so the spin always goes left
    this.spinFrom = this.offset;
    this.spinDist = 2 * this.FULL_ROT + diff; // always positive → always left
    this.spinDur = 12000;
    this.spinStart = performance.now();
    this.isSpinning = true;
  }

  // ─────────────────────────────────────────────────────
  // Public UI handlers
  // ─────────────────────────────────────────────────────

  placeBet() {
    if (this.isBetDisabled()) return;

    const isDemo = this.betAmount === 0;

    if (!isDemo) {
      if (this.betAmount > this.balance) {
        this.err.showAlert('error', 'Insufficient balance');
        return;
      }
    }

    this.betLocked = true;

    if (isDemo) {
      // Reserve a random index for demo — spin fires when countdown ends
      this.pendingSpinIdx = Math.floor(Math.random() * REEL_LEN);
      return;
    }
    this.balance -= this.betAmount;

    // Real bet → call API now, store result; spin fires when countdown ends
    this.isWaiting = true;
    this.stopCountdown(); // pause timer while confirming
    this.resultMessage = 'Confirming...';
    const payload = {
      customerId: this.customerId,
      betAmount: this.betAmount,
      selectedColor: this.selectedColor,
    };

    this.api
      .PostCallWithToken(payload, 'BACCHRAT/DoubleGame/PlaceBet')
      .subscribe({
        next: (r) => {
          if (r.responseCode === 200) {
            this.pendingWin = {
              winAmount: r.data.winAmount,
              mult: r.data.multiplier,
              currentBalance: r.data.currentBalance,
            };
            this.pendingSpinIdx = r.data.resultIndex;
            this.isWaiting = false;
            this.resultMessage = `Bet Placed! Rolling In ${this.countdown.toFixed(1)}s`;
            this.resumeCountdown(); // resume timer now that bet is confirmed
          } else {
            this.balance += this.betAmount; // restore on rejection
            this.betLocked = false;
            this.pendingSpinIdx = null;
            this.isWaiting = false;
            this.resumeCountdown(); // resume timer on API rejection
            this.err.handleResponseError(r);
          }
        },
        error: (e) => {
          this.balance += this.betAmount; // restore on network error
          this.betLocked = false;
          this.pendingSpinIdx = null;
          this.isWaiting = false;
          this.resumeCountdown(); // resume timer on network error
          const msg = e?.message ?? '';
          if (
            typeof msg === 'string' &&
            msg.toLowerCase().includes('insufficient')
          ) {
            this.showInsufficientBanner = true;
            this.err.showModalSubject.next(true);
            setTimeout(() => (this.showInsufficientBanner = false), 6000);
          } else {
            this.api.handleError(e);
          }
        },
      });
  }

  // ─────────────────────────────────────────────────────
  // Bet helpers
  // ─────────────────────────────────────────────────────

  setHalf() {
    this.betAmount = Math.max(0, Math.floor(this.betAmount / 2));
  }
  setDouble() {
    const max = Math.floor(this.balance);
    this.betAmount = Math.min(max, (this.betAmount || 1) * 2);
  }
  setPreset(v: number) {
    this.betAmount = Math.min(Math.floor(this.balance), v);
  }
  selectColor(c: BetColor) {
    if (!this.isSpinning && !this.isWaiting && !this.betLocked)
      this.selectedColor = c;
  }
  toggleControls() {
    this.showControls = !this.showControls;
  }

  // ─────────────────────────────────────────────────────
  // Wallet
  // ─────────────────────────────────────────────────────

  private loadBalance() {
    const p = {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
    this.api.PostCallWithToken(p, 'Wallet/GetWalletBalance').subscribe({
      next: (r) => {
        if (r.responseCode === 200) {
          this.balance = r.data.totalBalance;
          this.utils.triggerWalletFunction(); // ← Add this line
        }
      },
      error: (e) => this.api.handleError(e),
    });
  }

  // ─────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────

  goBack() {
    this.loadBalance();
    try {
      window.history?.length > 1
        ? this.loc.back()
        : (window.location.href = '/dashboard/home');
    } catch {
      window.location.href = '/dashboard/home';
    }
  }

  toggleFullscreen() {
    if (!isPlatformBrowser(this.platformId)) return;

    const elem = document.documentElement;

    if (!this.isFullscreen) {
      // Enter fullscreen
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
      this.isFullscreen = true;
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      this.isFullscreen = false;
    }
  }

  // ─────────────────────────────────────────────────────
  // Template helpers
  // ─────────────────────────────────────────────────────

  getColor(val: number): BetColor {
    if (val === 0) return 'green';
    return val <= 7 ? 'red' : 'gray';
  }

  get floorBalance() {
    return Number(this.balance).toFixed(2);
  }

  getRollStyle(r: Roll): string {
    if (r.color === 'red') {
      return 'background: linear-gradient(135deg,#aa2222,#660000); box-shadow: 0 0 6px rgba(255,60,60,0.35);';
    }
    if (r.color === 'green') {
      return 'background: linear-gradient(135deg,#117733,#004422); box-shadow: 0 0 6px rgba(50,200,100,0.35);';
    }
    return 'background: linear-gradient(135deg,#2a3a5a,#18253a); box-shadow: 0 0 4px rgba(80,100,160,0.3);';
  }

  getBetButtonLabel(): string {
    if (this.isWaiting) return 'Confirming...';
    if (this.betLocked) return 'Bet Placed';
    if (this.roundPhase === 'spinning') return 'Rolling...';
    if (this.roundPhase === 'result') return 'Next Round...';
    return 'Place Bet';
  }

  isBetDisabled(): boolean {
    return (
      this.isSpinning ||
      this.isWaiting ||
      this.betLocked ||
      this.roundPhase !== 'betting'
    );
  }

  /** Fraction 0–1 for the countdown progress bar */
  get countdownFraction(): number {
    return this.countdown / 7.0;
  }
}
