import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
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
import { HttpClientModule } from '@angular/common/http';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { ToastrService } from 'ngx-toastr';
import { GameCard, GameCardInterface } from '../../Interfaces/interfaces';
import {
  faPlus,
  faCircleInfo,
  faTableCellsLarge,
  faListUl,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GameService } from '../../Services/game.service';
import { UtilsService } from '../../Services/utils.service';
import { Subject, takeUntil } from 'rxjs';
import { AddRedeemComponent } from '../../common/add-redeem/add-redeem.component';

type ActiveTabType = 'All' | 'Pending' | 'Approved' | 'Declined';

interface RedeemRule {
  title: string;
  description: string;
}

@Component({
  selector: 'app-redeem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    LoaderComponent,
    NgIf,
    FontAwesomeModule,
    AddRedeemComponent,
  ],
  providers: [ApiCallService],
  templateUrl: './redeem.component.html',
  styleUrls: ['./redeem.component.scss'],
})
export class RedeemComponent implements OnInit, OnDestroy {
  private _apiCall = inject(ApiCallService);
  // activeTab: 'all' | 'Pending' | 'Approved' | 'Declined' = 'all';
  isSearchOpen = false;

  toggleSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }
  // searchTerm = '';
  activeTab: ActiveTabType = 'All';
  showModal = false;
  showRulesModal = false;
  selectedGame: any = '';
  score = '';
  accountType = '';
  selectedPaymentMethod: 'wallet' | 'withdraw' = 'wallet';
  startDate: string | null = null;
  endDate: string | null = null;
  viewMode: 'grid' | 'table' = 'grid';
  plusIcon = faPlus;
  infoIcon = faCircleInfo;
  tableViewIcon = faTableCellsLarge;
  listViewIcon = faListUl;
  showDateFilter: boolean = false;
  showMobileDateFilter = false;

  searchControl = new FormControl('');
  toggleView() {
    this.viewMode = this.viewMode === 'grid' ? 'table' : 'grid';
  }
  games: any[] = [];
  gameImages: any[] = [];
  redeemForm: FormGroup;
  accountInfo: string = '';
  constructor(
    private loaderService: LoaderService,
    private ErroHandling: ErrorhandlingService,
    private toastr: ToastrService,
    private fb: FormBuilder,
    private GameService: GameService,
    private utilsService: UtilsService,
  ) {
    this.gameImages = this.GameService?.getGames();
    this.redeemForm = this.fb.group({
      game: [this.selectedGame, Validators.required],
      score: [
        '',
        [Validators.required, Validators.min(1), this.integerValidator],
      ],
      source: [this.selectedPaymentMethod],
      accountType: [this.accountType], // Remove function reference here
      accountInfo: [this.accountInfo], // Remove function reference here
    });

    // Apply validations based on initial conditions
    this.accountValidations();
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

  //   this.redeemForm.get('accountInfo')?.setValidators([Validators.required]);
  // } else {
  //   this.redeemForm.get('accountInfo')?.clearValidators();
  // }
  // this.redeemForm.get('accountInfo')?.updateValueAndValidity();
  filteredGameDropdownData: any = [];
  private destroy$ = new Subject<void>();
  ngOnInit(): void {
    this.GetAllGames(false);
    // const gameData = this.GameService.getArrayInLocalStorage('bis_data');
    // const players =
    // const gamePlayers = this.GameService.getArrayInLocalStorage('bis_data');
    this.filteredGamesDropdown();
    // this.gameDropdownData.forEach((data) => {});
    this.utilsService
      .getTriggerRedeemHistoryObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.GetAllGames(false);
      });
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dropdownOpen = false;
  tabs: ActiveTabType[] = ['All', 'Pending', 'Approved', 'Declined'];

  selectFilter(value: ActiveTabType, event: Event) {
    event.preventDefault();
    this.activeTab = value;
    this.dropdownOpen = false;
  }

  onStartDateChange(date: string) {
    if (this.endDate && new Date(this.endDate) < new Date(date)) {
      this.endDate = null;
    }
  }

  resetDates() {
    this.startDate = null;
    this.endDate = null;
    this.GetAllGames(true);
  }

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
  getGameImage(gameName: string): string {
    const game = this.gameImages.find((g) => g.name === gameName);
    return game ? game.image : '';
  }
  searchTerm: string = '';
  get filteredGames() {
    return this.games.filter((game) => {
      const matchesTab =
        this.activeTab === 'All' || game.StatusDescription === this.activeTab;

      const matchesSearch =
        !this.searchTerm ||
        game.Name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        game.RequestAmount.toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }

  openModal() {
    this.accountValidations();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedGame = { value: 'VBLink' };
    this.score = '';
    this.accountType = '';
    // this.accountTypeData = {
    //   id: 0,
    //   name: '',
    // };
    this.accountInfo = '';
    this.selectedPaymentMethod = 'wallet';
    this.isAccountTypeSelected = false;
    this.redeemForm.markAsUntouched();
  }

  openRulesModal() {
    this.showRulesModal = true;
  }

  closeRulesModal() {
    this.showRulesModal = false;
  }

  submitRedeem() {
    if (this.redeemForm.valid) {
      // this.CheckRedeemRequest()
      //   .then((response) => {
      this.addRedeemRequest();
      // })
      // .catch((error) => {
      //   console.error('Error:', error);
      // });
      this.closeModal();
    } else {
      this.redeemForm.markAllAsTouched();
    }
  }

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

  GetAllGames(isSearched: boolean) {
    this.loaderService.show();

    const payload = {
      // pageNumber: 1,
      // pageSize: 10,
      searchText: this.searchTerm || '',
      startDate: this.startDate || '',
      endDate: this.endDate || '',
      pageNumber: this.currentPage !== undefined ? this.currentPage : 0,
      pageSize: 10,
      totalRecords: 0,
    };

    this._apiCall
      .PostCallWithToken(payload, 'Redeem/GetGameRedeemRequest')
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.totalRecords = response?.data[0]?.totalRecords;
            if (isSearched) {
              this.games = response.data;
            } else {
              // this.games = [...this.games, ...response.data];
              const combinedGames = [...this.games, ...response.data];
              this.games = Array.from(
                new Map(
                  combinedGames.map((game: any) => [game.Id, game]),
                ).values(),
              );
            }
            this.filteredGames;
            this.calculatePages();
            this.loaderService.hide();
          } else {
            // this._apiCall.handleError(response);
            this.ErroHandling.handleResponseError(response);
          }
          // this.loaderService.hide();
        },
        error: (error) => {
          // this.loaderService.hide();
          // this._apiCall.handleError(error);
          this.ErroHandling.handleHttpError(error);
        },
      });
  }
  integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && !Number.isInteger(Number(value))) {
      return { notInteger: true };
    }
    return null;
  }

  addRedeemPayload() {
    const gameData = this.loaderService.getArrayInLocalStorage();
    var selectedGameData = gameData.find(
      (data: any) => data.GameName === this.selectedGame,
    );
    return {
      gameName: selectedGameData?.GameName,
      customerID: this.getCustomerID()?.toString(),
      playerID: selectedGameData?.PlayerId
        ? selectedGameData.PlayerId.toString()
        : '0',
      //playerID: selectedGameData ? selectedGameData.GameID === 8 ? selectedGameData.PlayerId : selectedGameData.PlayerName : null,
      redeemScore: this.score.toString(),
      capatchaCode: '',
      tCode: '',
      source: this.selectedPaymentMethod || 'Wallet',
      accountType: this.accountType || '',
      accountInfo: this.accountInfo || '',
    };
  }
  getCustomerID(): number | null {
    return Number(localStorage.getItem('customerId'));
  }
  addRedeemRequest() {
    this.loaderService.show();
    const payload = this.addRedeemPayload();
    this._apiCall
      .PostCallWithToken(payload, 'GameRedeem/RedeemScore')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            this.toastr.success(response.responseMessage, 'Success');
            this.GetAllGames(true);
            this.loaderService.hide();
          } else {
            this.ErroHandling.handleResponseError(response);
            // this.loaderService.hide();
          }
        },
        error: (error) => {
          this.ErroHandling.handleHttpError(error);
          // this.loaderService.hide();
        },
      });
  }

  gameDropdownData: GameCard[] = [
    {
      id: 2,
      name: 'GameVault',
      image: 'Images/game/GameVault.png',
      provider: 'Game Vault',
      offer: 0,
    },
    {
      id: 4,
      name: 'Juwa',
      image: 'Images/game/Juwa.png',
      offer: 0,
      provider: 'Juwa',
    },
    {
      id: 7,
      name: 'Vegas',
      image: 'Images/game/Sweeps.png',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 8,
      name: 'GameRoom',
      image: 'Images/game/GamerRoom.png',

      offer: 0,
      provider: 'Game Vault',
    },
    {
      id: 0,
      name: 'Dragon',
      image: 'Images/game/Dragon.png',

      offer: 0,
      provider: 'Dragon Gaming',
    },
    {
      id: 1,
      name: 'EGame',
      image: 'Images/game/Egame.png',

      offer: 0,
      provider: 'Dragon Gaming',
    },
    {
      id: 10,
      name: 'FireKirin',
      image: 'Images/game/Fire.png',

      offer: 0,
      provider: 'Fire Kirin',
    },
    {
      id: 3,
      name: 'GoldenTreasure',
      image: 'Images/game/GoldenTreasure.png',

      offer: 0,
      provider: 'Golden',
    },
    {
      id: 9,
      name: 'MilkyWay',
      image: 'Images/game/MilkyWays.png',

      offer: 0,
      provider: 'Milky',
    },
    {
      id: 11,
      name: 'OrionStar',
      image: 'Images/game/OrionStars.png',

      offer: 0,
      provider: 'Orion',
    },
    {
      id: 0,
      name: 'Panda Master',
      image: 'Images/game/PandaMaster.png',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 5,
      name: 'UltraPanda',
      image: 'Images/game/UltraPanda.png',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 6,
      name: 'VBLink',
      image: 'Images/game/Vblink.png',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 12,
      name: 'Yolo',
      image: 'Images/game/yolo.jpeg',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 13,
      name: 'CashMachine',
      image: 'Images/game/cash-machine-jackpots.jpg',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 0,
      name: 'Cards',
      image: 'Images/game/CardBrag.png',

      offer: 0,
      provider: 'Master Gaming',
    },
    {
      id: 0,
      name: 'Super Roulett',
      image: 'Images/game/SuperRoulett.png',

      offer: 0,
      provider: 'Master Gaming',
    },
  ];

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
      this.GetAllGames(false);
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
    this.GetAllGames(false);
  }

  getDisplayRange(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(start + this.itemsPerPage - 1, this.totalRecords);
    return `${start} – ${end}`;
  }
  // TS Code for Pagination End

  //? For Grid View
  @ViewChild('gamesGrid', { static: false }) gamesGrid!: ElementRef;
  onGridViewScroll(): void {
    // console.log('scrolling');
    const chatListElement = this.gamesGrid.nativeElement;
    if (
      chatListElement.offsetHeight + chatListElement.scrollTop + 1 >=
      chatListElement.scrollHeight
    ) {
      this.currentPage++;
      this.GetAllGames(false);
    }
  }

  //? For Table View
  @ViewChild('gamesTable', { static: false }) gamesTable!: ElementRef;
  onTableViewScroll(): void {
    // console.log('scrolling');
    const chatListElement = this.gamesTable.nativeElement;
    if (
      chatListElement.offsetHeight + chatListElement.scrollTop + 1 >=
      chatListElement.scrollHeight
    ) {
      this.currentPage++;
      this.GetAllGames(false);
    }
  }
  gameId: any;

  CheckRedeemRequest(): Promise<any> {
    this.loaderService.show();

    return new Promise((resolve, reject) => {
      const gameData = this.loaderService.getArrayInLocalStorage();
      var selectedGameData = gameData.find(
        (data: any) => data.GameName === this.selectedGame,
      );
      // Define the payload with customerID, gameId, and score
      const payload = {
        customerID: this.getCustomerID() || 0,
        gameId: selectedGameData.GameID || 0,
        score: this.score || 0,
      };

      this._apiCall
        .PostCallWithToken(payload, 'Redeem/CheckRadeemRequest')
        .subscribe({
          next: (response) => {
            if (response.responseCode === 200) {
              this.toastr.success(response.responseMessage, 'Success');
              this.loaderService.hide();
              resolve(response);
            } else {
              this.ErroHandling.handleResponseError(response);
            }
            // this.loaderService.hide();
          },
          error: (error) => {
            this.ErroHandling.handleHttpError(error);
          },
        });
    });
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

  accountTypeDropdownOpen = false;

  isAccountTypeSelected: boolean = false;
  onAccountTypeChange(game: any) {
    this.accountType = game.name;
    this.isAccountTypeSelected = true;
    this.updateAccountInfoValidation(this.isAccountTypeSelected);
    this.accountTypeDropdownOpen = false;
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
  }
  @HostListener('document:click')
  closeDropdown() {
    this.gameDropdownOpen = false;
  }

  redeemRules: RedeemRule[] = [
    {
      title: 'Minimum Points Required',
      description:
        'You must have at least 100 points in your account to initiate a redemption request.',
    },
    {
      title: 'Processing Time',
      description:
        'All redemption requests are processed within 5-7 business days. You will receive a confirmation email once approved.',
    },
    {
      title: 'Valid Account Information',
      description:
        'Ensure your account details (bank account/payment method) are up-to-date and verified before requesting redemption.',
    },
    {
      title: 'Non-Refundable Points',
      description:
        'Once points are redeemed, they cannot be reversed or refunded back to your account.',
    },
    {
      title: 'Transaction Fees',
      description:
        'A small processing fee of 2% may apply to redemptions. The final amount will be displayed before confirmation.',
    },
    {
      title: 'Point Expiration',
      description:
        'Points expire after 12 months of inactivity. Make sure to redeem your points before they expire.',
    },
    {
      title: 'Account Suspension',
      description:
        'Accounts found violating terms of service will be suspended, and pending redemptions may be cancelled.',
    },
  ];
}
