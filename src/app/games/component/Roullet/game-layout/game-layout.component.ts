
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../services/game.service';
import { ChipSelectorComponent } from '../chip-selector/chip-selector.component';
import { RouletteTableComponent } from '../roulette-table/roulette-table.component';
import { RouletteWheelComponent } from '../roulette-wheel/roulette-wheel.component';
import { BetHistoryComponent } from '../bet-history/bet-history.component';
import { SpinResult } from '../../Baccaret/models/spin-result.model';
import { ResultPopupComponent } from '../result-popup/result-popup.component';
import { ApiCallService } from '../../../../Services/api-call-service.service';
import { LoaderService } from '../../../../Services/loader-service.service';
import { ErrorhandlingService } from '../../../../Services/error-handling.service';
import { UtilsService } from '../../../../Services/utils.service';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-game-layout',
  standalone: true,
  imports: [
    CommonModule,
    ChipSelectorComponent,
    RouletteTableComponent,
    RouletteWheelComponent,
    BetHistoryComponent,
    ResultPopupComponent,

  ],
  templateUrl: './game-layout.component.html',
  styleUrls: ['./game-layout.component.scss']
})
export class GameLayoutComponent {
  gameService = inject(GameService);
  private apiCallService = inject(ApiCallService);
  private loaderService = inject(LoaderService);
  private _errorHandleService = inject(ErrorhandlingService);
  private utilsService = inject(UtilsService);
  private router = inject(Router);
  grainBackdrop: SafeHtml = '';

  showWheel = false;
  lastSpinResult: SpinResult | null = null;
  showResultPopup: boolean = false;
  responseMessageToShow: string | null = null;
  highlightedNumber: number | null = null;
  private spinningPromise: Promise<SpinResult> | null = null;

  // walletAmount is now sourced from GameService.balance()
  // transient balance delta shown after spin
  private balanceBeforeSpin: number = 0;
  balanceDelta: number | null = null;
  showBalanceDelta: boolean = false;

  constructor() {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.getWalletBalance();
    this.scrollToTopSmooth();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/home']);
  }

  getRoundedBalance(): number {
    return this.gameService.balance();
  }

  getWalletBalance(pageNumber: number = 1): void {
    const CustomerID = localStorage.getItem('customerId');
    const payload = this.WalletPayload();
    this.apiCallService.PostCallWithToken(payload, 'Wallet/GetWalletBalance').subscribe(
      (response: any) => {
        if (response && response.responseCode == 200) {
          const parsed = response.data.totalBalance === '' ? this.gameService.balance() : parseFloat(response.data.totalBalance);
          this.gameService.setBalance(parsed as number);
        } else {
          this._errorHandleService.handleResponseError(response);
        }
      },
      (error: any) => {
        this._errorHandleService.handleHttpError(error);
      }
    );
  }

  WalletPayload() {
    const CustomerID = localStorage.getItem('customerId');
    return {
      CustomerId: CustomerID,
      PageNumber: 1,
      PageSize: 10
    };
  }

  async onSpin(): Promise<void> {
    if (!this.gameService.canSpin()) {
      return;
    }

    this.showWheel = true;
    this.highlightedNumber = null;

    // record balance before spin so we can show delta after API updates
    this.balanceBeforeSpin = this.gameService.balance();

    try {
      this.spinningPromise = this.gameService.spin();
      const result = await this.spinningPromise;
      this.lastSpinResult = result;
      // show the result popup
      this.showResultPopup = true;
      // compute balance delta (GameService.spin() updates balanceSignal from API)
      const newBal = this.gameService.balance();
      this.balanceDelta = newBal - this.balanceBeforeSpin;
      if (this.balanceDelta !== 0) {
        this.showBalanceDelta = true;
        setTimeout(() => {
          this.showBalanceDelta = false;
          this.balanceDelta = null;
        }, 4000);
      }
      this.highlightedNumber = result.number;
      this.showWheel = false;
      setTimeout(() => {
        this.highlightedNumber = null;
      }, 4000);
    } catch (error) {
      console.error('Spin failed:', error);
      this.showWheel = false;
    } finally {
      this.spinningPromise = null;
    }
  }

  // Called when ResultPopup emits close
  handleResultPopupClose(): void {
    this.showResultPopup = false;
    if (this.lastSpinResult && (this.lastSpinResult as any).responseMessage) {
      this.responseMessageToShow = (this.lastSpinResult as any).responseMessage;
      // auto-hide message after 5s
      setTimeout(() => (this.responseMessageToShow = null), 5000);
    }
    // clear last result after handling
    this.lastSpinResult = null;
  }

  onClearBets(): void {
    this.gameService.clearBets();
  }

  onWheelSpinComplete(finalNumber: number | null): void {
    this.highlightedNumber = finalNumber;
  }

  get canClearBets(): boolean {
    return this.gameService.currentBets().length > 0 && !this.gameService.isSpinning();
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
