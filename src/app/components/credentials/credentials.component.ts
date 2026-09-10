import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  FormsModule,
} from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { GameService } from '../../Services/game.service';
import { GameCard } from '../../Interfaces/interfaces';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { ToastrService } from 'ngx-toastr';
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faCopy,
  faPlus,
  faCross,
  faXmark,
  faDownload,
  faCheck,
  faChevronLeft,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { LoaderComponent } from '../loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { LocalTimePipe } from '../../Pipes/local-time.pipe';
import { UtilsService } from '../../Services/utils.service';
import { Subject, interval, takeUntil } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { AddRedeemComponent } from '../../common/add-redeem/add-redeem.component';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-credentials',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    FontAwesomeModule,
    LoaderComponent,
    LocalTimePipe,
    AddRedeemComponent,
    FormsModule,
  ],
  templateUrl: './credentials.component.html',
  styleUrl: './credentials.component.scss',
})
export class CredentialsComponent implements OnInit, OnDestroy {
  selectedGame: any;
  scoreForm: FormGroup;
  paymentForm: FormGroup;
  captchaForm: FormGroup;
  grainBackdrop: SafeHtml = '';
  showAddScoreModal = false;
  showChangeAccountModal = false;
  showDeleteConfirmModal = false;
  showPaymentModal = false;
  showCaptchaModal = false;
  isDeletingAccount = false;
  IsOnUpdate = false;
  showicon = faEye;
  hideicon = faEyeSlash;
  totalBalance: string = '100';
  showBalance: boolean = false;
  User = faUser;
  eye = faEye;
  eyeSlash = faEyeSlash;
  copy = faCopy;
  plus = faPlus;
  cross = faXmark;
  Download = faDownload;
  Lock = faLock;
  faCheck = faCheck;
  refresh = faRotateRight;
  leftArrow = faChevronLeft;
  captchaImage = '/assets/captcha.png';

  history = [
    { date: '25th April 20204', time: '08:30 PM', score: '2.2' },
    { date: '5th Sept. 20204', time: '08:00 PM', score: '5.55' },
  ];

  gameAccounts = [
    {
      id: 1,
      gameName: 'Overwatch 2',
      username: 'OverwatchPro111',
      password: 'OverwatchPass111!',
      iconUrl: '/Images/game/Dragon.png',
      isPasswordVisible: false,
      isUsernameVisible: false,
    },
  ];
  visibleGameAccounts: any[] = [];
  getPlaceholder(): string {
    switch (this.gameName) {
      case 'GameRoom':
        return 'e.g 10';
      case 'MilkyWay':
        return 'e.g 10';
      case 'OrionStar':
        return 'e.g 10';
      case 'FireKirin':
        return 'e.g 10';
      default:
        return 'e.g 10';
    }
  }

  playerName?: any;
  playerPassword?: any;
  isPasswordVisible: boolean = false;
  gameName?: any;
  gameID?: any;
  gameUserID?: any;
  downloadLink: any;
  GameData?: any;
  constructor(
    private fb: FormBuilder,
    private Gameservice: GameService,
    private apicallservice: ApiCallService,
    private ErroHandling: ErrorhandlingService,
    private Toaster: ToastrService,
    private utilsService: UtilsService,
    private loaderService: LoaderService,
    private location: Location,
    private router: Router,
  ) {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    // this.playerName = localStorage.getItem('PN');
    // this.playerPassword = localStorage.getItem('PP');
    this.gameName = localStorage.getItem('GN');
    // this.gameID = localStorage.getItem('GI');
    this.GameData = this.Gameservice.getGameData();

    this.scoreForm = this.fb.group({
      score: [
        '',
        [
          Validators.required,
          Validators.min(1),
          // Validators.max(1000),
          this.integerValidator.bind(this),
        ],
      ],
    });

    this.paymentForm = this.fb.group({
      purchase: ['', Validators.required],
      confirmScore: ['', Validators.required],
    });

    this.captchaForm = this.fb.group({
      captcha: ['', Validators.required],
    });
  }

  goBack() {
    this.location.back();
  }

  integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    const gamesToRound = ['GameRoom', 'MilkyWay', 'OrionStar', 'FireKirin'];
    if (gamesToRound.includes(this.gameName)) {
      if (Number.isInteger(value)) {
        return null;
      }
      return { notInteger: true };
    }
    return null;
  }

  private destroy$ = new Subject<void>();
  private suppressScoreHistory: boolean = false;
  private suppressTimer: any = null;
  private readonly suppressMs: number = 3000; // 3s
  ngOnInit(): void {
    this.games = this.Gameservice?.getGames();
    this.getSelectedGameData();
    this.syncOfferUpdateStateFromStorage();
    this.getScoreHistory();
    this.utilsService
      .getTriggerScoreHistoryObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.suppressScoreHistory) {
          return;
        }
        this.getScoreHistory();
      });

    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.syncOfferUpdateStateFromStorage();
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.suppressTimer) {
      clearTimeout(this.suppressTimer);
      this.suppressTimer = null;
    }
  }
  selectedPlayerId: number = 0;
  captchaCode: any;
  private parseIsOnUpdate(value: any): boolean {
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') {
        return true;
      }
      if (normalized === 'false') {
        return false;
      }
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    return value === true;
  }

  private toPositiveNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private getSelectedGameName(): string {
    return this.GameData?.GameName || this.gameName || '';
  }

  private pickPreferredGameAccount(accounts: any[]): any {
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return null;
    }

    const sorted = [...accounts].sort((a: any, b: any) => {
      const serialDiff =
        this.toPositiveNumber(b?.SerialNumber) -
        this.toPositiveNumber(a?.SerialNumber);
      if (serialDiff !== 0) {
        return serialDiff;
      }

      const gameUserDiff =
        this.toPositiveNumber(
          b?.GameUserID ?? b?.GameUserId ?? b?.gameUserID ?? b?.gameUserId,
        ) -
        this.toPositiveNumber(
          a?.GameUserID ?? a?.GameUserId ?? a?.gameUserID ?? a?.gameUserId,
        );
      if (gameUserDiff !== 0) {
        return gameUserDiff;
      }

      return (
        this.toPositiveNumber(
          b?.Id ?? b?.id ?? b?.GameID ?? b?.GameId ?? b?.gameID,
        ) -
        this.toPositiveNumber(
          a?.Id ?? a?.id ?? a?.GameID ?? a?.GameId ?? a?.gameID,
        )
      );
    });

    return sorted[0];
  }

  private updateVisibleGameAccounts(gameData: any[]): any {
    const selectedGameName = this.getSelectedGameName();
    const sameGameAccounts = (gameData || []).filter(
      (data: any) => (data?.GameName || data?.gameName) === selectedGameName,
    );

    const selectedGameData = this.pickPreferredGameAccount(
      sameGameAccounts.length > 0 ? sameGameAccounts : gameData,
    );

    this.visibleGameAccounts = selectedGameData ? [selectedGameData] : [];
    return selectedGameData;
  }

  getSelectedGameData() {
    const gameData = this.Gameservice.getArrayInLocalStorage('bis_data');
    if (!Array.isArray(gameData) || gameData.length === 0) {
      this.visibleGameAccounts = [];
      return;
    }

    const selectedGameData = this.updateVisibleGameAccounts(gameData);
    const offerData =
      this.Gameservice.getArrayInLocalStorage('bis_offer') || [];
    this.offerOnGame = 0;
    this.upToScore = 0;
    this.IsOnUpdate = false;

    const selectedGameOfferData = offerData.find(
      (data: any) => data.GameName === this.getSelectedGameName(),
    );
    if (selectedGameOfferData) {
      this.offerOnGame = selectedGameOfferData.Bonus;
      this.upToScore = selectedGameOfferData.UptoScore;
      this.IsOnUpdate = this.parseIsOnUpdate(selectedGameOfferData.IsOnUpdate);
    }

    if (!selectedGameData) {
      return;
    }

    this.playerName = selectedGameData.PlayerName;
    this.playerPassword = selectedGameData.PlayerPassword;
    this.gameID = Number(
      selectedGameData.GameID ??
      selectedGameData.GameId ??
      selectedGameData.gameID ??
      selectedGameData.Id ??
      selectedGameData.id ??
      0,
    );
    this.gameUserID = Number(
      selectedGameData.GameUserID ??
      selectedGameData.GameUserId ??
      selectedGameData.gameUserID ??
      selectedGameData.gameUserId ??
      0,
    );
    this.selectedPlayerId = selectedGameData.PlayerId;
    this.downloadLink = selectedGameData.downloadLink;
  }

  private syncOfferUpdateStateFromStorage(): void {
    const selectedGameName = this.GameData?.GameName || this.gameName;
    const offerData =
      this.Gameservice.getArrayInLocalStorage('bis_offer') || [];
    const selectedGameOfferData = offerData.find(
      (data: any) => data?.GameName === selectedGameName,
    );

    if (!selectedGameOfferData) {
      this.IsOnUpdate = false;
      return;
    }

    this.offerOnGame = selectedGameOfferData.Bonus || 0;
    this.upToScore = selectedGameOfferData.UptoScore || 0;
    this.IsOnUpdate = this.parseIsOnUpdate(selectedGameOfferData.IsOnUpdate);
  }

  offerOnGame: number = 0;
  upToScore: number = 0;
  user = faUser;
  lock = faLock;
  openAddScoreModal(): void {
    this.showBalance = false;
    this.scoreForm.reset();
    this.currentScore = '';
    this.isScoreLoading = false;
    this.requestId = '';
    this.AddScorePayload().tCode = '';
    this.tCode = '';
    this.AddScorePayload().capatchaCode = '';
    this.scoreSourceType = 'wallet';
    this.showAddScoreModal = true;
    this.getScoreforAddding();
    // if (!this.isAddScoreDisable) {
    //   this.showAddScoreModal = true;
    // } else {
    //   const gameName =
    //     this.GameData?.GameName != undefined
    //       ? this.GameData?.GameName
    //       : this.gameName;
    //   this.Toaster.warning(
    //     'Your deposit request of ' + gameName + ' already in process',
    //     'Previous pending requests '
    //   );
    // }
  }

  openChangeAccountModal(): void {
    // Refresh selected account details so delete flow has latest game/account id.
    this.getSelectedGameData();
    this.showChangeAccountModal = true;
  }

  openDeleteAccountModal() {
    this.showChangeAccountModal = true;
  }

  closeChangeAccountModal(): void {
    if (this.isDeletingAccount) {
      return;
    }
    this.showChangeAccountModal = false;
  }

  closeDeleteAccountModal() {
    if (this.isDeletingAccount) {
      return;
    }
    this.showChangeAccountModal = false;
  }

  confirmChangeAccount(): void {
    if (this.isDeletingAccount) {
      return;
    }
    this.confirmDeleteAccount();
  }

  confirmDeleteAccount() {
    if (this.isDeletingAccount) {
      return;
    }
    this.showChangeAccountModal = false;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirmModal() {
    if (this.isDeletingAccount) {
      return;
    }
    this.showDeleteConfirmModal = false;
  }

  private resolveDeleteGameUserId(): number {
    const selectedGameName = this.GameData?.GameName || this.gameName;
    const fromState = Number(this.gameUserID || 0);
    if (fromState > 0) {
      return fromState;
    }

    const accountFromList: any = (this.gameAccounts || []).find(
      (account: any) =>
        account?.GameName === selectedGameName ||
        account?.gameName === selectedGameName,
    );

    const accountId = Number(
      accountFromList?.GameUserID ??
      accountFromList?.GameUserId ??
      accountFromList?.gameUserID ??
      accountFromList?.gameUserId ??
      0,
    );
    if (accountId > 0) {
      return accountId;
    }

    const bisData = this.Gameservice.getArrayInLocalStorage('bis_data') || [];
    const selectedFromStorage = bisData.find(
      (data: any) => data?.GameName === selectedGameName,
    );

    return Number(
      selectedFromStorage?.GameUserID ??
      selectedFromStorage?.GameUserId ??
      selectedFromStorage?.gameUserID ??
      selectedFromStorage?.gameUserId ??
      0,
    );
  }

  private getCurrentGameId(): number {
    const selectedGameName = this.GameData?.GameName || this.gameName;
    const selectedFromStorage = (
      this.Gameservice.getArrayInLocalStorage('bis_data') || []
    ).find((data: any) => data?.GameName === selectedGameName);

    const storageGameId = Number(
      selectedFromStorage?.systemgameid ??
      selectedFromStorage?.GameId ??
      selectedFromStorage?.gameId ??
      selectedFromStorage?.GameID ??
      selectedFromStorage?.gameID ??
      0,
    );
    if (storageGameId > 0) {
      return storageGameId;
    }

    const selectedAccount: any = (this.gameAccounts || []).find(
      (account: any) => account?.GameName === selectedGameName,
    );
    const accountGameId = Number(
      selectedAccount?.systemgameid ??
      selectedAccount?.GameId ??
      selectedAccount?.gameId ??
      0,
    );
    if (accountGameId > 0) {
      return accountGameId;
    }

    const selectedGame = this.games?.find(
      (game: any) => game.name === selectedGameName,
    );
    if (selectedGame?.id) {
      return selectedGame.id;
    }

    const offerData =
      this.Gameservice.getArrayInLocalStorage('bis_offer') || [];
    const selectedOffer = offerData.find(
      (data: any) => data.GameName === selectedGameName,
    );
    if (selectedOffer?.GameId) {
      return Number(selectedOffer.GameId);
    }

    return 0;
  }

  addPlayerPayload() {
    const currentGameId = this.getCurrentGameId();
    const selectedGameName = this.GameData?.GameName || this.gameName;

    return {
      id: currentGameId,
      gameName: selectedGameName,
      customerId: localStorage.getItem('customerId') || '',
      playerUserName: '',
      playerPassword: '',
      rechargeBalance: 0,
      gameId: currentGameId,
    };
  }

  getCustomerName(): string {
    return localStorage.getItem('userName') || '';
  }

  deleteAccount() {
    const gameUserID = this.resolveDeleteGameUserId();
    if (this.isDeletingAccount) {
      return;
    }

    if (!gameUserID) {
      this.Toaster.warning(
        'Game account not found. Please refresh and try again.',
        'Warning',
      );
      return;
    }

    if (this.IsOnUpdate) {
      this.Toaster.warning(
        'Game is under update!. Please try again later.',
        'Warning',
      );
      return;
    }

    this.gameUserID = gameUserID;

    this.isDeletingAccount = true;
    this.loaderService.show();

    this.apicallservice
      .DeleteCallWithToken(`GamePlayer/DeleteUserGameAccount/${gameUserID}`)
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.addNewPlayer();
          } else {
            this.isDeletingAccount = false;
            this.loaderService.hide();
            this.ErroHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.isDeletingAccount = false;
          this.loaderService.hide();
          this.ErroHandling.handleHttpError(error);
        },
      });
  }

  addNewPlayer() {
    const payload = this.addPlayerPayload();

    if (!payload.gameId || !payload.id) {
      this.isDeletingAccount = false;
      this.loaderService.hide();
      this.Toaster.warning(
        'Game details are missing. Please refresh and try again.',
        'Warning',
      );
      return;
    }

    if (payload.playerUserName == '') {
      payload.playerUserName = this.generateGameAccountIdentifier(
        this.getCustomerName(),
        payload.gameId,
      );
    }

    // if (payload.playerPassword == '') {
    //   payload.playerPassword = this.generateGameIdentifier(payload.gameId);
    // }

    if (payload.playerPassword == '') {
      const generated = this.generateGameIdentifier(payload.gameId);
      payload.playerPassword =
        generated.charAt(0).toUpperCase() + generated.slice(1);
    }

    if (this.IsOnUpdate) {
      this.loaderService.hide();
      this.isDeletingAccount = false;
      this.Toaster.warning(
        'Game is under update!. Please try again later.',
        'Warning',
      );
      return;
    }

    this.apicallservice
      .PostCallWithToken(payload, 'AddGameScore/CreatePanelPlayer')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.getGameAccount(
              () => {
                this.showDeleteConfirmModal = false;
                this.showChangeAccountModal = false;
                this.isDeletingAccount = false;
                this.loaderService.hide();
                this.scrollToTopSmooth();
                this.Toaster.success(
                  'New game account created successfully',
                  'Success',
                );
              },
              () => {
                this.isDeletingAccount = false;
                this.loaderService.hide();
              },
            );
          } else {
            this.isDeletingAccount = false;
            this.loaderService.hide();
            this.ErroHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.loaderService.hide();
          this.isDeletingAccount = false;
          this.ErroHandling.handleHttpError(error);
        },
      });
  }

  private scrollToTopSmooth(): void {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      try {
        window.scrollTo(0, 0);
      } catch {
        // ignore
      }
    }
  }

  // generateGameAccountIdentifier(CustomerName: string, gameId: number): string {
  //   let cleanedName = CustomerName.replace(/[^a-zA-Z0-9]/g, () => {
  //     return String.fromCharCode(97 + Math.floor(Math.random() * 26));
  //   });

  //   let prefix: string = cleanedName.slice(0, 5).toLowerCase();

  //   if (prefix.length < 5) {
  //     const charsNeeded = 5 - prefix.length;
  //     for (let i = 0; i < charsNeeded; i++) {
  //       prefix += String.fromCharCode(97 + Math.floor(Math.random() * 26));
  //     }
  //   }

  //   let gameInitials: string = this.utilsService.gameNameInitials(gameId);

  //   const digit1 = Math.floor(Math.random() * 10).toString();
  //   const digit2 = Math.floor(Math.random() * 10).toString();
  //   const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));

  //   let components = [digit1, digit2, letter];
  //   for (let i = components.length - 1; i > 0; i--) {
  //     const j = Math.floor(Math.random() * (i + 1));
  //     [components[i], components[j]] = [components[j], components[i]];
  //   }

  //   const randomPart = components.join('');
  //   return `${prefix}${randomPart}${gameInitials}`;
  // }
  generateGameAccountIdentifier(CustomerName: string, gameId: any): string {
    // 1. Clean the name: Remove anything that isn't a letter or number
    let cleanedName = CustomerName.replace(/[^a-zA-Z0-9]/g, () => {
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }); // --- NEW FIX START ---
    // if only numbers

    if (/^\d+$/.test(cleanedName)) {
      // replce first 2 with alpahbet
      const randomChar1 = String.fromCharCode(
        97 + Math.floor(Math.random() * 26),
      );
      const randomChar2 = String.fromCharCode(
        97 + Math.floor(Math.random() * 26),
      );

      cleanedName = randomChar1 + randomChar2 + cleanedName.slice(2);
    } // --- NEW FIX END ---
    // Then take the first 5 chars
    let prefix: string = cleanedName.slice(0, 5).toLowerCase(); // 2. Pad if shorter than 5

    if (prefix.length < 5) {
      const charsNeeded = 5 - prefix.length;
      for (let i = 0; i < charsNeeded; i++) {
        prefix += String.fromCharCode(97 + Math.floor(Math.random() * 26));
      }
    } // 3. Get game initials

    let gameInitials: string = this.utilsService.gameNameInitials(gameId); // 4. Generate the 3 random components (2 digits, 1 letter)

    const digit1 = Math.floor(Math.random() * 10).toString();
    const digit2 = Math.floor(Math.random() * 10).toString();
    const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // 5. Place them in an array and shuffle

    let components = [digit1, digit2, letter];
    for (let i = components.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [components[i], components[j]] = [components[j], components[i]];
    } // 6. Join the shuffled components and return

    const randomPart = components.join('');
    return `${prefix}${randomPart}${gameInitials}`;
  }
  generateGameIdentifier(gameId: number): string {
    let prefix: string = this.utilsService.gameNameInitials(gameId);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const randomLetters =
      String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(97 + Math.floor(Math.random() * 26));

    const combined = `${prefix}${randomLetters}${randomDigits}`;
    return combined.charAt(0).toUpperCase() + combined.slice(1);
  }

  getGameAccount(onSuccess?: () => void, onError?: () => void) {
    const customerID = localStorage.getItem('customerId');
    const payload = 'Game/GetGameUserInfo?CustomerId=' + customerID;

    this.apicallservice.GetCallWithToken(payload).subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          this.gameAccounts = response.data || [];
          this.loaderService.setArrayInLocalStorage(
            'bis_data',
            this.gameAccounts,
          );
          this.getSelectedGameData();
          if (onSuccess) {
            onSuccess();
          }
        } else {
          this.ErroHandling.handleResponseError(response);
          if (onError) {
            onError();
          }
        }
      },
      (error) => {
        this.ErroHandling.handleHttpError(error);
        if (onError) {
          onError();
        }
      },
    );
  }

  closeAddScoreModal(): void {
    this.showAddScoreModal = false;
  }
  // updatedGivenScore: number = 0;
  // get roundedUpdatedGivenScore(): number {
  //   const gamesToRound = ['GameRoom', 'MilkyWay', 'OrionStar', 'FireKirin'];
  //   if (gamesToRound.includes(this.gameName)) {
  //     return Math.round(this.updatedGivenScore);
  //   }
  //   return this.updatedGivenScore;
  // }

  updatedGivenScore: number = 0;

  get roundedUpdatedGivenScore(): number {
    const gamesToRound = ['GameRoom', 'MilkyWay', 'OrionStar', 'FireKirin'];
    const value = this.updatedGivenScore;
    return gamesToRound.includes(this.gameName) ? Math.round(value) : value;
  }

  private calculateUpdatedScore(score: number): number {
    const normalizedScore = Number(score) || 0;
    const bonus = this.offerOnGame
      ? (normalizedScore * this.offerOnGame) / 100
      : 0;
    return normalizedScore + bonus;
  }

  onScoreSubmit(): void {
    if (this.scoreForm.valid) {
      this.addedScore = Number(this.scoreForm?.value?.score) || 0;
      this.updatedGivenScore = this.calculateUpdatedScore(this.addedScore);

      this.paymentForm.patchValue({
        purchase: this.addedScore,
        confirmScore: this.roundedUpdatedGivenScore,
      });

      this.closeAddScoreModal();
      this.showPaymentModal = true;
    }
  }

  toggleVisibility(account: any): void {
    account.isUsernameVisible = !account.isUsernameVisible;
    account.isPasswordVisible = !account.isPasswordVisible;
  }

  togglePasswordVisibility(): void {
    this.isPasswordVisible = !this.isPasswordVisible;
  }

  async copyCredentials(account: any): Promise<void> {
    const textToCopy = `Username: ${this.playerName}, Password: ${this.playerPassword}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      // console.log('Copied to clipboard!');
      this.Toaster.info('Copied to clipboard!', 'info');
    } catch (err) {
      // console.error('Failed to copy text: ', err);
    }
  }

  isCopied = signal(false);
  CopyToClipBoard(text: string) {
    navigator.clipboard.writeText(text);
    this.isCopied.set(true);
    setTimeout(() => {
      this.isCopied.set(false);
    }, 2000);
  }

  closePaymentModal(): void {
    this.showPaymentModal = false;
    this.paymentForm.reset();
  }

  onPaymentSubmit(): void {
    if (this.paymentForm.valid) {
      this.PalyerSubmit();
      // this.showCaptchaModal = true;
    }
  }

  closeCaptchaModal(): void {
    this.showCaptchaModal = false;
    this.captchaForm.reset();
  }

  handleRetry(record: any, event: Event): void {
    event.stopPropagation();

    const actionType = (record?.ActionType || '').toLowerCase();
    this.requestId = record?.RequestId || record?.Id || '';

    if (actionType === 'score') {
      this.addedScore = record?.Score || 0;
      this.updatedGivenScore = Number(record?.TotalScore ?? record?.Score ?? 0);
      this.paymentForm.patchValue({
        purchase: this.addedScore,
        confirmScore: this.updatedGivenScore,
      });
      this.scoreSourceType = 'wallet';
      this.showPaymentModal = true;
      return;
    }

    if (actionType === 'redeem') {
      this.selectedGame = this.gameName;
      this.showRedeemModal = true;
    }
  }

  onCaptchaSubmit(): void {
    if (this.captchaForm.valid) {
      if (this.isBalanceShown) {
        this.showGameBalance();
      } else {
        // Handle final submission
        this.PalyerSubmit();
        // Add success notification or further processing here
      }
    } else {
      this.captchaForm.markAllAsTouched();
    }
  }

  //////////////////for game image
  getGameImage(gameName: string): string {
    const game = this.games.find((g: any) => g.name === gameName);
    return game ? game.image : ''; // Return empty string if no game is found
  }
  playGame(downloadLink: any): void {
    const game = this.games.find((g: any) => g.name === downloadLink);
    if (game && game.downloadLink) {
      // Open the download link in a new tab
      window.open(game.downloadLink, '_blank');
    } else {
      // console.error('Game not found or download link is missing');
    }
  }

  // playGame(downloadLink:any):any{
  //   const game = this.games.find((g:any) => g.id ==downloadLink );
  //   return game ? game.downloadLink : '';
  // }
  games: any = [];

  ///////////////////Add Game Score Api call

  currentScore: any;
  isScoreLoading: boolean = false;

  showScorePayload() {
    const bisOfferData = localStorage.getItem('bis_offer');
    const offerList = bisOfferData ? JSON.parse(bisOfferData) : [];
    const selectedGame = offerList.find(
      (game: any) =>
        game.GameName === (this.GameData?.GameName || this.gameName),
    );
    const gameId = selectedGame ? selectedGame.GameId : 0;
    const selectedFromStorage = (
      this.Gameservice.getArrayInLocalStorage('bis_data') || []
    ).find((data: any) => data?.GameName === selectedGame?.GameName);
    return {
      gameName: this.GameData?.GameName || this.gameName || 0,
      gameId,
      panelId: selectedFromStorage?.PanelId,
      customerID: localStorage.getItem('customerId') || '',
      playerID: this.selectedPlayerId || 0,
    };
  }

  getScoreforAddding() {
    if (this.isScoreLoading) {
      return;
    }

    this.isScoreLoading = true;
    try {
      this.suppressScoreHistory = true;
      if (this.suppressTimer) {
        clearTimeout(this.suppressTimer);
      }
      this.suppressTimer = setTimeout(() => {
        this.suppressScoreHistory = false;
        this.suppressTimer = null;
      }, this.suppressMs);
    } catch { }

    const payload = this.showScorePayload();

    this.apicallservice
      .PostCallWithToken(payload, 'AddGameScore/GetGameScore')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.currentScore = response?.data?.score ?? 'allow';
          } else {
            this.currentScore = 'allow';
          }

          this.isScoreLoading = false;
        },
        (error) => {
          this.ErroHandling.handleHttpError(error);
          this.currentScore = 'allow';
          this.isScoreLoading = false;
        },
      );
  }

  IsScoreValid() {
    if (this.scoreForm.valid) {
      if (
        this.currentScore === '' ||
        this.currentScore === null ||
        this.currentScore === undefined ||
        this.currentScore === 'allow'
      ) {
        this.Toaster.warning(
          'Get Current Score to complete Add Score Request.',
        );
      } else if (Number(this.currentScore) >= 3) {
        this.Toaster.warning(
          `Score Must be less than 3 to add more score. Your current Score is ${this.currentScore}.`,
        );
      } else {
        this.onScoreSubmit();
      }
    }
  }

  getCustomerID(): string | null {
    return localStorage.getItem('customerId');
  }

  //////////////////////////////////For Non PlayerName Games Modal
  OpenCaptchaAddPlayer(details: any) {
    this.showCaptchaModal = true;
    // this.payloadaddnewPlayer(details)
  }

  CloseCaptchaAddPlayer() {
    this.showCaptchaModal = false;
    this.AddScorePayload().tCode = '';
    this.tCode = '';
    this.AddScorePayload().capatchaCode = '';
  }
  AddScorePayload() {

    const selectedFromStorage = (
      this.Gameservice.getArrayInLocalStorage('bis_data') || []
    ).find((data: any) => data?.GameName === this.gameName);
    return {
      gameName: this.gameName || 0,
      customerID: localStorage.getItem('customerId') || '',
      playerID: this.selectedPlayerId || 0,
      addScore:
        this.addedScore?.toString() || this.scoreForm?.value?.score?.toString(),
      capatchaCode: '0',
      tCode: this.tCode,
      source: `AddScore,${this.gameName}`,
      totalScore: this.updatedGivenScore.toString(),
      bonus: '0',
      gameId: this.getCurrentGameId(),
      panelId: selectedFromStorage?.PanelId,
      requestId: this.requestId?.toString() || '',
      requestType: this.scoreSourceType === 'bonus' ? '2' : '1',
    };
  }
  tCode: string = '';
  addedScore: any;
  requestId: any = '';
  firstPendingIndex: number = -1;

  // 'wallet' -> requestType "1", 'bonus' -> requestType "2"
  scoreSourceType: 'wallet' | 'bonus' = 'wallet';
  selectScoreSource(type: 'wallet' | 'bonus'): void {
    this.scoreSourceType = type;
  }

  getFirstPendingIndex(): number {
    return this.ScoreHistory?.findIndex((e) => e.Status === 1) ?? -1;
  }
  timerValue: number = 59;
  showTimer: boolean = false;
  timerInterval: any;

  isAddScoreDisabled: boolean = false;
  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.isAddScoreDisabled = true;
    this.showTimer = true;
    this.timerValue = 59;

    this.timerInterval = setInterval(() => {
      this.timerValue--;
      if (this.timerValue <= 0) {
        clearInterval(this.timerInterval);
        this.showTimer = false;
        this.Toaster.success('Your score was added successfully!', 'Success');
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isAddScoreDisabled = false;
    this.showTimer = false;
  }

  PalyerSubmit() {
    // this.loaderService.show();
    const payload = this.AddScorePayload();
    // payload.addScore = this.updatedGivenScore;
    payload.capatchaCode = this.captchaForm?.value?.captcha?.toString() || '';
    this.closePaymentModal();

    setTimeout(() => {
      this.getScoreHistory();
    }, 4000);

    this.apicallservice
      .PostCallWithToken(payload, 'AddGameScore/AddGameScore')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            if (
              response?.data?.isCaptcha &&
              response?.data?.isCaptcha == true
            ) {
              this.showCaptchaModal = true;
              if (
                response?.data?.base64?.startsWith('data:image/png;base64,')
              ) {
                this.captchaImage = response?.data?.base64;
              } else {
                this.captchaImage =
                  'data:image/png;base64,' + response?.data?.base64;
              }
              this.tCode = response?.data?.tCode?.toString();
              this.OpenCaptchaAddPlayer(payload);
              this.closePaymentModal();
              this.loaderService.hide();
            } else {
              this.Toaster.success(response.responseMessage, 'Success');
              this.closePaymentModal();
              // this.startTimer(); // Start 59 sec timer

              this.loaderService.hide();
              this.loaderService?.triggerWalletFunction();
              this.closeCaptchaModal();
              if (this.showBalance) {
                this.getGameBalance();
              }
            }
            this.getScoreHistory();
          } else {
            this.ErroHandling.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        (error) => {
          this.ErroHandling.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }
  getcustomerId(): string | null {
    return localStorage.getItem('customerId') || '';
  }

  onStatusChange() {
    this.getScoreHistory();
  }

  dropdownOpen = false;
  selectedFilter = 'All';

  selectFilter(filter: string, event: Event) {
    event.preventDefault();
    this.selectedFilter = filter;
    this.dropdownOpen = false;
  }

  get filteredScoreHistory(): any[] {
    if (!this.ScoreHistory || this.ScoreHistory.length === 0) {
      return [];
    }

    if (this.selectedFilter === 'Completed') {
      return this.ScoreHistory.filter(
        (item) => item.Status === 2 || item.Status === '2',
      );
    }

    if (this.selectedFilter === 'Pending') {
      return this.ScoreHistory.filter(
        (item) => item.Status === 1 || item.Status === '1',
      );
    }

    return this.ScoreHistory;
  }

  ScoreHistory: any[] = [];
  isAddScoreDisable: boolean = false;
  getScoreHistory() {
    this.loaderService.show();

    const payload = {
      pageNumber: this.currentPage,
      pageSize: 10,
      customerId: this.getcustomerId(),
      gameName: this.GameData?.GameName || this.gameName,
    };

    this.apicallservice
      .PostCallWithToken(payload, 'GameInfo/GetScoreHistory')
      .subscribe({
        next: (response) => {
          if (response?.responseCode === 200) {
            const apiData = Array.isArray(response?.data)
              ? response.data
              : response?.data?.data || [];

            // First page => fresh data
            if (this.currentPage === 1) {
              this.ScoreHistory = [...apiData];
            } else {
              const combinedGames = [...this.ScoreHistory, ...apiData];

              this.ScoreHistory = Array.from(
                new Map(
                  combinedGames.map((game: any) => [game.Id, game]),
                ).values(),
              );
            }

            // Latest first
            this.ScoreHistory.sort(
              (a: any, b: any) =>
                new Date(b.AddedDate).getTime() -
                new Date(a.AddedDate).getTime(),
            );

            // Reset state every time
            this.isAddScoreDisable = false;

            const pendingScore = this.ScoreHistory.find(
              (item: any) => item.Status === 1 || item.Status === '1',
            );

            if (pendingScore) {
              this.isAddScoreDisable = true;
            }

            const firstPendingIndex = this.ScoreHistory.findIndex(
              (item: any) =>
                (item.Status === 1 || item.Status === '1') &&
                item?.RequestType?.toLowerCase() === 'automation',
            );

            if (firstPendingIndex > -1) {
              this.firstPendingIndex = firstPendingIndex;
              this.startTimer();
            } else {
              this.firstPendingIndex = -1;
              this.stopTimer();
            }

            this.totalRecords =
              response?.data?.totalRecords ||
              response?.totalRecords ||
              this.ScoreHistory.length;

            this.calculatePages();
          } else {
            if (this.currentPage > 1) {
              this.currentPage--;
            }

            this.apicallservice.handleError(response);
          }

          this.loaderService.hide();
        },
        error: (error) => {
          this.loaderService.hide();
          this.ErroHandling.handleHttpError(error);
        },
      });
  }

  // TS Code for Pagination Start
  pages: (number | string)[] = [];
  currentPage: number = 1;
  totalRecords: number = 0;
  itemsPerPage: number = 10;
  maxVisiblePages: number = 1;

  calculatePages(): void {
    const totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
    this.pages = [];
    if (totalPages <= this.maxVisiblePages) {
      this.pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      const startPage = Math.max(
        this.currentPage - Math.floor(this.maxVisiblePages / 2),
        1,
      );
      const endPage = Math.min(
        startPage + this.maxVisiblePages - 1,
        totalPages,
      );

      if (startPage > 1) {
        this.pages.push(1);
        if (startPage > 2) {
          this.pages.push('...');
        }
      }

      for (let i = startPage; i <= endPage; i++) {
        this.pages.push(i);
      }

      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          this.pages.push('...');
        }
        this.pages.push(totalPages);
      }
    }
  }

  navigateToPage(page: any): void {
    if (
      (page >= 1 && page <= this.pages.length) ||
      (page >= 1 && page >= this.pages.length)
    ) {
      this.currentPage = page;
      this.getScoreHistory();
    }
  }

  navigatePage(direction: 'prev' | 'next'): void {
    if (direction === 'prev' && this.currentPage > 1) {
      this.currentPage--;
    } else if (
      direction === 'next' &&
      this.currentPage < Math.ceil(this.totalRecords / this.itemsPerPage)
    ) {
      this.currentPage++;
    }
    this.getScoreHistory();
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.totalRecords);
    return `${start} – ${end}`;
  }

  // TS Code for Pagination End

  cards = [
    { date: '09/01/2025, 06:24 PM', amount: '', status: 'Pending' },
    { date: '21/09/2024, 10:50 PM', amount: '5.0', status: 'Completed' },
    { date: '21/09/2024, 08:57 PM', amount: '5.0', status: 'Completed' },
    { date: '21/09/2024, 03:09 PM', amount: '5.0', status: 'Completed' },
  ];

  //? Scroll Functionality
  @ViewChild('credentialsWebContainer', { static: false })
  credentialsWebContainer!: ElementRef;

  credentialWebScroll(): void {
    const element = this.credentialsWebContainer.nativeElement;

    // Calculate if scrolled to the bottom
    const isAtBottom =
      Math.ceil(element.scrollTop + element.offsetHeight) >=
      element.scrollHeight;

    if (isAtBottom) {
      this.currentPage++;
      // console.log('Scrolled to bottom');
      this.currentPage++;
      this.getScoreHistory();
    }
  }

  //? Mobile Scroll Functionality
  @ViewChild('credentialsMobileContainer', { static: false })
  credentialsMobileContainer!: ElementRef;
  credentialMobileScroll(): void {
    // console.log('scrolling');
    const element = this.credentialsMobileContainer.nativeElement;
    //? Calculate if scrolled to the bottom
    const isAtBottom =
      Math.ceil(element.scrollTop + element.offsetHeight) >=
      element.scrollHeight;
    if (isAtBottom) {
      // console.log('Scrolled to bottom');
      this.currentPage++;
      this.getScoreHistory();
    }
  }

  getBalanceScore: any = {
    id: 0,
    gameUserID: '',
    agentcode: '',
    t: 0,
  };
  getGameBalance() {
    this.loaderService.show();
    const payload = this.getBalanceScore;
    payload.id = this.gameID;
    payload.gameUserID = this.playerName;
    payload.agentcode = this.captchaForm?.value?.captcha?.toString() || '';
    this.apicallservice
      .PostCallWithToken(payload, 'Game/GetBalanceGamePlayer')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            if (
              response?.data?.isCaptcha &&
              response?.data?.isCaptcha == true
            ) {
              this.showCaptchaModal = true;
              if (
                response?.data?.base64String?.startsWith(
                  'data:image/png;base64String,',
                )
              ) {
                this.captchaImage = response?.data?.base64String;
              } else {
                this.captchaImage =
                  'data:image/png;base64,' + response?.data?.base64String;
              }
              payload.t = response?.data?.tCode;
              this.OpenCaptchaAddPlayer(payload);
              this.loaderService.hide();
            } else {
              this.gameBalance = response?.data?.balance?.toLocaleString();
              // this.Toaster.success(response.responseMessage, 'Success');
              this.loaderService.hide();
              this.closeCaptchaModal();
              this.showedBalance();
            }
          } else {
            this.closeCaptchaModal();
            this.ErroHandling.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        (error) => {
          this.ErroHandling.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }
  gameBalance: number = 0;
  showGameBalance() {
    this.loaderService.show();
    const payload = this.getBalanceScore;
    payload.id = this.gameID;
    payload.gameUserID = this.playerName;
    payload.agentcode = this.captchaForm?.value?.captcha?.toString() || '';
    this.apicallservice
      .PostCallWithToken(payload, 'Game/LoginCaptchaGameWithGetBalance')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            // this.Toaster.success(response.responseMessage, 'Success');
            this.gameBalance = response?.data?.balance?.toLocaleString();
            this.loaderService.hide();
            this.closeCaptchaModal();
            this.showedBalance();
          } else {
            this.ErroHandling.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        (error) => {
          this.closeCaptchaModal();
          this.ErroHandling.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }
  showGameRoomBalance() {
    this.loaderService.show();
    const payload = {
      id: this.gameID,
      account: this.playerName,
    };
    this.apicallservice
      .PostCallWithToken(payload, 'Game/GetBalanceplayerScore')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            // this.Toaster.success(response.responseMessage, 'Success');
            this.gameBalance =
              response?.data?.data[0]?.playerScore?.toLocaleString();
            this.loaderService.hide();
            this.closeCaptchaModal();
            this.showedBalance();
          } else {
            this.ErroHandling.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        (error) => {
          this.closeCaptchaModal();
          this.ErroHandling.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }
  isBalanceShown: boolean = false;
  toggleBalance() {
    if (this.showBalance) {
      // this.showBalance = !this.showBalance; // Toggle the visibility state
      // this.isBalanceShown = false;
      this.showedBalance();
    } else {
      this.getBalanceScore.t = 0;
      this.getBalanceScore.agentcode = '';
      this.isBalanceShown = true;
      if (this.gameName != 'GameRoom') {
        this.getGameBalance();
      } else {
        this.showGameRoomBalance();
      }
    }
  }
  showedBalance() {
    this.showBalance = !this.showBalance;
    this.isBalanceShown = false;
    const balanceElement = document.getElementById('balance');
    balanceElement!.textContent = this.showBalance
      ? `$${this.gameBalance}`
      : '•••••';
  }
  isCaptchaGames(gameName: string): boolean {
    return ['GameVault', 'Juwa', 'Vegas', 'GameRoom'].includes(gameName);
  }

  RedirectToRedeem() {
    this.requestId = '';
    this.openRedeemModal(this.gameName);
    // this.router.navigate(['/dashboard/redeem']);
  }
  openRedeemModal(gameName: string) {
    this.selectedGame = gameName;
    this.showRedeemModal = true;
  }
  showRedeemModal: boolean = false;
  closeRedeemModal() {
    this.showRedeemModal = false;
  }
}
