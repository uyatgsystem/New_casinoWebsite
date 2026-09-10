import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  HostListener,
  input,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
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
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { GameCard, Transaction } from '../../Interfaces/interfaces';
import { CommonModule } from '@angular/common';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderService } from '../../Services/loader-service.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { GameService } from '../../Services/game.service';
import { UtilsService } from '../../Services/utils.service';
import { LocalTimePipe } from '../../Pipes/local-time.pipe';

import {
  faCircleInfo,
  faEye,
  faEyeSlash,
  faSackDollar,
  faSurprise,
  faCopy,
  faRefresh,
} from '@fortawesome/free-solid-svg-icons';
import { ErrorhandlingService } from '../../Services/error-handling.service';
@Component({
  selector: 'app-add-redeem',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './add-redeem.component.html',
  styleUrl: './add-redeem.component.scss',
})
export class AddRedeemComponent implements OnInit, AfterViewInit {
  infoIcon = faCircleInfo;
  surpriseIcon = faSurprise;
  sackDollarIcon = faSackDollar;
  copy = faCopy;
  refresh = faRefresh;

  showDateFilter: boolean = false;
  startDate: string | null = null;
  endDate: string | null = null;
  @Input() selectedGame: any = '';
  @Input() requestId: any = '';
  @Output() isModalOpen: EventEmitter<boolean> = new EventEmitter<boolean>(
    true,
  );
  selectedPaymentMethod: 'wallet' | 'withdraw' = 'wallet';
  redeemForm: FormGroup;
  accountType = '';
  constructor(
    private _apiCall: ApiCallService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private handleError: ErrorhandlingService,
    private GameService: GameService,
    private utilsService: UtilsService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.gameDropdownData = this.GameService?.getGames();
    this.redeemForm = this.fb.group({
      game: [this.selectedGame, Validators.required],
      score: [
        '',
        [Validators.required, Validators.min(1), this.integerValidator],
      ],
      source: [this.selectedPaymentMethod],
      accountType: [this.accountType], // Remove function reference here
      accountInfo: [this.accountInfo], // Remove function reference here
      CustomerTag: [''],
    });
  }

  integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && !Number.isInteger(Number(value))) {
      return { notInteger: true };
    }
    return null;
  }

  private destroy$ = new Subject<void>();
  @Input() isFromRedeem: boolean = false;
  ngAfterViewInit() {
    if (this.selectedGame) {
      this.redeemForm.get('game')?.setValue(this.selectedGame);
      this.selectGame(this.selectedGame, new Event('change'));
    }
    this.cdr.detectChanges();
  }
  ngOnDestroy() {
    this.closeModal();
    this.selectedGame = '';
    this.destroy$.next();
    this.destroy$.complete();
  }
  @ViewChild('transactionTable', { static: false })
  transactionTable!: ElementRef;

  // Add property to track current search term
  currentSearchTerm: string = '';

  dropdownOpen = false;
  selectedFilter = 'All Redeem';

  selectFilter(filter: string, event: Event) {
    event.preventDefault(); // prevent page jump
    this.selectedFilter = filter;
    this.dropdownOpen = false;

    // Filter logic will be handled in the filteredTransactions getter
    console.log('Filter selected:', filter);
  }

  public totalBalance = 0;

  get privateValue(): number {
    return this.totalBalance;
  }
  transactions: any[] = [];
  Debittransactions: any[] = [];
  selectedTab: string = 'credit';
  searchControl: string = '';
  @Input() showModal: boolean = false;
  showwithdrawModal = false;
  newBalance = 0;

  showicon = faEye;
  hideicon = faEyeSlash;

  toggleData(bar: string) {
    this.selectedTab = bar;
  }

  ngOnInit() {
    this.openAddBalanceModal();
    this.filteredGamesDropdown();
  }

  openAddBalanceModal() {
    this.showModal = true;
  }

  filteredGameDropdownData: any = [];
  // filter section

  gameDropdownData: any[] = [];
  filteredGamesDropdown() {
    const gamePlayers = this.GameService.getArrayInLocalStorage('bis_data');

    const mappedGames = this.gameDropdownData.filter((dropdownGame) =>
      gamePlayers.some(
        (playerGame) => playerGame.GameName === dropdownGame.name,
      ),
    );
    this.filteredGameDropdownData = mappedGames;
    // console.log(mappedGames);
  }
  currentPage: number = 1;

  // TS Code for Pagination End
  isAccountSelected: boolean = false;
  isShowManualEntry: boolean = true;
  isAcountDropDownSelected: boolean = false;

  // submitRedeem() {
  //   if (this.redeemForm.valid) {
  //     // this.CheckRedeemRequest()
  //     //   .then((response) => {
  //     this.addRedeemRequest();
  //     // })
  //     // .catch((error) => {
  //     //   console.error('Error:', error);
  //     // });
  //     this.closeModal();
  //   } else {
  //     this.redeemForm.markAllAsTouched();
  //   }
  // }

  submitRedeem() {
    if (
      this.currentScore === '' ||
      this.currentScore === null ||
      this.currentScore === undefined
    ) {
      this.toastr.warning('Get Current Score to complete Redeem Request.');
      return;
    }

    // const enteredScore = Number(this.redeemForm.get('score')?.value);
    const enteredScore = Number(this.currentScore);
    const currentScoreNum = Number(this.currentScore);
    const eligibleScoreNum = Number(this.eligibleScore);
    this.score = this.currentScore;
    // Check if entered score exceeds current score
    if (enteredScore > currentScoreNum) {
      this.toastr.warning(
        `Score must not exceed your current score. Your current score is ${this.currentScore}. Entered score: ${enteredScore}`,
      );
      return;
    }

    // Check if eligible score is less than or equal to current score
    // Then score must equal current score exactly (no more, no less)
    if (currentScoreNum <= eligibleScoreNum) {
      if (enteredScore !== currentScoreNum) {
        this.toastr.warning(
          `Score must equal your current score exactly. Current score: ${this.currentScore}. Entered score: ${enteredScore}`,
        );
        return;
      }
    }


    if (this.score === 0) {
      debugger
      this.toastr.warning(
        `Score must be more than 0 to Request Reddem`,
      );
      return; // Exits the function early
    }
    // All validations passed
    this.addRedeemRequest();
    this.closeModal();
  }

  accountInfo: string = '';
  CustomerTag: string = '';
  addRedeemPayload() {
    const gameData = this.loaderService.getArrayInLocalStorage();
    var selectedGameData = gameData.find(
      (data: any) =>
        data.GameName ===
        (typeof this.selectedGame === 'string'
          ? this.selectedGame
          : this.selectedGame?.GameName),
    );
    // 1.
    const bisOfferData = localStorage.getItem('bis_offer');
    const offerList = bisOfferData ? JSON.parse(bisOfferData) : [];
    // 2.
    const selectedGame = offerList.find(
      (game: any) =>
        game.GameName ===
        (typeof this.selectedGame === 'string'
          ? this.selectedGame
          : this.selectedGame?.GameName),
    );
    // 3.
    this.selectedGame = selectedGame;
    const gameId = selectedGame ? selectedGame.GameId : 0;
    const rawPanelId = selectedGameData?.PanelId;
    const panelId =
      rawPanelId !== undefined && rawPanelId !== null && rawPanelId !== '' && !isNaN(Number(rawPanelId))
        ? Number(rawPanelId)
        : null;
    return {
      gameName: selectedGameData?.GameName,
      customerID: this.getCustomerID()?.toString(),
      playerID: selectedGameData ? selectedGameData?.PlayerId : null,
      //playerID: selectedGameData ? selectedGameData.GameID === 8 ? selectedGameData.PlayerId : selectedGameData.PlayerName : null,
      addScore: this.score.toString(),
      capatchaCode: '',
      tCode: '',
      panelId: panelId,
      source: this.selectedPaymentMethod || 'Wallet',
      accountType: this.accountType || '',
      accountInfo: this.accountInfo || '',
      cashTag: this.redeemForm.get('CustomerTag')?.value || '',
      gameId: gameId || 0,
      requestId: this.requestId || '',
    };
  }
  getCustomerID(): string | null {
    return localStorage.getItem('customerId');
  }
  score: any;
  addRedeemRequest() {
    this.loaderService.show();
    const payload = this.addRedeemPayload();
    if (this.selectedGame?.IsOnUpdate == 'True') {
      this.handleError.showAlert(
        'warning',
        'Game is under update!. Please try again later.',
      );
      return;
    }
    this._apiCall
      .PostCallWithToken(payload, 'AddGameScore/RedeemGameScoreFromPanel')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.toastr.success(response.responseMessage, 'Success');
            this.utilsService.triggerRedeemHistory();
            this.loaderService.hide();
            this.utilsService.triggerScoreHistory();
          } else {
            this.handleError.handleResponseError(response);
            this.utilsService.triggerScoreHistory();
            // this.loaderService.hide();
          }
        },
        error: (error) => {
          this.handleError.handleHttpError(error);
          this.utilsService.triggerScoreHistory();
          // this.loaderService.hide();
        },
      });
  }
  isAccountTypeSelected: boolean = false;
  setPaymentMethod(method: 'wallet' | 'withdraw') {
    this.selectedPaymentMethod = method;
    this.accountValidations();
    if (method == 'wallet') {
      this.accountType = '';
      this.accountInfo = '';
      // this.accountTypeData = {
      //   id: 0,
      //   name: '',
      // };
      this.isAccountTypeSelected = false;
      this.updateAccountInfoValidation(this.isAccountTypeSelected);
    }
  }
  private accountValidations() {
    if (this.selectedPaymentMethod === 'wallet') {
      this.redeemForm.get('score')?.setValidators([Validators.required]);
      this.redeemForm.get('accountInfo')?.clearValidators();
      // this.redeemForm.get('score')?.clearValidators();
    } else {
      this.redeemForm.get('accountInfo')?.setValidators([Validators.required]);
    }

    // Ensure changes take effect
    this.redeemForm.get('accountInfo')?.updateValueAndValidity();
    this.redeemForm.get('score')?.updateValueAndValidity();
  }
  closeModal() {
    this.showModal = false;
    this.selectedGame = '';
    this.isModalOpen.emit(false);
    // this.handleError.showModalSubject.next(false);
  }

  updateAccountInfoValidation(isAccountTypeSelected: boolean) {
    if (isAccountTypeSelected) {
      this.redeemForm.get('accountInfo')?.setValidators([Validators.required]);
    } else {
      this.redeemForm.get('accountInfo')?.clearValidators();
    }
    this.redeemForm.get('accountInfo')?.updateValueAndValidity();
  }
  gameDropdownOpen = false;
  selectGame(name: string, event: Event) {
    event.preventDefault();
    this.selectedGame = name;
    this.gameDropdownOpen = false;
    this.onGameChange(name);
  }
  onGameChange(gameName: string) {
    this.selectedGame = gameName;
    this.redeemForm.patchValue({
      game: gameName,
    });
    this.currentScore = '';
    this.getScoreforAddding();
    this.eligibleScore = '';
    this.redeemMultiplier = '';
    this.getelligibleScore();
  }
  accountTypeDropdownOpen = false;
  onAccountTypeChange(game: any) {
    this.accountType = game.name;
    this.isAccountTypeSelected = true;
    this.updateAccountInfoValidation(this.isAccountTypeSelected);
    this.accountTypeDropdownOpen = false;
  }
  accountTypeData: any = [
    {
      id: 1,
      name: 'CashApp',
    },
    {
      id: 2,
      name: 'Chime',
    },
    {
      id: 3,
      name: 'Zelle',
    },
    // {
    //   id: 4,
    //   name: 'Transic (payment link)',
    // },
  ];

  showScorePayload() {
    // 1.
    const bisOfferData = localStorage.getItem('bis_offer');
    const offerList = bisOfferData ? JSON.parse(bisOfferData) : [];

    // 2.
    const selectedGame = offerList.find(
      (game: any) => game.GameName === this.selectedGame,
    );

    // 3.
    const gameId = selectedGame ? selectedGame.GameId : 0;

    // player id logic

    // 1
    const bisPlayerData = localStorage.getItem('bis_data');
    const playerList = bisPlayerData ? JSON.parse(bisPlayerData) : [];

    // 2.
    const selectedplayer = playerList.find(
      (player: any) => player.GameName === this.selectedGame,
    );

    // 3.
    const playerID = selectedplayer ? selectedplayer.PlayerId : 0;
    return {
      gameName: this.selectedGame || '',
      gameId: gameId,
      customerID: this.getCustomerID(),
      playerID: playerID,
      panelId: selectedplayer?.PanelId,
    };
  }

  isScoreLoading: boolean = false;
  currentScore: any;

  getScoreforAddding() {
    if (this.isScoreLoading) return;
    this.isScoreLoading = true;
    this.currentScore = '';
    const payload = this.showScorePayload();
    this._apiCall
      .PostCallWithToken(payload, 'AddGameScore/GetGameScore')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            // this.currentScore = response?.data;
            this.currentScore = response?.data ? Math.floor(response.data?.score) : 0;
            this.isScoreLoading = false;
          } else if (response && response.responseCode === 400) {
            // When opening the redeem modal a 400 is expected in some cases.
            // Do not show an error popup for 400 here; just clear the score.
            this.currentScore = '';
            this.isScoreLoading = false;
          } else {
            this.handleError.handleResponseError(response);
            this.isScoreLoading = false;
          }
        },
        (error) => {
          this.handleError.handleHttpError(error);
          this.isScoreLoading = false;
        },
      );
  }

  eligibleScore: any;
  redeemMultiplier: any;
  getelligibleScore() {
    const payload = {
      gameName: this.selectedGame || 0,
      customerID: this.getCustomerID()?.toString(),
    };
    this._apiCall
      .PostCallWithToken(payload, 'AddGameScore/GetEligibleScore')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.eligibleScore = response?.data.eligibleScore;
            this.redeemMultiplier = response?.data.redeemMultiplier;
          } else {
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          this.handleError.handleHttpError(error);
        },
      );
  }

  CopyToClipBoard(text: string) {
    navigator.clipboard.writeText(text);
  }
}
