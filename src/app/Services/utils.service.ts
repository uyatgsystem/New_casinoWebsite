import { isPlatformBrowser } from '@angular/common';
import { EventEmitter, Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import {
  GuideStep,
  UserManualOptions,
  UserManualState,
} from '../Interfaces/interfaces';
import { ErrorhandlingService } from './error-handling.service';
const defaultOptions: UserManualOptions = {
  title: 'Quick Guide',
  closable: true,
  dismissOnBackdrop: true,
  showThumbnails: true,
};
interface DecodedToken {
  exp: number;
  Type: string;
  ID: number;
}
@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  private tokenExpiryTimer: any = null;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private sanitizer: DomSanitizer,
    private errorHandlingService: ErrorhandlingService,
  ) {
    // const originalComplete = this.showComponentSubject.complete.bind(
    //   this.showComponentSubject
    // );
    // this.showComponentSubject.complete = () => {
    //   console.trace('⚠️ showComponentSubject completed!');
    //   originalComplete();
    // };
  }

  public showComponentSubject = new BehaviorSubject<boolean>(false);
  showComponent$ = this.showComponentSubject.asObservable();

  setItem(key: string, value: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(key, value);
    }
  }

  getItem(key: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(key);
    }
    return null;
  }
  // private actionSource = new Subject<void>(); // Can pass data if needed
  private walletFunctionEmitter = new EventEmitter<void>();
  // action$ = this.actionSource.asObservable();
  triggerWalletFunction() {
    this.walletFunctionEmitter.emit();
  }

  getTriggerWalletObservable() {
    return this.walletFunctionEmitter.asObservable();
  }
  private chatReadFunctionEmitter = new EventEmitter<void>();
  // action$ = this.actionSource.asObservable();
  triggerChatReadFunction() {
    this.chatReadFunctionEmitter.emit();
  }

  getTriggerChatReadObservable() {
    return this.chatReadFunctionEmitter.asObservable();
  }
  private chatUnReadCountFunctionEmitter = new EventEmitter<void>();
  // action$ = this.actionSource.asObservable();
  triggerChatUnReadCountFunction() {
    this.chatUnReadCountFunctionEmitter.emit();
  }

  getTriggerChatUnReadCountObservable() {
    return this.chatUnReadCountFunctionEmitter.asObservable();
  }
  private profileImageSubject = new BehaviorSubject<string>(
    'https://cmaxv2images2.pages.dev/assets/avatars/profileimage.png',
  );
  profileImage$ = this.profileImageSubject.asObservable();


  //   Funtion call service use
  private triggerLogoutSubject = new EventEmitter<void>();

  triggerLogoutFunction() {
    this.triggerLogoutSubject.emit();
  }

  getTriggerLogoutObservable() {
    return this.triggerLogoutSubject.asObservable();
  }

  toggleComponentVisibility(show: boolean) {
    // if (this.showComponentSubject.closed) {
    //   console.warn(
    //     'showComponentSubject is closed — recreating new BehaviorSubject'
    //   );
    //   this.showComponentSubject = new BehaviorSubject<boolean>(show);
    //   this.showComponent$ = this.showComponentSubject.asObservable();
    // } else {
    this.showComponentSubject.next(show);
    // }
  }

  setProfileImage(image: string) {
    this.profileImageSubject.next(image);
  }


  //   Funtion call service use
  private triggerGameScoreHistory = new EventEmitter<void>();

  triggerScoreHistory() {
    this.triggerGameScoreHistory.emit();
  }

  getTriggerScoreHistoryObservable() {
    return this.triggerGameScoreHistory.asObservable();
  }

  //   Funtion call service use redeem
  private triggerGameRedeemHistory = new EventEmitter<void>();

  triggerRedeemHistory() {
    this.triggerGameRedeemHistory.emit();
  }

  getTriggerRedeemHistoryObservable() {
    return this.triggerGameRedeemHistory.asObservable();
  }
  //   Funtion call service use Lottery Screen
  private triggerGetLotteryTicket = new EventEmitter<void>();

  triggerLotteryTicket() {
    this.triggerGetLotteryTicket.emit();
  }

  getTriggerLotteryTicketObservable() {
    return this.triggerGetLotteryTicket.asObservable();
  }
  //   Funtion call service use Lottery History
  private triggerGetLotteryHistoryTicket = new EventEmitter<void>();

  triggerLotteryHistoryTicket() {
    this.triggerGetLotteryHistoryTicket.emit();
  }

  getTriggerLotteryTickethistoryObservable() {
    return this.triggerGetLotteryHistoryTicket.asObservable();
  }
  //   Funtion call service use Offer
  private triggerGameOfferHistory = new EventEmitter<void>();

  triggerOfferHistory() {
    this.triggerGameOfferHistory.emit();
  }

  getTriggerOfferHistoryObservable() {
    return this.triggerGameOfferHistory.asObservable();
  }

  redirectToRoute() {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/']);
    }
  }

  gameNameInitials(gameId: number): any {
    let gameInitials: string;
    switch (gameId) {
      case 1:
        gameInitials = 'eg';
        break;
      case 3:
        gameInitials = 'gt';
        break;
      case 4:
        gameInitials = 'jw';
        break;
      case 5:
        gameInitials = 'up';
        break;
      case 6:
        gameInitials = 'vb';
        break;
      case 7:
        gameInitials = 'vs';
        break;
      case 2:
        gameInitials = 'gv';
        break;
      case 8:
        gameInitials = 'gr';
        break;
      case 9:
        gameInitials = 'mw';
        break;
      case 10:
        gameInitials = 'fk';
        break;
      case 11:
        gameInitials = 'os';
        break;
      case 12:
        gameInitials = 'yl';
        break;
      case 13:
        gameInitials = 'cm';
        break;
      default:
        gameInitials = 'non';
    }
    return gameInitials;
  }

  // Lotttery Share Data

  private lotteryDataSubject = new BehaviorSubject<any>(null);
  lotteryData$ = this.lotteryDataSubject.asObservable();

  // Set data securely
  setLotteryData(data: any) {
    this.lotteryDataSubject.next(data);
  }

  // Clear data after use
  clearData() {
    this.lotteryDataSubject.next(null);
  }

  // service code for user manual

  private readonly state$ = new BehaviorSubject<UserManualState>({
    open: false,
    steps: [],
    startIndex: 0,
    options: defaultOptions,
  });

  open(
    steps: GuideStep[],
    startIndex = 0,
    options?: Partial<UserManualOptions>,
  ) {
    const merged: UserManualOptions = { ...defaultOptions, ...(options || {}) };
    this.state$.next({ open: true, steps, startIndex, options: merged });
  }

  close() {
    const v = this.state$.value;
    this.state$.next({ ...v, open: false });
  }

  stateChanges(): Observable<UserManualState> {
    return this.state$.asObservable();
  }

  // getter setter for KYC Values

  private _data: any;
  private _isUpdated = false;

  setData(data: any, isUpdated: boolean): void {
    this._data = data;
    this._isUpdated = isUpdated;
  }

  getData() {
    return {
      data: this._data,
      isUpdated: this._isUpdated,
    };
  }

  //   Funtion call service use KYC Header

  private triggerKYCHeader = new EventEmitter<void>();

  triggerKYCHeaders() {
    this.triggerKYCHeader.emit();
  }

  getTriggerKYCHeaders() {
    return this.triggerKYCHeader.asObservable();
  }

  //////Decode Token and auto logout

  private decodeToken(token: string): DecodedToken {
    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return { exp: 0, Type: '', ID: 0 };
    }
  }

  startTokenExpiryWatcher(): void {
    this.stopTokenExpiryWatcher();

    const token = this.getItem('token');
    if (!token) return;

    const decoded = this.decodeToken(token);
    if (!decoded?.exp) return;

    const expiresInMs = decoded.exp * 1000 - Date.now();

    if (expiresInMs <= 0) {
      setTimeout(() => {
        this.errorHandlingService.refreshToken();
      }, 0);
      return;
    }

    this.tokenExpiryTimer = setTimeout(() => {
      this.errorHandlingService.refreshToken();
    }, expiresInMs);
  }

  stopTokenExpiryWatcher(): void {
    if (this.tokenExpiryTimer) {
      clearTimeout(this.tokenExpiryTimer);
      this.tokenExpiryTimer = null;
    }
  }
  private grainBackdrop = `
      <svg class="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
`;

  getGrainBackdrop(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.grainBackdrop);
  }

  ////Data share function for complete Profile
  private completeProfileDataSubject = new BehaviorSubject<any>(null);
  completeProfileData$ = this.completeProfileDataSubject.asObservable();

  setCompleteProfileData(data: any): void {
    this.completeProfileDataSubject.next(data);
  }

  // ✅ KYC separate subject
  private completeKycDataSubject = new BehaviorSubject<any>(null);
  completekycData$ = this.completeKycDataSubject.asObservable();

  setCompletekycData(data: any): void {
    this.completeKycDataSubject.next(data);
  }

  //////////Wallet Withdraw Pending State


  private isWithdrawPendingSubject = new BehaviorSubject<boolean>(false);
  isWithdrawPending$ = this.isWithdrawPendingSubject.asObservable();

  setWithdrawPending(pending: boolean) {
    this.isWithdrawPendingSubject.next(pending);
  }



  //////////header data share function

  setHeaderData(data: any): void {
    this.headerDataSubject.next(data);
  }
  private headerDataSubject = new BehaviorSubject<any>(null);
  headerData$ = this.headerDataSubject.asObservable();
  getHeaderData(): any {
    return this.headerDataSubject.value;
  }

}
