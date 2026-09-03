import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit, Component, ElementRef, NgZone,
  OnDestroy, PLATFORM_ID, ViewChild, inject
} from '@angular/core';
import { GameStateService } from '../../services/game-state.service';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';
import { ToastrService } from 'ngx-toastr';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';

type BlockKind = 'base' | 'normal';
type BlockState = 'swinging' | 'falling' | 'stacked' | 'collapsed';

interface TowerBlock {
  id: number;
  kind: BlockKind;
  state: BlockState;
  /** World-space Y (0 = top of world, increases downward). */
  worldY: number;
  x: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  swayOffsetX: number;
}

interface SpriteSet {
  background: HTMLImageElement | null;
  base: HTMLImageElement | null;
  block: HTMLImageElement | null;
}

interface SpriteCrop {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

interface DustParticle {
  x: number;
  worldY: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

@Component({
  selector: 'app-stack-builder',
  imports: [CommonModule],
  templateUrl: './stack-builder.component.html',
  styleUrl: './stack-builder.component.scss'
})
export class StackBuilderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas') private canvasRef!: ElementRef<HTMLCanvasElement>;

  readonly gameState = inject(GameStateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly apiCallService = inject(ApiCallService);
  private readonly errorHandling = inject(ErrorhandlingService);
  private readonly utilsService = inject(UtilsService);
  private readonly toastr = inject(ToastrService);

  betAmount = 10;
  readonly MAX_BET = 50;
  betError = '';
  customerId: number = 0;
  requestId: string = '';
  grainBackdrop: SafeHtml = '';

  constructor(private location: Location, private router: Router) { }
  goBack() {
    this.router.navigateByUrl('/dashboard/home', { replaceUrl: true });
  }
  getRoundedBalance(): number {
    return this.gameState.balance();
  }
  // ─── Physics constants ──────────────────────────────────
  private readonly GRAVITY = 2200;   // px/s²  – snappier falls
  private readonly SWING_AMPLITUDE = 0.40;   // fraction of canvas width
  private readonly SWING_BASE_SPEED = 1.9;    // rad/s
  private readonly SWING_SPEEDUP_AFTER_BOXES = 3;
  private readonly SWING_SPEEDUP_MULTIPLIER = 1.35;
  private readonly CRANE_ROPE_RATIO = 0.18;   // rope length as fraction of canvas height
  private readonly CRANE_PIVOT_Y = 28;     // canvas-space px from top

  // Block sizes as fractions of canvas width
  private readonly NORMAL_W_RATIO = 0.115;
  private readonly NORMAL_H_RATIO = 0.072;
  private readonly BASE_W_RATIO = 0.130;
  private readonly BASE_H_RATIO = 0.094;

  // Tolerances (px)
  private readonly PERFECT_TOL = 9;
  private readonly STABLE_TOL = 12;   // More sensitive (was 24)
  private readonly COLLAPSE_TOL = 28;   // More sensitive (was 48)
  private readonly INSTABILITY_MAX = 50; // More sensitive (was 100)

  // Camera: scroll starts when top block is above this fraction of canvas height
  private readonly SCROLL_TRIGGER_RATIO = 0.50;  // 50% = half screen
  private readonly CAMERA_LERP = 8;      // smoothing speed
  private readonly DUST_MAX_PARTICLES = 220;
  private readonly DUST_GRAVITY = 320;

  // ─── Canvas & world state ───────────────────────────────
  private ctx!: CanvasRenderingContext2D;
  private canvasW = 0;
  private canvasH = 0;

  /**
   * worldOffsetY: how many world-px the camera has scrolled UP.
   * screenY = worldY - worldOffsetY + canvasH   (world grows upward)
   *
   * We store blocks with worldY measured from ground (ground = 0, upward = positive).
   * screenY = canvasH - (worldY - worldOffsetY)
   * => screenY = canvasH - worldY + worldOffsetY
   */
  private worldOffsetY = 0;   // total world height scrolled (px)
  private targetOffsetY = 0;

  // ─── Game objects ───────────────────────────────────────
  private blocks: TowerBlock[] = [];
  private activeBlock: TowerBlock | null = null;

  private swingTime = 0;
  private instability = 0;

  private floatingText = '';
  private floatingTextTimer = 0;
  private floatingTextY = 0;  // screen Y for the float text
  private dustParticles: DustParticle[] = [];
  private isCollapseAnimating = false;
  private collapseTimerId: ReturnType<typeof setTimeout> | null = null;

  // ─── Sprite assets ──────────────────────────────────────
  private readonly images: SpriteSet = { background: null, base: null, block: null };
  private readonly spriteCrops: Record<'base' | 'block', SpriteCrop | null> = {
    base: null,
    block: null
  };
  private readonly assetPaths = {
    background: 'https://cmaxnewimages.pages.dev/assets/newitems/2bg_city.png',
    base: '/image_0.png',
    block: '/block.png'
  };

  // ─── Misc ────────────────────────────────────────────────
  private animId = 0;
  private lastTs = 0;
  private blockIdCtr = 0;
  private readonly onResize = () => this.resizeCanvas();

  // Derived block sizes (updated on resize)
  private normalW = 100;
  private normalH = 62;
  private baseW = 112;
  private baseH = 80;
  private groundWorldY = 0;   // in world coords (stays 0; ground is y=0 in world)

  // ─── Lifecycle ──────────────────────────────────────────
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.grainBackdrop = this.utilsService.getGrainBackdrop();

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', this.onResize);

    this.loadSprites().then(() => {
      this.lastTs = performance.now();
      this.ngZone.runOutsideAngular(() => {
        this.animId = requestAnimationFrame(ts => this.tick(ts));
      });
    });

    this.customerId = Number(localStorage.getItem('customerId')) || 0;
    this.getWalletBalance();
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (typeof globalThis.cancelAnimationFrame === 'function') {
      globalThis.cancelAnimationFrame(this.animId);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize);
    }

    if (this.collapseTimerId !== null) {
      clearTimeout(this.collapseTimerId);
      this.collapseTimerId = null;
    }
  }

  // ─── API Methods ───────────────────────────────────────
  WalletPayload() {
    return {
      customerId: this.customerId,
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
  }

  getWalletBalance(): void {
    const payload = this.WalletPayload();
    this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.gameState.balance.set(response.data.totalBalance);
          this.utilsService.triggerWalletFunction();
        } else {
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.errorHandling.handleResponseError(error);
      }
    });
  }

  placeBetOnGame(): void {
    const payload = {
      betAmount: this.betAmount,
      customerId: this.customerId,
      gameName: 'StackBuilder'
    };

    this.apiCallService.PostCallWithToken(payload, 'BACCHRAT/PlacebetonMinesOrSlot').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.requestId = response.data?.requestId || '';
          // Initialize game after successful bet placement
          this.initializeGameAfterBet();
        } else {
          this.betError = response?.errorMessage || 'Failed to place bet';
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.betError = 'Failed to place bet. Please try again.';
        this.errorHandling.handleResponseError(error);
      }
    });
  }

  cashOutToBackend(numberOfBox: number): void {
    const payout = this.gameState.cashOut();
    if (payout <= 0) return;

    const payload = {
      numberOfBox: numberOfBox,
      customerId: this.customerId,
      betAmount: this.betAmount
    };

    this.apiCallService.PostCallWithToken(payload, 'BACCHRAT/CashOutMines').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          this.resetWorld();
          this.showFloat(`CASHOUT +${payout.toFixed(2)}`, 0);
          this.getWalletBalance();
        } else {
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.errorHandling.handleResponseError(error);
      }
    });
  }

  // ─── Public actions ─────────────────────────────────────
  startFromMenu(): void { this.startGame(); }
  retryGame(): void {
    this.ngZone.run(() => this.gameState.openMenu());
    this.resetWorld();
    this.getWalletBalance();
  }

  cashOut(): void {
    const blocksStacked = this.blocks.filter(b => b.state === 'stacked').length - 1; // Exclude base block
    this.cashOutToBackend(blocksStacked);
  }

  goToMenu(): void {
    this.ngZone.run(() => this.gameState.openMenu());
    this.resetWorld();
    this.getWalletBalance();
  }

  onBetInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const onlyDigits = input.value.replace(/\D/g, '');
    const parsed = Number.parseInt(onlyDigits, 10);
    const clamped = Number.isFinite(parsed) ? Math.min(this.MAX_BET, parsed) : 0;

    input.value = clamped > 0 ? String(clamped) : '';

    if (Number.isFinite(parsed) && parsed > this.MAX_BET) {
      this.betError = `Maximum bet is $${this.MAX_BET}.`;
    }

    this.betAmount = clamped;
  }

  onBetKeyDown(event: KeyboardEvent): void {
    const blockedKeys = ['.', ',', 'e', 'E', '+', '-'];
    if (blockedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onCanvasTap(): void {
    if (this.gameState.phase() !== 'playing') return;
    if (!this.activeBlock || this.activeBlock.state !== 'swinging') return;

    const swingSpeed = this.getCurrentSwingSpeed();

    const swingVel = Math.cos(this.swingTime * swingSpeed)
      * this.SWING_AMPLITUDE * this.canvasW
      * swingSpeed;

    this.activeBlock.state = 'falling';
    this.activeBlock.vx = swingVel * 0.32;
    this.activeBlock.vy = 0;
    this.activeBlock.angularVelocity = this.activeBlock.vx * 0.0018;
  }

  // ─── Resize ─────────────────────────────────────────────
  private resizeCanvas(): void {
    const container = this.canvasRef.nativeElement.parentElement!;
    this.canvasW = container.clientWidth;
    this.canvasH = container.clientHeight;

    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.canvasW;
    canvas.height = this.canvasH;

    // Recalculate block sizes based on canvas width
    this.normalW = Math.floor(this.canvasW * this.NORMAL_W_RATIO);
    this.normalH = Math.floor(this.canvasW * this.NORMAL_H_RATIO);
    this.baseW = Math.floor(this.canvasW * this.BASE_W_RATIO);
    this.baseH = Math.floor(this.canvasW * this.BASE_H_RATIO);

    // Clamp to reasonable sizes
    this.normalW = Math.max(70, Math.min(130, this.normalW));
    this.normalH = Math.max(44, Math.min(80, this.normalH));
    this.baseW = Math.max(80, Math.min(148, this.baseW));
    this.baseH = Math.max(55, Math.min(100, this.baseH));
  }

  // ─── Game loop ──────────────────────────────────────────
  private tick(ts: number): void {
    const dt = Math.min((ts - this.lastTs) / 1000, 0.05);
    this.lastTs = ts;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(t => this.tick(t));
  }

  private update(dt: number): void {
    this.swingTime += dt;
    this.updateDust(dt);

    if (this.floatingTextTimer > 0) {
      this.floatingTextTimer -= dt;
      if (this.floatingTextTimer <= 0) this.floatingText = '';
    }

    if (this.isCollapseAnimating) {
      this.updateCollapse(dt);
      this.updateCamera(dt);
      return;
    }

    switch (this.gameState.phase()) {
      case 'playing': this.updatePlaying(dt); break;
      case 'gameover': this.updateCollapse(dt); break;
    }
  }

  // ─── Playing update ─────────────────────────────────────
  private updatePlaying(dt: number): void {
    this.instability = Math.max(0, this.instability - dt * 4);

    // Sway stacked blocks
    const swayFactor = Math.min(1, this.instability / this.INSTABILITY_MAX);
    for (let i = 1; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      if (b.state !== 'stacked') continue;
      const depth = i / Math.max(1, this.blocks.length - 1);
      b.swayOffsetX = Math.sin(this.swingTime * 2.4 + i * 0.33) * depth * swayFactor * 12;
      b.angle = Math.sin(this.swingTime * 2.1 + i * 0.29) * depth * swayFactor * 0.13;
    }

    // Active block
    if (this.activeBlock) {
      if (this.activeBlock.state === 'swinging') {
        const swingSpeed = this.getCurrentSwingSpeed();
        const swingX = this.canvasW / 2
          + Math.sin(this.swingTime * swingSpeed)
          * this.SWING_AMPLITUDE * this.canvasW;
        this.activeBlock.x = swingX;
        this.activeBlock.angle = Math.sin(this.swingTime * 3.5) * 0.04;
        // worldY stays at spawn worldY (fixed height above top block, NOT camera-relative)
      }

      if (this.activeBlock.state === 'falling') {
        this.activeBlock.vy = Math.min(this.activeBlock.vy + this.GRAVITY * dt, 2000);
        this.activeBlock.worldY -= this.activeBlock.vy * dt;  // worldY increases upward → falling = decrease
        this.activeBlock.x += this.activeBlock.vx * dt;
        this.activeBlock.angle += this.activeBlock.angularVelocity * dt;

        this.checkLanding();
      }
    }

    this.updateCamera(dt);
  }

  // ─── Collision / landing ────────────────────────────────
  private checkLanding(): void {
    if (!this.activeBlock) return;
    const ab = this.activeBlock;

    // Support is the last stacked block
    const support = this.blocks[this.blocks.length - 1];
    if (!support) return;
    const supportTop = support.worldY + support.height / 2;   // top surface world Y
    const activeBottom = ab.worldY - ab.height / 2;             // bottom of active block

    // Only check landing when falling toward the support
    if (ab.vy <= 0) return;   // vy is in world-up units; positive = moving up, negative = falling

    // activeBottom is reaching supportTop
    if (activeBottom > supportTop) return; // hasn't reached yet

    // Check horizontal overlap
    const supportCX = support.x + support.swayOffsetX;
    const signedOff = ab.x - supportCX;
    const horizDist = Math.abs(signedOff);
    const validSpan = ab.width / 2 + support.width / 2;

    if (horizDist >= validSpan - 4) {
      this.triggerCollapse();
      return;
    }

    // Snap to top
    ab.worldY = supportTop + ab.height / 2;
    this.spawnLandingDust(ab.x, supportTop, ab.width);
    this.landBlock(ab, support, supportCX, signedOff);
  }

  private landBlock(ab: TowerBlock, support: TowerBlock, supportCX: number, signedOff: number): void {
    const stackedBeforeLanding = this.getStackedPlayableBlockCount();
    const offset = Math.abs(signedOff);
    const side = signedOff >= 0 ? 1 : -1;
    const isPerfect = offset <= this.PERFECT_TOL;
    const supportMotion = Math.abs(support.swayOffsetX) + Math.abs(support.angle) * support.width;
    const movingTower = supportMotion > 0.9 || this.instability > 4;

    if (isPerfect) ab.x = supportCX;

    ab.state = 'stacked';
    ab.vx = 0;
    ab.vy = 0;
    ab.angularVelocity = 0;
    ab.swayOffsetX = 0;
    ab.angle = 0;

    this.blocks.push(ab);
    this.activeBlock = null;

    let scoreGain = 1;

    if (isPerfect) {
      scoreGain += 1;
      this.ngZone.run(() => this.gameState.registerPerfectHit());
      this.showFloat('PERFECT!', ab.worldY);
      if (movingTower) {
        const carrySide = Math.sign(support.swayOffsetX || signedOff || 1);
        const carriedInstability = 14 + Math.min(18, supportMotion * 0.9);
        this.instability = Math.max(this.instability + 6, carriedInstability);
        ab.swayOffsetX = support.swayOffsetX * 0.92 + carrySide * 1.6;
        ab.angle = support.angle * 0.95 + carrySide * 0.018;
      } else {
        this.instability = Math.max(0, this.instability - 4);
      }
    } else {
      this.ngZone.run(() => this.gameState.resetConsecutive());
      this.instability += Math.max(0, offset - this.PERFECT_TOL) * 0.55;
    }

    if (offset > this.STABLE_TOL) {
      ab.angle = side * Math.min(0.18, (offset / this.normalW) * 0.35);
      ab.swayOffsetX = side * Math.min(10, offset * 0.18);
      this.instability += 14;
    }

    this.ngZone.run(() => {
      this.gameState.addScore(scoreGain);
      this.gameState.applyLandingMultiplier(isPerfect);
      const reward = this.gameState.rewardLanding(isPerfect);
      if (reward > 0 && !isPerfect) {
        this.showFloat(`+${reward.toFixed(2)}`, ab.worldY);
      }
    });

    if (stackedBeforeLanding >= 6 && !isPerfect) {
      this.showFloat('PERFECT REQUIRED AFTER 6', ab.worldY);
      this.triggerCollapse();
      return;
    }

    if (offset > this.COLLAPSE_TOL || this.instability > this.INSTABILITY_MAX) {
      this.triggerCollapse();
      return;
    }

    this.spawnActiveBlock();
  }

  // ─── Camera ─────────────────────────────────────────────
  /**
   * We keep the TOP of the tower at SCROLL_TRIGGER_RATIO of screen height.
   * The world is stored with worldY increasing UPWARD (ground = 0).
   * Screen conversion: screenY = canvasH - (worldY - worldOffsetY)
   *
   * Top block world position: topWorldY = topBlock.worldY + topBlock.height/2
   * We want screenY of top = canvasH * SCROLL_TRIGGER_RATIO
   * canvasH - (topWorldY - worldOffsetY) = canvasH * SCROLL_TRIGGER_RATIO
   * worldOffsetY = topWorldY - canvasH * (1 - SCROLL_TRIGGER_RATIO)
   * But only scroll when tower is tall enough (topWorldY > canvasH * (1 - SCROLL_TRIGGER_RATIO))
   */
  private updateCamera(dt: number): void {
    const topBlock = this.blocks[this.blocks.length - 1];
    if (!topBlock) {
      this.targetOffsetY = 0;
      this.worldOffsetY += (0 - this.worldOffsetY) * Math.min(1, dt * this.CAMERA_LERP);
      if (this.worldOffsetY < 0) this.worldOffsetY = 0;
      return;
    }
    const topWorldY = topBlock.worldY + topBlock.height / 2;

    const threshold = this.canvasH * (1 - this.SCROLL_TRIGGER_RATIO);
    const desired = topWorldY - threshold;

    this.targetOffsetY = Math.max(0, desired);

    const blend = Math.min(1, dt * this.CAMERA_LERP);
    this.worldOffsetY += (this.targetOffsetY - this.worldOffsetY) * blend;
    if (this.worldOffsetY < 0) this.worldOffsetY = 0;
  }

  // ─── World → Screen conversion ──────────────────────────
  /** Convert a world-space Y (0=ground, up=positive) to canvas screen Y (0=top). */
  private toScreenY(worldY: number): number {
    return this.canvasH - (worldY - this.worldOffsetY);
  }

  // ─── Spawn ──────────────────────────────────────────────
  private spawnActiveBlock(): void {
    // The crane always hangs at a FIXED screen position (CRANE_PIVOT_Y + ropeLen).
    // Convert that screen position to world space for the spawn worldY.
    const ropeLen = this.canvasH * this.CRANE_ROPE_RATIO;
    const spawnScreenY = this.CRANE_PIVOT_Y + ropeLen + this.normalH / 2;
    const spawnWorldY = this.canvasH - spawnScreenY + this.worldOffsetY;

    const swingSpeed = this.getCurrentSwingSpeed();
    const x = this.canvasW / 2
      + Math.sin(this.swingTime * swingSpeed) * this.SWING_AMPLITUDE * this.canvasW;

    this.activeBlock = {
      id: ++this.blockIdCtr,
      kind: 'normal',
      state: 'swinging',
      worldY: spawnWorldY,
      x,
      width: this.normalW,
      height: this.normalH,
      vx: 0, vy: 0,
      angle: 0, angularVelocity: 0,
      swayOffsetX: 0
    };
  }

  // ─── Collapse ───────────────────────────────────────────
  private triggerCollapse(): void {
    if (this.gameState.phase() === 'gameover' || this.isCollapseAnimating) return;
    this.isCollapseAnimating = true;

    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i];
      const side = b.x + b.swayOffsetX >= this.canvasW / 2 ? 1 : -1;
      // Stagger energy by height so top pieces peel away first and tower feels natural.
      const intensity = 44 + i * 10 + this.instability * 0.78;
      b.state = 'collapsed';
      b.vx = side * intensity * (0.88 + Math.random() * 0.26);
      b.vy = 120 + i * 12;
      b.angularVelocity = side * (0.9 + i * 0.08);
    }

    if (this.activeBlock) {
      const side = this.activeBlock.x >= this.canvasW / 2 ? 1 : -1;
      this.activeBlock.state = 'collapsed';
      this.activeBlock.vx += side * 95;
      this.activeBlock.vy = 140;
      this.activeBlock.angularVelocity += side * 1.0;
    }

    this.showFloat('TOWER COLLAPSING', this.blocks[this.blocks.length - 1]?.worldY ?? 0);

    if (this.collapseTimerId !== null) {
      clearTimeout(this.collapseTimerId);
    }

    // Show result only after collapse motion has played out.
    this.collapseTimerId = setTimeout(() => {
      this.isCollapseAnimating = false;
      this.ngZone.run(() => {
        this.gameState.finishGame(0.5);
        this.getWalletBalance();
      });
      this.collapseTimerId = null;
    }, 2100);
  }

  private getStackedPlayableBlockCount(): number {
    return Math.max(0, this.blocks.filter(b => b.state === 'stacked').length - 1);
  }

  private getCurrentSwingSpeed(): number {
    const stackedBoxes = this.getStackedPlayableBlockCount();
    if (stackedBoxes >= this.SWING_SPEEDUP_AFTER_BOXES) {
      return this.SWING_BASE_SPEED * this.SWING_SPEEDUP_MULTIPLIER;
    }

    return this.SWING_BASE_SPEED;
  }

  // ─── Collapse physics ───────────────────────────────────
  private updateCollapse(dt: number): void {
    const collapseGravity = this.GRAVITY * 0.72;
    for (const b of this.blocks) {
      if (b.state !== 'collapsed') continue;
      b.vy += collapseGravity * dt;
      b.worldY -= b.vy * dt;
      b.x += b.vx * dt;
      b.angle += b.angularVelocity * dt;
      b.vx *= Math.max(0, 1 - dt * 0.6);
      b.angularVelocity *= Math.max(0, 1 - dt * 0.75);
    }
    if (this.activeBlock?.state === 'collapsed') {
      const a = this.activeBlock;
      a.vy += collapseGravity * dt;
      a.worldY -= a.vy * dt;
      a.x += a.vx * dt;
      a.angle += a.angularVelocity * dt;
      a.vx *= Math.max(0, 1 - dt * 0.6);
      a.angularVelocity *= Math.max(0, 1 - dt * 0.75);
    }
  }

  // ─── Render ─────────────────────────────────────────────
  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);

    this.drawBackground();
    this.drawGround();

    // Draw stacked / collapsed blocks
    for (const b of this.blocks) this.drawBlock(b);

    // Draw active block
    if (this.activeBlock) this.drawBlock(this.activeBlock);

    // Draw landing dust above blocks for better visibility
    this.drawDust();

    // Draw crane (always in screen space)
    // Do not draw the crane/rope during collapse animation (rope should 'cut')
    if (!this.isCollapseAnimating) {
      this.drawCrane();
    }

    // HUD canvas messages
    if (this.gameState.phase() === 'playing') {
      this.drawMsg('TAP TO DROP', this.canvasH * 0.07, 'rgba(255,255,255,0.55)', Math.floor(this.canvasH * 0.030));
    }

    // Floating text
    if (this.floatingText && this.floatingTextTimer > 0) {
      const alpha = Math.min(1, this.floatingTextTimer * 2);
      const yOff = (1 - Math.min(1, this.floatingTextTimer)) * -30;
      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawMsg(this.floatingText, this.canvasH * 0.22 + yOff, '#fde047', Math.floor(this.canvasH * 0.06));
      ctx.restore();
    }
  }

  private drawBackground(): void {
    const img = this.images.background;
    if (img?.complete && img.naturalWidth > 0) {
      const scale = this.canvasH / img.naturalHeight;
      const tw = img.naturalWidth * scale;
      for (let x = 0; x < this.canvasW; x += tw) {
        this.ctx.drawImage(img, x, 0, tw, this.canvasH);
      }
      return;
    }
    const g = this.ctx.createLinearGradient(0, 0, 0, this.canvasH);
    g.addColorStop(0, '#0d1b3e');
    g.addColorStop(1, '#1e3a5f');
    this.ctx.fillStyle = g;
    this.ctx.fillRect(0, 0, this.canvasW, this.canvasH);
  }

  private drawGround(): void {
    const ctx = this.ctx;
    const groundSY = this.toScreenY(0);

    if (groundSY > this.canvasH) return;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundSY, this.canvasW, this.canvasH - groundSY);

    // Road markings
    ctx.fillStyle = '#f59e0b';
    const dashW = 34;
    const dashH = 6;
    const gapX = 58;
    for (let x = 12; x < this.canvasW - 20; x += gapX) {
      ctx.fillRect(x, groundSY + 12, dashW, dashH);
    }
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, groundSY + 26, this.canvasW, 5);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, groundSY + 34, this.canvasW, this.canvasH - (groundSY + 34));
  }

  private drawBlock(b: TowerBlock): void {
    const ctx = this.ctx;
    const sprite = b.kind === 'base' ? this.images.base : this.images.block;
    const crop = b.kind === 'base' ? this.spriteCrops.base : this.spriteCrops.block;
    const sx = b.x + b.swayOffsetX;
    const sy = this.toScreenY(b.worldY);

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(b.angle);

    if (sprite?.complete && sprite.naturalWidth > 0) {
      if (crop) {
        // Draw only opaque sprite content so transparent borders do not skew block alignment.
        ctx.drawImage(sprite, crop.sx, crop.sy, crop.sw, crop.sh, -b.width / 2, -b.height / 2, b.width, b.height);
      } else {
        ctx.drawImage(sprite, -b.width / 2, -b.height / 2, b.width, b.height);
      }
    } else {
      // Fallback shape
      ctx.fillStyle = b.kind === 'base' ? '#64748b' : '#ea580c';
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      const rx = b.width / 2, ry = b.height / 2, r = 6;
      ctx.beginPath();
      ctx.moveTo(-rx + r, -ry);
      ctx.lineTo(rx - r, -ry);
      ctx.quadraticCurveTo(rx, -ry, rx, -ry + r);
      ctx.lineTo(rx, ry - r);
      ctx.quadraticCurveTo(rx, ry, rx - r, ry);
      ctx.lineTo(-rx + r, ry);
      ctx.quadraticCurveTo(-rx, ry, -rx, ry - r);
      ctx.lineTo(-rx, -ry + r);
      ctx.quadraticCurveTo(-rx, -ry, -rx + r, -ry);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Window details
      if (b.kind === 'normal') {
        ctx.fillStyle = 'rgba(147,210,255,0.55)';
        const ws = Math.min(b.width, b.height) * 0.2;
        ctx.fillRect(-ws * 2.2, -ws * 1.1, ws, ws);
        ctx.fillRect(ws * 1.1, -ws * 1.1, ws, ws);
      }
    }

    ctx.restore();
  }

  private drawCrane(): void {
    const ctx = this.ctx;
    const cx = this.canvasW / 2;
    const ropeLen = this.canvasH * this.CRANE_ROPE_RATIO;


    // Rope target
    let ropeTargetX = cx;
    let ropeTargetScreenY: number;

    if (this.activeBlock) {
      ropeTargetX = this.activeBlock.x;
      ropeTargetScreenY = this.toScreenY(this.activeBlock.worldY) - this.activeBlock.height / 2;
    } else {
      ropeTargetScreenY = this.CRANE_PIVOT_Y + ropeLen;
    }

    const ropeStartY = Math.min(this.CRANE_PIVOT_Y + 18, ropeTargetScreenY - 6);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(ropeTargetX, ropeStartY);
    ctx.lineTo(ropeTargetX, ropeTargetScreenY);
    ctx.stroke();

    // Pulley dot
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.arc(cx, this.CRANE_PIVOT_Y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawMsg(text: string, y: number, fill: string, size: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `900 ${size}px 'Oswald', 'Rajdhani', Arial`;
    ctx.textAlign = 'center';
    ctx.lineWidth = Math.max(4, size * 0.18);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeText(text, this.canvasW / 2, y);
    ctx.fillStyle = fill;
    ctx.fillText(text, this.canvasW / 2, y);
    ctx.restore();
  }

  private spawnLandingDust(centerX: number, impactWorldY: number, width: number): void {
    const particleCount = Math.max(22, Math.min(48, Math.floor(width / 3.1)));
    for (let i = 0; i < particleCount; i++) {
      if (this.dustParticles.length >= this.DUST_MAX_PARTICLES) {
        this.dustParticles.shift();
      }

      const spreadX = (Math.random() - 0.5) * width * 1.08;
      const upward = 150 + Math.random() * 260;
      const side = (Math.random() - 0.5) * (180 + width * 1.05);
      const life = 0.52 + Math.random() * 0.55;

      this.dustParticles.push({
        x: centerX + spreadX,
        worldY: impactWorldY - 4,
        vx: side,
        vy: upward,
        size: 6 + Math.random() * 10,
        life,
        maxLife: life,
        alpha: 0.45 + Math.random() * 0.35
      });
    }
  }

  private updateDust(dt: number): void {
    if (this.dustParticles.length === 0) {
      return;
    }

    const drag = Math.max(0, 1 - dt * 4.6);
    this.dustParticles = this.dustParticles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        return false;
      }

      p.vy -= this.DUST_GRAVITY * dt;
      p.worldY += p.vy * dt;
      p.x += p.vx * dt;
      p.vx *= drag;
      return true;
    });
  }

  private drawDust(): void {
    if (this.dustParticles.length === 0) {
      return;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.35)';
    ctx.shadowBlur = 8;
    for (const p of this.dustParticles) {
      const lifeRatio = p.life / p.maxLife;
      const sy = this.toScreenY(p.worldY);
      if (sy < -24 || sy > this.canvasH + 24) {
        continue;
      }

      ctx.globalAlpha = Math.max(0, lifeRatio * p.alpha);
      ctx.fillStyle = lifeRatio > 0.55 ? '#f5f5f4' : '#d6d3d1';
      ctx.beginPath();
      ctx.ellipse(p.x, sy, p.size * (1.45 - lifeRatio * 0.35), p.size * 0.82, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ─── Start / Reset ──────────────────────────────────────
  private startGame(): void {
    const normalizedBet = Number.isFinite(this.betAmount)
      ? Math.min(this.MAX_BET, Math.floor(this.betAmount))
      : 0;
    this.betAmount = normalizedBet;
    if (normalizedBet > this.MAX_BET) {
      this.betError = `Maximum bet is $${this.MAX_BET}.`;
      return;
    }
    if (!this.gameState.canStartWithBet(normalizedBet)) {
      this.betError = 'Invalid bet or insufficient balance.';
      return;
    }

    // Call backend API to place bet
    this.placeBetOnGame();
  }

  private initializeGameAfterBet(): void {
    this.resetWorld();
    const started = this.gameState.startGameWithBet(this.betAmount);
    if (!started) {
      this.betError = 'Unable to start with this bet.';
      return;
    }

    this.betError = '';

    // Base block sits on the ground
    const base: TowerBlock = {
      id: ++this.blockIdCtr,
      kind: 'base',
      state: 'stacked',
      worldY: this.baseH / 2,      // half height above ground (y=0)
      x: this.canvasW / 2,
      width: this.baseW,
      height: this.baseH,
      vx: 0, vy: 0,
      angle: 0, angularVelocity: 0,
      swayOffsetX: 0
    };

    this.blocks.push(base);
    this.spawnActiveBlock();
  }

  private resetWorld(): void {
    this.blocks = [];
    this.activeBlock = null;
    this.dustParticles = [];
    this.worldOffsetY = 0;
    this.targetOffsetY = 0;
    this.instability = 0;
    this.floatingText = '';
    this.floatingTextTimer = 0;
    this.swingTime = 0;
    this.isCollapseAnimating = false;

    if (this.collapseTimerId !== null) {
      clearTimeout(this.collapseTimerId);
      this.collapseTimerId = null;
    }
  }

  // ─── Floating text ──────────────────────────────────────
  private showFloat(text: string, _worldY: number): void {
    this.floatingText = text;
    this.floatingTextTimer = 1.1;
    this.floatingTextY = this.canvasH * 0.22;
  }

  // ─── Assets ─────────────────────────────────────────────
  private loadSprites(): Promise<void> {
    const keys = Object.keys(this.assetPaths) as Array<keyof SpriteSet>;
    const promises = keys.map(k => {
      const img = new Image();
      this.images[k] = img;
      return new Promise<void>(resolve => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = this.assetPaths[k];
      });
    });
    return Promise.all(promises).then(() => {
      this.spriteCrops.base = this.getOpaqueCrop(this.images.base);
      this.spriteCrops.block = this.getOpaqueCrop(this.images.block);
    });
  }

  private getOpaqueCrop(img: HTMLImageElement | null): SpriteCrop | null {
    if (!img || !img.complete || img.naturalWidth <= 0 || img.naturalHeight <= 0) {
      return null;
    }

    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const cctx = c.getContext('2d');
    if (!cctx) {
      return null;
    }

    cctx.drawImage(img, 0, 0);
    const imageData = cctx.getImageData(0, 0, c.width, c.height);
    const pixels = imageData.data;

    let minX = c.width;
    let minY = c.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const alpha = pixels[(y * c.width + x) * 4 + 3];
        if (alpha < 12) {
          continue;
        }
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      sx: minX,
      sy: minY,
      sw: maxX - minX + 1,
      sh: maxY - minY + 1
    };
  }
}
