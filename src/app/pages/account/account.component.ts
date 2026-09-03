import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  Inject,
  signal,
  Signal,
  ViewChild,
} from '@angular/core';
import { GameAccount } from '../../Interfaces/interfaces';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faUser,
  faLock,
  faEye,
  faEyeSlash,
  faCopy,
  faCheck,
  faPlus,
  faXmark,
  faDownload,
} from '@fortawesome/free-solid-svg-icons';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderService } from '../../Services/loader-service.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { GameCard } from '../../Interfaces/interfaces';
import { ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { GameService } from '../../Services/game.service';
import { AddRedeemComponent } from '../../common/add-redeem/add-redeem.component';
import { Router } from '@angular/router';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../Services/utils.service';

@Component({
  selector: 'app-account',

  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    LoaderComponent,
    ReactiveFormsModule,
    AddRedeemComponent,
  ],
  templateUrl: './account.component.html',
  styleUrl: './account.component.scss',
})
export class AccountComponent {
  gameID?: any;
  selectedGame: any;
  GameData?: any;
  scoreForm: FormGroup;
  paymentForm: FormGroup;
  captchaForm: FormGroup;
  grainBackdrop: SafeHtml = '';
  showAddScoreModal = false;
  showPaymentModal = false;
  showCaptchaModal = false;
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
  captchaImage = '/assets/captcha.png';
  constructor(
    private apiCallService: ApiCallService,
    private ErrorHandle: ErrorhandlingService,
    private loaderService: LoaderService,
    private toaster: ToastrService,
    private _gameService: GameService,
    private router: Router,
    private fb: FormBuilder,
    private utils: UtilsService,
  ) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
    this.games = this._gameService?.getGames();
    this.gameName = localStorage.getItem('GN');
    this.GameData = this._gameService.getGameData();

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
        return 'e.g 1.1';
    }
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
  ngOnInit() {
    if (
      this.loaderService.getArrayInLocalStorage() &&
      this.loaderService.getArrayInLocalStorage().length > 0
    ) {
      this.gameAccounts = this.loaderService.getArrayInLocalStorage();
    } else {
      this.getGameAccount();
    }
    this.getSelectedGameData();
  }

  offerOnGame: number = 0;
  upToScore: number = 0;
  user = faUser;
  lock = faLock;
  openAddScoreModal(GameName: any): void {
    this.scoreForm.reset();
    this.AddScorePayload().tCode = '';
    this.tCode = '';
    this.AddScorePayload().capatchaCode = '';
    this.showAddScoreModal = true;
    this.gameName = GameName;
    this.getSelectedGameData();
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

  closeAddScoreModal(): void {
    this.showAddScoreModal = false;
  }

  updatedGivenScore: number = 0;

  get roundedUpdatedGivenScore(): number {
    const gamesToRound = ['GameRoom', 'MilkyWay', 'OrionStar', 'FireKirin'];
    if (gamesToRound.includes(this.gameName)) {
      this.updatedGivenScore = Math.round(this.updatedGivenScore);
    }
    return this.updatedGivenScore;
  }

  onScoreSubmit(): void {
    if (this.scoreForm.valid) {
      this.addedScore = this.scoreForm?.value?.score;
      // const bonus = (this.upToScore * this.offerOnGame) / 100;
      // this.updatedGivenScore = Number(this.addedScore) + bonus;
      let bonus: number = 0;
      if (this.addedScore > this.upToScore) {
        bonus = (this.upToScore * this.offerOnGame) / 100;
      } else {
        bonus = this.offerOnGame
          ? (this.addedScore * this.offerOnGame) / 100
          : 0;
      }
      this.updatedGivenScore = this.addedScore + bonus;

      this.closeAddScoreModal();
      this.showPaymentModal = true;
    }
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

  onCaptchaSubmit(): void {
    // if (this.captchaForm.valid) {
    //   if (this.isBalanceShown) {
    //     this.showGameBalance();
    //   } else {
    //     // Handle final submission
    //     this.PalyerSubmit();
    //     // Add success notification or further processing here
    //   }
    // } else {
    //   this.captchaForm.markAllAsTouched();
    // }
  }

  //////////////////for game image

  games: any = [];

  ///////////////////Add Game Score Api call

  IsScoreValid() {
    if (this.scoreForm.valid) {
      this.onScoreSubmit();
    }
  }

  getCustomerID(): number | null {
    return Number(localStorage.getItem('customerId'));
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
    return {
      gameName: this.gameName || '',
      customerID: this.getCustomerID()?.toString(),
      playerID: (this.selectedPlayerId || 0).toString(),
      addScore:
        this.addedScore?.toString() || this.scoreForm?.value?.score?.toString(),
      capatchaCode: '0',
      tCode: this.tCode,
      source: `AddScore,${this.gameName}`,
      totalScore: this.updatedGivenScore.toString(),
      bonus: '0',
    };
  }
  tCode: string = '';
  addedScore: any;
  PalyerSubmit() {
    this.loaderService.show();
    const payload = this.AddScorePayload();
    // payload.addScore = this.updatedGivenScore;
    payload.capatchaCode = this.captchaForm?.value?.captcha?.toString() || '';
    this.apiCallService
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
              this.toaster.success(response.responseMessage, 'Success');
              this.closePaymentModal();
              this.loaderService.hide();
              this.loaderService?.triggerWalletFunction();
              this.closeCaptchaModal();
              if (this.showBalance) {
                // this.getGameBalance();
              }
            }
            // this.getScoreHistory();
          } else {
            this.ErrorHandle.handleResponseError(response);
            this.loaderService.hide();
          }
        },
        (error) => {
          this.ErrorHandle.handleHttpError(error);
          this.loaderService.hide();
        },
      );
  }
  getcustomerId(): number | null {
    return Number(localStorage.getItem('customerId'));
  }

  isCaptchaGames(gameName: string): boolean {
    return ['GameVault', 'Juwa', 'Vegas', 'GameRoom'].includes(gameName);
  }

  RedirectToRedeem(selectedGame: any) {
    this.openCredentialsForGame(selectedGame);
  }

  openCredentialsForGame(selectedGame: any) {
    const selectedAccount = this.gameAccounts.find(
      (account: GameAccount) => account.GameName === selectedGame,
    );

    if (!selectedAccount) {
      this.toaster.warning('Game account not found', 'Warning');
      return;
    }

    const offerData =
      this._gameService.getArrayInLocalStorage('bis_offer') || [];
    const selectedGameOfferData = offerData.find(
      (data: any) => data.GameName === selectedAccount.GameName,
    );

    const selectedAccountData = selectedAccount as any;

    const matchedGameDetails = {
      SerialNumber: selectedAccountData.SerialNumber,
      PlayerId: selectedAccountData.PlayerId,
      PlayerName: selectedAccount.PlayerName,
      PlayerPassword: selectedAccount.PlayerPassword,
      GameName: selectedAccount.GameName,
      GameID: selectedAccountData.GameID,
      IsOnUpdate: selectedGameOfferData
        ? selectedGameOfferData.IsOnUpdate
        : 'False',
    };

    localStorage.setItem('GN', matchedGameDetails.GameName);
    this._gameService.setGameData(matchedGameDetails);
    this.router.navigate(['/dashboard/credentials']);
  }
  openRedeemModal(gameName: any) {
    this.selectedGame = gameName;
    this.showRedeemModal = true;
  }
  showRedeemModal: boolean = false;
  closeRedeemModal() {
    this.showRedeemModal = false;
  }

  selectedPlayerId: number = 0;
  captchaCode: any;
  gameName?: any;
  getSelectedGameData() {
    const gameData = this._gameService.getArrayInLocalStorage('bis_data');
    if (this.GameData) {
      var selectedGameData = gameData.find(
        (data: any) => data.GameName === this.GameData?.GameName,
      );
    } else {
      var selectedGameData = gameData.find(
        (data: any) => data.GameName === this.gameName,
      );
    }
    const offerData = this._gameService.getArrayInLocalStorage('bis_offer');
    if (this.GameData) {
      var selectedGameOfferData = offerData.find(
        (data: any) => data.GameName === this.GameData?.GameName,
      );
      if (selectedGameOfferData) {
        this.offerOnGame = selectedGameOfferData.Bonus;
        this.upToScore = selectedGameOfferData.UptoScore;
      }
    } else {
      var selectedGameOfferData = offerData.find(
        (data: any) => data.GameName === this.gameName,
      );
      if (selectedGameOfferData) {
        this.offerOnGame = selectedGameOfferData.Bonus;
        this.upToScore = selectedGameOfferData.UptoScore;
      }
    }

    // this.playerName = selectedGameData.PlayerName;
    // this.playerPassword = selectedGameData.PlayerPassword;
    this.gameID = selectedGameData.GameID;
    this.selectedPlayerId = selectedGameData.PlayerId;
    // this.downloadLink = selectedGameData.downloadLink;
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

  searchTerm: string = '';
  gameAccounts: GameAccount[] = [];

  getGameImage(gameName: string): string {
    const game = this.games.find((g: any) => g.name === gameName);
    return game ? game.image : ''; // Return empty string if no game is found
  }

  // filter section
  startDate: string | null = null;
  endDate: string | null = null;
  viewMode: 'grid' | 'table' = 'grid';

  searchControl = new FormControl('');
  toggleView() {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }

  // filter section

  // games: any[] = [];
  getGameAccount() {
    this.loaderService.show();
    const customerID = localStorage.getItem('customerId');
    const valueToSend = this.searchTerm.trim() ? this.searchTerm : 'null';
    const payload = `Game/GetGameUserInfo?CustomerId=${customerID}&Search=${encodeURIComponent(valueToSend)}`;
    this.apiCallService.GetCallWithToken(payload).subscribe(
      (response) => {
        this.loaderService.hide();
        if (response && response.responseCode === 200) {
          this.gameAccounts = response.data;

          if (this.searchTerm && this.searchTerm.trim() !== '') {
            const filtered = this.gameAccounts.filter(
              (account) =>
                account.GameName.toLowerCase().includes(
                  this.searchTerm.toLowerCase(),
                ) ||
                account.PlayerName.toLowerCase().includes(
                  this.searchTerm.toLowerCase(),
                ),
            );
            if (filtered.length > 0) {
              this.gameAccounts = filtered;
            } else {
              this.gameAccounts = [];
              this.toaster.warning('Record not found', 'Warning');
            }
          }
        } else {
          this.ErrorHandle.handleResponseError(response);
        }
      },
      (error) => {
        this.loaderService.hide();
        this.ErrorHandle.handleHttpError(error);
      },
    );
  }

  // {
  //   this.ErrorHandle.handleHttpError(error);
  // }

  recordsLengthToShow: number = 10;
  filteredAccounts(): GameAccount[] {
    this.totalRecords = this.gameAccounts.length;
    this.calculatePages();
    if (!this.searchTerm) {
      return this.gameAccounts.slice(0, this.recordsLengthToShow);
    }
    const filtered = this.gameAccounts.filter(
      (account) =>
        account.GameName.toLowerCase().includes(
          this.searchTerm.toLowerCase(),
        ) ||
        account.PlayerName.toLowerCase().includes(
          this.searchTerm.toLowerCase(),
        ),
    );
    return filtered;
  }

  onEnterSearch() {
    this.getGameAccountFromSearch(); // new API call for search
  }

  // onTyping() {
  //   if (!this.searchTerm || this.searchTerm.trim() === '') {
  //     this.initializeComponent();
  //   }
  // }
  // initializeComponent() {
  //   this.getGameAccount(); // full reload
  // }

  getGameAccountFromSearch() {
    this.loaderService.show();

    const customerID = localStorage.getItem('customerId');
    const valueToSend = this.searchTerm.trim() ? this.searchTerm : 'null';
    const payload = `Game/GetGameUserInfo?CustomerId=${customerID}&Search=${encodeURIComponent(valueToSend)}`;

    this.apiCallService.GetCallWithToken(payload).subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          this.gameAccounts = response.data;

          if (this.gameAccounts.length === 0) {
            this.toaster.warning('Record not found');
          }
        }
        this.loaderService.hide();
      },
      (error) => {
        this.loaderService.hide();
        this.ErrorHandle.handleHttpError(error);
      },
    );
  }

  toggleVisibility(account: GameAccount): void {
    account.isUsernameVisible = !account.isUsernameVisible;
    account.isPasswordVisible = !account.isPasswordVisible;
  }

  togglePasswordVisibility(account: GameAccount): void {
    account.isPasswordVisible = !account.isPasswordVisible;
  }

  async copyCredentials(account: GameAccount): Promise<void> {
    const textToCopy = `Username: ${account.PlayerName}, Password: ${account.PlayerPassword}`;
    this.toaster.info('Copied', 'Info');
    try {
      await navigator.clipboard.writeText(textToCopy);
      // console.log('Copied to clipboard!');
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
  // TS Code for Pagination Start
  pages: (number | string)[] = [];
  currentPage: number = 1;
  totalRecords: number = 0;
  itemsPerPage: number = 8;
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
      this.filteredAccounts();
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
    this.filteredAccounts();
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.totalRecords);
    return `${start} – ${end}`;
  }
  // TS Code for Pagination End

  //? Scroll Functionality

  @ViewChild('accountGrid', { static: false }) accountGrid!: ElementRef;
  onGridViewScroll(): void {
    // console.log('scrolling');
    const chatListElement = this.accountGrid.nativeElement;
    if (
      chatListElement.offsetHeight + chatListElement.scrollTop + 1 >=
        chatListElement.scrollHeight &&
      this.recordsLengthToShow < this.gameAccounts.length
    ) {
      this.currentPage++;
      // this.GetAllGames();
      // spinner
      this.loaderService.show();
      this.recordsLengthToShow = 11;
      setTimeout(() => {
        this.loaderService.hide();
      }, 1000);
    }
  }

  //? For Table View
  @ViewChild('accountTable', { static: false }) accountTable!: ElementRef;
  onTableViewScroll(): void {
    // console.log("scrolling");
    const element = this.accountTable.nativeElement;
    //? Calculate if scrolled to the bottom
    const isAtBottom =
      Math.ceil(element.scrollTop + element.offsetHeight) >=
      element.scrollHeight;
    if (isAtBottom && this.recordsLengthToShow < this.gameAccounts.length) {
      // console.log('Scrolled to bottom');
      this.currentPage++;
      // this.getScoreHistory();
      this.loaderService.show();
      this.recordsLengthToShow = 11;
      setTimeout(() => {
        this.loaderService.hide();
      }, 1000);
    }
  }
}
