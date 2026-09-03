import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, PLATFORM_ID, computed, inject } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';
import { PlinkoService } from '../../services/plinko.service';

interface PlinkoResult {
  winSlotIndex: number;
  multiplier: number;
  path: number[];
  winAmount: number;
}

@Component({
  selector: 'app-plinko',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plinko.component.html',
  styleUrls: ['./plinko.component.scss']
})
export class PlinkoComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- Injected Services ---
  public plinkoService = inject(PlinkoService);
  private apiCallService = inject(ApiCallService);
  private errorHandling = inject(ErrorhandlingService);
  private location = inject(Location);
  private platformId = inject(PLATFORM_ID);
  private utilsService = inject(UtilsService);

  title = 'Plinko';
  customerId: number = 0;

  // --- Board / Canvas ---
  @ViewChild('boardCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private animationFrameId: number = 0;
  private width = 0;
  private height = 0;
  private pegs: { x: number; y: number }[] = [];
  ball: { x: number; y: number } | null = null;

  private readonly rowCount = 6;
  private readonly colsPerRow = 7;
  private pegSpacingX = 0;
  private readonly pegSpacingY = 50;

  multipliers = [3, 2, 0, 5, 0, 7];
  isGameRunning = this.plinkoService.isGameRunning;
  lastWinSlotIndex: number | null = null;
  isWaitingForApi = false;
  dropColors: string[] = ['#fef3c7', '#fec866', '#f3a630', '#fe8912', '#d97706', '#b45309'];
  currentBallColor: string = '#ffffff';
  grainBackdrop: SafeHtml = '';

  // Recent drop history (last 12 results)
  recentDrops: { slot: number; multiplier: number; winAmount: number; color: string; bet: number }[] = [];

  // Computed helpers used in template
  availableBalance = computed(() => Math.floor(this.plinkoService.balance()));

  showMobileControls = true;
  isMobileView = false;
  // show a transient local banner when an insufficient-balance error occurs
  showInsufficientBanner = false;
  private resizeListener?: () => void;

  dropDisabled(): boolean {
    const available = Math.floor(this.plinkoService.balance());
    const bet = Math.floor(this.plinkoService.currentBet());
    return this.isGameRunning() || this.isWaitingForApi || available < 1 || bet > available;
  }

  constructor() {
    this.customerId = Number(localStorage.getItem('customerId'));
  }

  ngOnInit() {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.getWalletBalance();
    this.scrollToTopSmooth();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initBoard();
      this.handleResize();
      this.resizeListener = () => { this.initBoard(); this.handleResize(); };
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId);
      if (this.resizeListener) window.removeEventListener('resize', this.resizeListener);
    }
  }
  getRoundedBalance(): number {
    return this.plinkoService.balance();
  }
  // --- Navigation ---
  goBack() {
    try {
      if (window.history && window.history.length > 1) {
        this.location.back();
      } else {
        window.location.href = '/dashboard/home';
      }
    } catch (e) {
      window.location.href = '/dashboard/home';
    }
  }

  // --- Bet Input ---
  onBetInput(value: any) {
    const n = Number(value);
    let v = Number.isFinite(n) ? Math.floor(n) : 1;
    if (v < 1) v = 1;
    this.plinkoService.updateBet(v);
  }

  onBetKeyDown(event: KeyboardEvent) {
    const blocked = ['e', 'E', '.', ',', '+', '-'];
    if (blocked.includes(event.key)) {
      event.preventDefault();
    }
  }

  // --- Wallet ---
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
        if (response.responseCode === 200) {
          this.plinkoService.balance.set(response.data.totalBalance);
        } else {
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.apiCallService.handleError(error);
      }
    });
  }

  // --- API Call ---
  private async fetchGameResult(startIndex: number): Promise<PlinkoResult> {
    const payload = {
      betAmount: this.plinkoService.currentBet(),
      customerId: this.customerId,
      startSlotIndex: startIndex
    };
    const response = await this.apiCallService.PostCallWithToken(payload, 'BACCHRAT/PlayerPlinko').toPromise();
    if (response.responseCode !== 200) {
      throw new Error(response.errorMessage || 'API Error');
    }
    const data = response.data;
    return {
      winSlotIndex: data.finalSlot,
      multiplier: data.multiplier,
      path: data.path,
      winAmount: data.winAmount
    };
  }

  // --- Drop Handler ---
  async onDrop(zoneIndex: number) {
    if (this.isMobileView && this.showMobileControls) {
      this.showMobileControls = false;
    }

    if (this.isGameRunning() || this.isWaitingForApi) return;
    this.lastWinSlotIndex = null;
    this.currentBallColor = this.dropColors[zoneIndex] || '#ffffff';
    if (!this.plinkoService.startGame()) return;
    this.isWaitingForApi = true;
    try {
      const result = await this.fetchGameResult(zoneIndex);
      const startX = (zoneIndex + 0.5) * (this.width / 6);
      this.animateBall(result.path, result.winSlotIndex, startX, result.winAmount);
    } catch (error) {
      console.error('API Error', error);
      this.plinkoService.balance.update(b => b + this.plinkoService.currentBet());
      this.isWaitingForApi = false;
      // If API returned insufficient-balance error, show deposit modal and a top banner
      const msg = (error && (error as any).message) ? (error as any).message : String(error);
      if (typeof msg === 'string' && msg.toLowerCase().includes('insufficient')) {
        this.showInsufficientBanner = true;
        // Auto-open the deposit modal so user can top up immediately
        this.openDeposit();
        setTimeout(() => (this.showInsufficientBanner = false), 6000);
      } else {
        // fallback: show a generic error toast
        this.errorHandling.showAlert('error', msg || 'An error occurred');
      }
    }
  }

  // Open deposit modal (used by banner Deposit button)
  openDeposit(): void {
    this.errorHandling.showModalSubject.next(true);
  }

  // --- Animation ---
  private animateBall(path: number[], finalSlot: number, startX: number, winAmount: number) {
    const points: { x: number; y: number }[] = [];
    let curX = startX;
    let curY = -20;
    points.push({ x: curX, y: curY });
    path.forEach(dir => {
      curX += (dir * this.pegSpacingX) / 2;
      curY += this.pegSpacingY;
      points.push({ x: curX, y: curY });
    });
    const slotWidth = this.width / this.multipliers.length;
    const targetX = finalSlot * slotWidth + slotWidth / 2;
    points.push({ x: targetX, y: this.height + 20 });

    let startTime: number | null = null;
    const duration = 2000;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = (timestamp - startTime) / duration;
      if (progress < 1) {
        const totalSegments = points.length - 1;
        const currentSegment = Math.floor(progress * totalSegments);
        const segmentProgress = (progress * totalSegments) % 1;
        const p1 = points[currentSegment];
        const p2 = points[currentSegment + 1];
        this.ball = {
          x: p1.x + (p2.x - p1.x) * segmentProgress,
          y: p1.y + (p2.y - p1.y) * segmentProgress - Math.sin(segmentProgress * Math.PI) * 12
        };
        this.draw();
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.completeGame(finalSlot, winAmount);
      }
    };
    requestAnimationFrame(animate);
  }

  private completeGame(finalSlot: number, winAmount: number) {
    this.ball = null;
    this.isWaitingForApi = false;
    this.lastWinSlotIndex = finalSlot;
    this.plinkoService.endGame(winAmount);
    this.draw();
    // Push to recent drops history (keep last 12)
    this.recentDrops.unshift({
      slot: finalSlot,
      multiplier: this.multipliers[finalSlot] ?? 0,
      winAmount,
      color: this.getSlotColor(this.multipliers[finalSlot] ?? 0),
      bet: this.plinkoService.currentBet()
    });
    if (this.recentDrops.length > 12) this.recentDrops.pop();
  }

  // --- Board Rendering ---
  private initBoard() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement!;
    this.width = container.clientWidth;
    this.height = this.rowCount * this.pegSpacingY + 60;
    canvas.width = this.width;
    canvas.height = this.height;
    this.ctx = canvas.getContext('2d')!;
    this.pegSpacingX = this.width / this.colsPerRow;
    this.generatePegs();
    this.draw();
  }

  private generatePegs() {
    this.pegs = [];
    for (let row = 0; row < this.rowCount; row++) {
      const isStaggered = row % 2 !== 0;
      const cols = isStaggered ? this.colsPerRow : this.colsPerRow + 1;
      const offsetX = isStaggered ? this.pegSpacingX : this.pegSpacingX / 2;
      for (let col = 0; col < cols - 1; col++) {
        this.pegs.push({ x: offsetX + col * this.pegSpacingX, y: 60 + row * this.pegSpacingY });
      }
    }
  }

  private draw() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.pegs.forEach(peg => {
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = 'rgba(255,255,255,0.1)';
      const pegGrad = this.ctx.createRadialGradient(peg.x - 1, peg.y - 1, 0, peg.x, peg.y, 3);
      pegGrad.addColorStop(0, '#fff0d2');
      pegGrad.addColorStop(1, '#7c3f0a');
      this.ctx.fillStyle = pegGrad;
      this.ctx.beginPath();
      this.ctx.arc(peg.x, peg.y, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
    if (this.ball) {
      const { x: ballX, y: ballY } = this.ball;
      const radius = 10;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = this.currentBallColor;
      const ballGrad = this.ctx.createRadialGradient(ballX - 3, ballY - 3, 2, ballX, ballY, radius);
      ballGrad.addColorStop(0, '#ffffff');
      ballGrad.addColorStop(0.3, this.currentBallColor);
      ballGrad.addColorStop(1, this.adjustBrightness(this.currentBallColor, -50));
      this.ctx.fillStyle = ballGrad;
      this.ctx.beginPath();
      this.ctx.arc(ballX, ballY, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.beginPath();
      this.ctx.arc(ballX - 2, ballY - 2, 3, 0, Math.PI * 2);
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      this.ctx.fill();
    }
  }

  private adjustBrightness(hex: string, percent: number): string {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    r = Math.max(0, Math.min(255, r + r * (percent / 100)));
    g = Math.max(0, Math.min(255, g + g * (percent / 100)));
    b = Math.max(0, Math.min(255, b + b * (percent / 100)));
    return `rgb(${r}, ${g}, ${b})`;
  }

  getSlotColor(m: number): string {
    if (m >= 10) return '#fef3c7';
    if (m >= 5) return '#fec866';
    if (m >= 2) return '#f3a630';
    if (m > 0) return '#fe8912';
    return '#6b7280';
  }

  getMultiplierStyle(index: number, m: number): string {
    // Define unique color gradients for each multiplier with enhanced 3D button appearance
    const colorMap = [
      { top: 'rgba(255, 243, 199, 0.95)', mid: 'rgba(254, 200, 102, 0.92)', bottom: 'rgba(243, 166, 48, 0.98)', light: 'rgba(255, 250, 220, 0.82)', dark: 'rgba(120, 66, 7, 0.82)', glow: 'rgba(254, 200, 102, 0.64)' },
      { top: 'rgba(254, 200, 102, 0.95)', mid: 'rgba(243, 166, 48, 0.92)', bottom: 'rgba(254, 137, 18, 0.98)', light: 'rgba(255, 228, 173, 0.8)', dark: 'rgba(122, 67, 7, 0.84)', glow: 'rgba(243, 166, 48, 0.64)' },
      { top: 'rgba(243, 166, 48, 0.95)', mid: 'rgba(254, 137, 18, 0.92)', bottom: 'rgba(217, 119, 6, 0.98)', light: 'rgba(255, 211, 148, 0.78)', dark: 'rgba(133, 77, 14, 0.84)', glow: 'rgba(254, 137, 18, 0.62)' },
      { top: 'rgba(254, 137, 18, 0.95)', mid: 'rgba(217, 119, 6, 0.92)', bottom: 'rgba(180, 83, 9, 0.98)', light: 'rgba(255, 194, 122, 0.76)', dark: 'rgba(120, 53, 15, 0.84)', glow: 'rgba(217, 119, 6, 0.62)' },
      { top: 'rgba(180, 83, 9, 0.95)', mid: 'rgba(146, 64, 14, 0.9)', bottom: 'rgba(120, 53, 15, 0.98)', light: 'rgba(245, 181, 126, 0.66)', dark: 'rgba(88, 34, 9, 0.88)', glow: 'rgba(180, 83, 9, 0.55)' },
      { top: 'rgba(248, 113, 113, 0.95)', mid: 'rgba(239, 68, 68, 0.9)', bottom: 'rgba(185, 28, 28, 0.98)', light: 'rgba(254, 205, 211, 0.8)', dark: 'rgba(139, 0, 0, 0.8)', glow: 'rgba(239, 68, 68, 0.6)' },
    ];

    const color = colorMap[index % colorMap.length];
    const isWin = this.lastWinSlotIndex === index;

    return `
      position: relative;
      background: linear-gradient(180deg, ${color.top} 0%, ${color.mid} 50%, ${color.bottom} 100%);
      border: 2.5px solid ${isWin ? color.glow : 'rgba(255, 255, 255, 0.4)'};
      border-radius: 0.85rem;
      color: white;
      font-weight: 900;
      cursor: pointer;
      box-shadow:
        0 8px 0 ${color.dark},
        0 6px 12px rgba(0, 0, 0, 0.7),
        0 3px 6px rgba(0, 0, 0, 0.5),
        inset 0 2px 4px ${color.light},
        inset 0 -3px 6px rgba(0, 0, 0, 0.4),
        ${isWin ? `0 0 20px ${color.glow}, 0 0 40px ${color.glow}, 0 0 60px ${color.glow}70` : 'inset 0 1px 0 rgba(255, 255, 255, 0.25)'};
      text-shadow:
        0 4px 8px rgba(0, 0, 0, 0.7),
        0 2px 4px rgba(0, 0, 0, 0.5),
        0 1px 2px rgba(255, 255, 255, 0.4);
      transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
      user-select: none;
    `;
  }

  getBestMultiplier(): number {
    if (!this.recentDrops.length) return 0;
    return Math.max(...this.recentDrops.map(d => d.multiplier));
  }

  getTotalWon(): number {
    return this.recentDrops.reduce((sum, d) => sum + d.winAmount, 0);
  }

  // Toggle mobile control panel
  toggleControls(): void {
    this.showMobileControls = !this.showMobileControls;
  }

  // Slot click handler (visual feedback or future use)
  onSlotClick(slotIndex: number): void {
    // Can be used for animations, previews, or stats
    console.log('Slot clicked:', slotIndex);
  }

  // Update mobile view flag on resize
  private handleResize(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isMobileView = window.innerWidth < 1024;
    if (!this.isMobileView) {
      this.showMobileControls = false;
    }
  }

  private scrollToTopSmooth(): void {
    setTimeout(() => {
      try {
        const scrollElement =
          document.scrollingElement ||
          document.documentElement ||
          document.body;

        scrollElement.scrollTo({
          top: 0,
          behavior: 'smooth'
        });

        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      } catch {
        const scrollElement =
          document.scrollingElement ||
          document.documentElement ||
          document.body;

        scrollElement.scrollTop = 0;
        window.scrollTo(0, 0);
      }
    }, 100);
  }
}
