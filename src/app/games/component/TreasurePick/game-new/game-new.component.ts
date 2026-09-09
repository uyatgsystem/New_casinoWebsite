import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SoundService } from '../../../services/sound.service';
import { RulesComponent } from '../rules/rules.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ApiCallService } from '../../../../Services/api-call-service.service';
import { Location } from '@angular/common';
import { ErrorhandlingService } from '../../../../Services/error-handling.service';
import { LoaderService } from '../../../../Services/loader-service.service';
import { UtilsService } from '../../../../Services/utils.service';
import { GameService } from '../../../../Services/game.service';
import { Router } from '@angular/router';

interface Reward {
  type: 'coins' | 'empty';
  amount?: number;
}

interface ChestState {
  id: number;
  opened: boolean;
  reward: Reward;
}

@Component({
  selector: 'app-game-new',
  standalone: true,
  imports: [CommonModule, RulesComponent, ToastrModule],
  templateUrl: './game-new.component.html',
  styleUrls: ['./game-new.component.scss']
})
export class GameNewComponent implements OnInit {
  constructor(
    private soundService: SoundService,
    private apiCallService: ApiCallService,
    private location: Location,
    private errorHandle: ErrorhandlingService,
    private loaderService: LoaderService,
    private utilsService: UtilsService,
    private gameService: GameService,
    private router: Router
    , private toastr: ToastrService

  ) { }

  chests: ChestState[] = [];
  gameActive = false;
  selectedChestId: number | null = null;
  gamePhase: 'select' | 'reveal' | 'finished' = 'select';
  walletSparkle = false;
  selectedChestAnimation: 'none' | 'shake' | 'opened' = 'none';

  // Betting system: only 5, 10, 15, 20
  private _betAmount: number = 5;
  get betAmount(): number {
    return this._betAmount;
  }
  set betAmount(value: number) {
    const allowed = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    this._betAmount = allowed.includes(value) ? value : 5;
    this.updateGameSettings();
  }

  incrementBetAmount(): void {
    const allowed = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const idx = allowed.indexOf(this.betAmount);
    if (idx < allowed.length - 1) {
      const next = allowed[idx + 1];
      if (typeof this.currency === 'number' && next > this.currency) {
        this.toastr.error('Insufficient balance!');
        this.errorHandle.showModalSubject.next(true);
        return;
      }
      this.betAmount = next;
    }
  }
  decrementBetAmount(): void {
    const allowed = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    const idx = allowed.indexOf(this.betAmount);
    if (idx > 0) {
      this.betAmount = allowed[idx - 1];
    }
  }
  getRoundedBalance(): number {
    return this.displayedCurrency;
  }
  // Wallet balance management
  private updateBalance: any;
  get walletBalance(): any {
    return this.updateBalance;
  }
  isBalanceSufficient: boolean = false;
  isGameAllowed: boolean = false;

  gameHost = 'https://treasure-box.pages.dev/houseOfLuck/host.png';
  treasureChest = 'https://treasure-box.pages.dev/houseOfLuck/treasure1.png';
  goldCoins = 'https://treasure-box.pages.dev/houseOfLuck/coin1.png';
  currency = 0;
  displayedCurrency = 0;

  chestDropStates: boolean[] = [];
  shelfBounceIn = false;
  showChests = false;
  flyingReward: { type: string, amount?: number, icon: string, start: DOMRect, end: { x: number, y: number, width: number, height: number } } | null = null;
  rewardAnimationInProgress = false;

  // Getter for selected chest
  get selectedChest(): ChestState | undefined {
    return this.chests.find(c => c.id === this.selectedChestId);
  }

  async ngOnInit() {
    try {
      const saved = this.gameService.getTotalBalance?.();
      if (saved !== undefined && saved !== null) {
        const n = typeof saved === 'string' ? parseFloat(saved) : Number(saved);
        if (!Number.isNaN(n)) this.updateBalance = n;
      }
    } catch { }

    await this.getWalletBalance();
    await this.updateGameSettings();
    this.initializeGame();
  }

  private async updateGameSettings(): Promise<void> {
    const allowed = [5, 10, 15, 20];
    const selectedAmount = allowed.includes(this.betAmount) ? this.betAmount : 5;

    if (this.updateBalance === undefined || this.updateBalance === null) {
      await this.getWalletBalance();
    }

    const bal = this.walletBalance;
    if (typeof bal === 'number') {
      this.isBalanceSufficient = selectedAmount <= bal;
      this.isGameAllowed = this.isBalanceSufficient;
    } else {
      this.isBalanceSufficient = true;
      this.isGameAllowed = true;
    }
  }


  WalletPayload() {
    return {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    }
  }
  //   getWalletBalance(pageNumber: number = 1, searchText: string = '') {
  //     this.loaderService.show();
  //     const CustomerID = localStorage.getItem('customerId');
  //     // let payload = `Wallet/GetWalletBalance?CustomerId=${CustomerID}&PageNumber=${pageNumber}&PageSize=${10}`;
  //     let payload = this.WalletPayload();

  //     // if (searchText.trim()) {
  //     //   payload += `&SearchText=${encodeURIComponent(searchText.trim())}`;
  //     // }

  //     this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe(


  private getWalletBalance(): Promise<void> {
    return new Promise((resolve, reject) => {
      const CustomerID = localStorage.getItem('customerId');
      const payload = this.WalletPayload();

      this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.updateBalance = parseFloat(response.data.totalBalance || 0);
            this.gameService.saveTotalBalance(response.data.totalBalance || 0);
            this.currency = this.updateBalance;
            this.displayedCurrency = this.currency;
            this.utilsService.triggerWalletFunction();
            resolve();
          } else {
            this.errorHandle.handleResponseError(response);
            reject();
          }
        },
        (error) => {
          this.errorHandle.handleHttpError(error);
          reject(error);
        }
      );
    });
  }

  triggerChestDropIn() {
    this.chestDropStates = Array(9).fill(false);
    for (let i = 0; i < this.chests.length; i++) {
      setTimeout(() => {
        this.chestDropStates[i] = true;
        this.soundService.playSound('boxdrop');
      }, i * 180);
    }
  }

  initializeGame() {
    this.showChests = false;
    this.selectedChestId = null;
    this.selectedChestAnimation = 'none';

    // Assign prizes to all chests and shuffle them for randomness
    const prizes = this.getPrizeListForBet(this.betAmount);
    const shuffledPrizes = prizes
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

    this.chests = Array.from({ length: 9 }, (_, i) => ({
      id: i,
      opened: false,
      reward: { type: 'coins', amount: shuffledPrizes[i] }
    }));

    this.gamePhase = 'select';
    this.gameActive = true;

    this.shelfBounceIn = false;
    this.chestDropStates = Array(9).fill(false);

    setTimeout(() => {
      this.shelfBounceIn = true;
      setTimeout(() => {
        this.showChests = true;
        setTimeout(() => {
          this.triggerChestDropIn();
        }, 150);
      }, 1100);
    }, 100);
  }

  isChestOpening: boolean = false;

  handleChestClick(chestId: number) {
    if (
      !this.gameActive ||
      this.gamePhase !== 'select' ||
      this.selectedChestId !== null ||
      this.isChestOpening
    ) return;

    this.isChestOpening = true;
    this.selectedChestId = chestId;
    this.selectedChestAnimation = 'shake'; // Start shaking immediately

    const chest = this.chests.find(c => c.id === chestId);
    if (!chest || chest.opened) {
      this.isChestOpening = false;
      this.selectedChestId = null;
      this.selectedChestAnimation = 'none';
      return;
    }

    // Check balance before proceeding
    if (typeof this.walletBalance === 'number' && this.betAmount > this.walletBalance) {
      this.isBalanceSufficient = false;
      this.isChestOpening = false;
      this.selectedChestId = null;
      this.selectedChestAnimation = 'none';
      this.toastr.error('Insufficient balance!');
      this.errorHandle.showModalSubject.next(true);
      return;
    }

    // Deduct bet amount from wallet on frontend immediately
    this.currency = Math.max(0, this.currency - this.betAmount);
    this.displayedCurrency = this.currency;
    this.updateBalance = this.currency;

    const payload = {
      betType: 'treasure',
      customerId: localStorage.getItem('customerId'),
      bet: this.betAmount,
    };

    this.apiCallService.PostCallWithToken(payload, 'Spinner/CustomerBet').subscribe({
      next: (response) => {
        if (response && response.responseCode === 200) {
          // Override only the opened chest's reward with backend value
          const apiPrize = response.data;
          if (typeof apiPrize === 'number' && apiPrize > 0) {
            chest.reward = { type: 'coins', amount: apiPrize };
          } else {
            chest.reward = { type: 'empty' };
          }

          this.gamePhase = 'reveal';

          if (chest.reward.type === 'coins') {
            this.soundService.playSound('reward');
          } else {
            this.soundService.playSound('lose');
          }
          this.utilsService.triggerWalletFunction();

          // After a short shake, open the chest and show reward
          setTimeout(() => {
            this.selectedChestAnimation = 'opened'; // Switch to open animation
            chest.opened = true;
            setTimeout(() => {
              this.removeSelectedChestAndRevealOthers(chest);
              this.isChestOpening = false;
            }, 400);
          }, 600);

        } else {
          this.errorHandle.handleResponseError(response);
          this.isChestOpening = false;
          this.selectedChestId = null;
          this.selectedChestAnimation = 'none';
          // If API fails, optionally refund the bet on frontend:
          this.currency += this.betAmount;
          this.displayedCurrency = this.currency;
          this.updateBalance = this.currency;
        }
      },
      error: (error) => {
        this.loaderService.hide();
        this.errorHandle.handleHttpError(error);
        this.isChestOpening = false;
        this.selectedChestId = null;
        this.selectedChestAnimation = 'none';
        // If API fails, optionally refund the bet on frontend:
        this.currency += this.betAmount;
        this.displayedCurrency = this.currency;
        this.updateBalance = this.currency;
      }
    });
  }
  private removeSelectedChestAndRevealOthers(chest: ChestState) {
    // Start flying reward animation if not empty
    if (chest.reward.type === 'coins') {
      this.startFlyingRewardAnimation(chest);
    }

    setTimeout(() => {
      this.selectedChestId = null;
      this.selectedChestAnimation = 'none';
    }, 1000);

    setTimeout(() => {
      this.revealRemainingChests();
    }, chest.reward.type === 'coins' ? 1000 : 500);
  }

  private revealRemainingChests() {
    const remainingChests = this.chests.filter(c => c.id !== this.selectedChestId);

    remainingChests.forEach((chest, index) => {
      setTimeout(() => {
        chest.opened = true;
        this.soundService.playSound('boxdrop');
      }, index * 200);
    });

    setTimeout(() => {
      this.finishGame();
    }, remainingChests.length * 200 + 1000);
  }

  private startFlyingRewardAnimation(chest: ChestState) {
    const selectedChestElem = document.querySelector('.selected-chest-container');
    const walletElem = document.querySelector('.wallet-bar');

    if (selectedChestElem && walletElem) {
      const start = selectedChestElem.getBoundingClientRect();
      const end = walletElem.getBoundingClientRect();

      let icon = this.goldCoins;

      this.flyingReward = {
        type: chest.reward.type,
        amount: chest.reward.amount,
        icon,
        start,
        end: {
          x: end.left - start.left,
          y: end.top - start.top,
          width: end.width,
          height: end.height
        }
      };

      this.rewardAnimationInProgress = true;

      setTimeout(() => {
        this.flyingReward = null;
        this.rewardAnimationInProgress = false;
        this.walletSparkle = true;
        this.soundService.playSound('boxdrop');

        setTimeout(() => {
          this.walletSparkle = false;
        }, 900);

        this.updateCurrency(chest);
      }, 3000);
    }
  }

  private updateCurrency(chest: ChestState) {
    let prize = 0;
    if (chest.reward.type === 'coins' && chest.reward.amount) {
      prize = chest.reward.amount;
    }

    if (prize > 0) {
      const startValue = this.currency;
      const endValue = startValue + prize;
      const duration = 800;
      const frameRate = 30;
      const totalFrames = Math.floor(duration / (1000 / frameRate));
      let frame = 0;

      const animateCurrency = () => {
        frame++;
        const progress = Math.min(frame / totalFrames, 1);
        this.displayedCurrency = Math.floor(startValue + (endValue - startValue) * progress);

        if (progress < 1) {
          setTimeout(animateCurrency, 1000 / frameRate);
        } else {
          this.currency = endValue;
          this.displayedCurrency = endValue;
          this.updateBalance = endValue;
          setTimeout(() => {
            this.finishGame();
            // --- Only now, after animation, sync wallet from API ---
            this.getWalletBalance();
          }, 800);
        }
      };

      animateCurrency();
    } else {
      setTimeout(() => {
        this.finishGame();
        // No win, still sync wallet after finish (optional)
        this.getWalletBalance();
      }, 800);
    }
  }

  private finishGame() {
    setTimeout(() => {
      this.selectedChestId = null;
      this.selectedChestAnimation = 'none';
      this.gamePhase = 'finished';
      this.gameActive = false;
    }, 1000);
  }

  showRules = false;

  onInfoClick() {
    this.showRules = true;
  }

  onRulesClosed() {
    this.showRules = false;
  }

  goBack() {
    this.router.navigate(['/dashboard/home']);
  }

  retryGame() {
    this.initializeGame();
  }
  // Prize assignment for each bet
  private getPrizeListForBet(bet: number): number[] {
    if (bet <= 5) return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (bet === 10) return [2, 4, 6, 8, 10, 12, 14, 16, 18];
    if (bet === 15) return [3, 6, 9, 12, 15, 18, 21, 24, 27];
    if (bet === 20) return [4, 8, 12, 16, 20, 24, 28, 32, 36];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9];
  }
}
