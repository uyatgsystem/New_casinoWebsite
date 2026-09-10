import {
  Component,
  ViewEncapsulation,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { GameCard } from '../../../Interfaces/interfaces';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoaderService } from '../../../Services/loader-service.service';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  TabNavigationComponent,
  TabItem,
} from '../../../components/tab-navigation/tab-navigation.component';
import { UtilsService } from '../../../Services/utils.service';
import { LotteryCardComponent } from '../../lottery/lottery-card/lottery-card.component';
import { LotteryCardsComponent } from '../../../components/lottery-cards/lottery-cards.component';
import { SectrechCardListComponent } from '../../../dashboard/Sectrech Cards/sectrech-card-list/sectrech-card-list.component';
import { LotteryWinnersComponent } from '../lottery-winners/lottery-winners.component';
import { LotteryLandingComponent } from '../lottery-landing/lottery-landing.component';
import { GamePromoBannerComponent } from '../game-promo-banner/game-promo-banner.component';
import { LandingCaroselComponent } from '../landing-carosel/landing-carosel.component';
import { ShiningStarsOfGamesComponent } from '../shining-stars-of-games/shining-stars-of-games.component';
import { CmaxGamesComponent } from '../cmax-games/cmax-games.component';
import { OnBoardingStepsComponent } from '../on-boarding-steps/on-boarding-steps.component';
import { SpinComponent } from '../spin/spin.component';
import { AboutUsComponent } from '../about-us/about-us.component';
import { JoinCommunityComponent } from '../join-community/join-community.component';
import { filter, Subscription } from 'rxjs';
import { SpinnerComponent } from '../../../components/spinner/spinner.component';
import { GameService } from '../../../Services/game.service';
import { LocationService } from '../../../Services/ip-check.service';

@Component({
  selector: 'app-games-landing',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgFor,
    FontAwesomeModule,
    RouterModule,
    SectrechCardListComponent,
    CmaxGamesComponent,
    OnBoardingStepsComponent,
    SpinComponent,
    AboutUsComponent,
    SpinnerComponent,
  ],
  templateUrl: './games-landing.component.html',
  styleUrl: './games-landing.component.scss',
})
export class GamesLandingComponent {
  scoreForm!: FormGroup;
  scoreCaptchaForm!: FormGroup;
  searchTerm: string = '';
  selectedMainTab: string = 'games';
  isLandingPage: boolean = true;
  // selectedLotteryTab: string = 'lotteries';

  mainTabs: TabItem[] = [
    { id: 1, label: 'Games', value: 'games', scrollingId: 'games-scroll-id' },
    {
      id: 2,
      label: 'Instant Games',
      value: 'quick',
      scrollingId: 'quick-scrolling-id',
    },
    // {
    //   id: 3,
    //   label: 'Lotteries',
    //   value: 'lotteries',
    //   scrollingId: 'lottriesScrollSection',
    // },
    {
      id: 4,
      label: 'Scratch Cards',
      value: 'scratch-cards',
      scrollingId: 'scratchScrollSection',
    },
    { id: 5, label: 'Spin', value: 'spin', scrollingId: 'spin-scrolling-id' },
  ];

  displayMainTabs: TabItem[] = [];

  lotteryTab: TabItem[] = [{ id: 2, label: '', value: 'lotteries' }];

  quickGames: any[] = [
    {
      id: 9,
      name: 'Plinko',
      image: 'https://spinhub-6rb.pages.dev/assets/Plinko.png',
      redirectLink: '/dashboard/Plinko',
      bgColor: '#c8c100', // green
    },
    {
      id: 5,
      name: 'Aviator',
      image: 'https://spinhub-6rb.pages.dev/assets/Aviator.png',
      redirectLink: '/dashboard/Avaitar',
      bgColor: '#00d5a7', // red
    },
    {
      id: 12,
      name: 'Double',
      image: 'https://spinhub-6rb.pages.dev/assets/Double.png',
      redirectLink: '/dashboard/Double',
      bgColor: '#f883bd',
    },

    {
      id: 7,
      name: 'Roulette',
      image: 'https://spinhub-6rb.pages.dev/assets/Roulette.png',
      redirectLink: '/dashboard/Roulette',
      bgColor: '#f8b678', // green
    },
    {
      id: 4,
      name: 'Treasure',
      image:
        'https://spinhub-6rb.pages.dev/assets/Treasure.png',
      redirectLink: '/dashboard/TreasurePick',
      bgColor: '#a0fdde', // purple
    },
    {
      id: 18,
      name: 'Toss',
      image:
        'https://spinhub-6rb.pages.dev/assets/toss.png',
      redirectLink: '/dashboard/coin',
      bgColor: '#caff09', // green
    },
    {
      id: 6,
      name: 'Baccarat',
      image:
        'https://spinhub-6rb.pages.dev/assets/baccarat.png',
      redirectLink: '/dashboard/Baccaret',
      bgColor: '#00ACC1', // cyan
    },
    {
      id: 2,
      name: 'Lottery',
      image:
        '/lottery.png',
      redirectLink: '/dashboard/lottery',
      bgColor: '#4394b9', // green
    },

    {
      id: 3,
      name: 'Scratch',
      image:
        'https://spinhub-6rb.pages.dev/assets/scratch.png',
      redirectLink: '/dashboard/SectrechCards',
      bgColor: '#eefcbb', // blue
    },

    {
      id: 8,
      name: 'Mines',
      image: 'https://spinhub-6rb.pages.dev/assets/mines.png',

      redirectLink: '/dashboard/Mines',
      bgColor: '#a6ebaf', // green
    },

    // {
    //   id: 10,
    //   name: 'Stack Builder',
    // image: 'Images/stack-builder.png',
    //   redirectLink: '/dashboard/StackBuilder',
    //   bgColor: '#50c800', // green

    // },
    {
      id: 11,
      name: 'Keno',
      image: 'https://spinhub-6rb.pages.dev/assets/Keno.png',

      redirectLink: '/dashboard/Keno',
      bgColor: '#09b9ff', // green
    },
    {
      id: 1,
      name: 'Spin',
      image:
        'https://spinhub-6rb.pages.dev/assets/Spin.png',
      redirectLink: '/dashboard/spinner',
      bgColor: '#FFB300', // gold/orange
    },

  ];

  redirectTo(link: string) {
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      this.router.navigate([link]);
    }
  }
  AsianLocalBlock: boolean = true;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private apiCallService: ApiCallService,
    private errorHandling: ErrorhandlingService,
    private _loaderService: LoaderService,
    private fb: FormBuilder,
    private gameService: GameService,
    private breakpointObserver: BreakpointObserver,
    private _utilsService: UtilsService,
    private locationService: LocationService,
  ) {
    this.isLandingPage = this.router.url === '/';

    this.routeSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkCurrentRoute();
      });

    // Run once initially
    this.checkCurrentRoute();
    this.filterGames = [...this.allGames];
  }
  AddCaptchaPlayerModal: boolean = false;
  CloseCaptchaAddPlayer() {
    this.AddCaptchaPlayerModal = false;
    this.NewPlayerAddPayload.playerPassword = '';
    //this.NewPlayerAddPayload.check_pwd = '';
    // this.NewPlayerAddPayload.t = 0;
    this.NewPlayerAddPayload.playerUserName = '';
    //this.NewPlayerAddPayload.agentcode = '';
  }
  get filteredGames() {
    return this.games.filter((game: any) => {
      const matchesSearch =
        !this.searchTerm ||
        game.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        game.provider
          .toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      return matchesSearch;
    });
  }

  filterGames: any[] = [];
  allGames: any[] = []; // sab games
  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (term === '') {
      // agar search empty hai to sab games wapas show karo
      this.filterGames = [...this.allGames];
    } else {
      // otherwise filter karo by name
      this.filterGames = this.allGames.filter((game) =>
        game.name.toLowerCase().includes(term),
      );
    }

  }

  games: any[] = [];
  sub!: Subscription;

  private routeSub!: Subscription;
  ngOnInit() {
    // this.scoreCaptchaForm = this.fb.group({
    //   captchaCode: ['', Validators.required],
    // });
    this.games = this.gameService.getGames();
    if (
      this._loaderService.getArrayInLocalStorage() &&
      this._loaderService.getArrayInLocalStorage()?.length > 0
    ) {
      this.gameAccounts = this._loaderService.getArrayInLocalStorage();
    } else if (this.isToken) {
      this.getGameAccount(0);
    }
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result: any) => {
        this.isMobileScreen = result.matches;
        this.updateDisplayedTabs();
      });
    this.games.forEach((game: any) => {
      const getPlayerGames = this._loaderService.getArrayInLocalStorage();
      const matchedGame = getPlayerGames.find(
        (matchingGame: any) => matchingGame.GameName === game.name,
      );
      game.buttonText = matchedGame ? 'Play Now' : 'Add Player';
    });
    this.scoreForm = this.fb.group({
      PlayerName: ['', Validators.required],
    });
    this.scoreCaptchaForm = this.fb.group({
      captchaCode: ['', Validators.required],
    });

    this.getGameNews();

    this._utilsService.getTriggerOfferHistoryObservable().subscribe(() => {
      this.getGameNews();
    });

    this.locationService.countryCode$
      .pipe(filter((code) => code !== null))
      .subscribe((code) => {
        console.log('CountryCode:', code);
        if (code === 'US') {
          this.AsianLocalBlock = true;
        }
      });
  }

  updateDisplayedTabs() {
    this.displayMainTabs = this.isMobileScreen
      ? this.mainTabs.slice(0, 2)
      : this.mainTabs;
  }

  toggleShowAllScratch() {
    if (this.router.url === '/dashboard/SectrechCards') {
      return;
    }
    this.router.navigate(['/dashboard/SectrechCards']);
  }
  checkCurrentRoute() {
    // Get current route path
    const currentUrl = this.router.url;
    const dashboardRoutes = ['/dashboard/home'];
    this.isDashboardPage = dashboardRoutes.some((path) =>
      currentUrl.includes(path),
    );
  }
  visibleGamesCount = 8;
  isDashboardPage: boolean = false;
  @ViewChild('gamesContainer') gamesContainer!: ElementRef;

  showMoreGames() {
    const increment = 4;
    this.visibleGamesCount = Math.min(
      this.visibleGamesCount + increment,
      this.games.length,
    );
  }

  showLessGames() {
    this.visibleGamesCount = 8;
    this.scrollToTop();
  }

  scrollToTop() {
    this.gamesContainer.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  get isToken(): boolean {
    return !!localStorage.getItem('token'); // returns true if token exists, false otherwise
  }

  redirectToSignUp() {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }
  getGameOffers() {
    this.apiCallService
      .GetCallWithoutToken('Public/GetOfferPercentage')
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            const apiGameData = response.data;

            this.games.forEach((game: any) => {
              const matchingOffer = apiGameData?.find(
                (offer: any) => offer.GameName === game.name,
              );

              if (matchingOffer) {
                game.offer = matchingOffer.Percentage;
              }
            });
          } else {
            this.errorHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.errorHandling.handleHttpError(error);
        },
      });
  }

  get displayedGames() {
    return this.filteredGames;
  }

  getCustomerID(): string | null {
    return localStorage.getItem('customerId');
  }
  getCustomerName(): string {
    return localStorage.getItem('userName') || '';
  }

  gameOffers: any;
  getGameOffersWithToken() {
    this._loaderService.show();
    this.apiCallService
      .GetCallWithToken(
        'Offer/GetOfferPercentage?customerId=' + this.getCustomerID(),
      )
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.gameOffers = response.data;
            this._loaderService.hide();
            // Assuming `this.games` is the array where you want to patch the Percentage
            this.games.forEach((game: any) => {
              const matchingOffer = this.gameOffers.find(
                (offer: any) => offer.GameName === game.name,
              );
              // const getPlayerGames = this._loaderService.getArrayInLocalStorage();
              // const matchedGame = getPlayerGames.find(
              //   (matchingGame: any) => matchingGame.GameName === game.name
              // );
              // game.buttonText = matchedGame ? 'Play Now' : 'Add Player';
              if (matchingOffer) {
                game.offer = matchingOffer.Percentage; // Patch the percentage
              }
            });
            this._loaderService.setArrayInLocalStorage(
              'bis_offer',
              this.gameOffers,
            );
          } else {
            this._loaderService.hide();
            this.errorHandling.handleResponseError(response);
          }
        },
        (error) => {
          this._loaderService.hide();
          this.errorHandling.handleHttpError(error);
        },
      );
  }

  isMobileScreen: boolean = false;
  isMobile(): boolean {
    return this.isMobileScreen;
  }
  openAddScoreModal(): void {
    this.AddPlayerNameModal = true;
  }
  AddPlayerNameModal: boolean = false;
  closeAddScoreModal(): void {
    this.AddPlayerNameModal = false;
    this.scoreForm.reset();
  }
  gameAccounts: any;

  allowedGames: string[] = [];
  getGameAccount(isAddPlayer: any) {
    const customerID = localStorage.getItem('customerId');
    const value = this.searchTerm?.trim() ? this.searchTerm : 'null';

    const payload = `Game/GetGameUserInfo?CustomerId=${customerID}&Search=${encodeURIComponent(value)}`;
    this.apiCallService.GetCallWithToken(payload).subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          this.gameAccounts = response.data;
          this._loaderService.setArrayInLocalStorage('bis_data', response.data);
          this.allowedGames = this.gameAccounts.map(
            (game: any) => game.GameName,
          );
          this.games.forEach((game: any) => {
            const getPlayerGames = response.data;
            const matchedGame = getPlayerGames.find(
              (matchingGame: any) => matchingGame.GameName === game.name,
            );
            game.buttonText = matchedGame ? 'Play Now' : 'Add Player';
          });
          if (isAddPlayer != 0) {
            const matchedGame = this.gameAccounts.find(
              (game: any) => game.GameName === isAddPlayer,
            );
            this.OnPlayNow(matchedGame);
          }
        } else {
          this.errorHandling.handleResponseError(response);
        }
      },
      (error) => {
        this.errorHandling.handleHttpError(error);
      },
    );
  }
  gamename: any;
  OnPlayNow(details: any): void {
    this.gamename = details.name;
    if (!this.isToken) {
      this.redirectToSignUp();
      return;
    }

    const matchedGame = this.gameAccounts.find(
      (game: any) =>
        game.GameName === details.name || game.GameName == details.GameName,
    );

    const gameOffer = this._loaderService.getArrayInLocalStorage('bis_offer');
    const matchedGameOffer = gameOffer.find(
      (game: any) =>
        game.GameName === details.name || game.GameName == details.GameName,
    );
    // const specialGames = ['GameVault', 'Juwa', 'Vegas', 'GameRoom'];

    if (matchedGame) {
      matchedGame.IsOnUpdate = matchedGameOffer
        ? matchedGameOffer.IsOnUpdate
        : 'False';
      // Game mil gaya, ab redirect
      localStorage.setItem('GN', matchedGame.GameName);
      this.matchedGameDetails = {
        SerialNumber: matchedGame.SerialNumber,
        PlayerId: matchedGame.PlayerId,
        PlayerName: matchedGame.PlayerName,
        PlayerPassword: matchedGame.PlayerPassword,
        GameName: matchedGame.GameName,
        GameID: matchedGame.GameID,
        IsOnUpdate: matchedGame.IsOnUpdate,
      };

      this.gameService.setGameData(this.matchedGameDetails);
      this.RedirecttoCredentials();
    } else {
      if (matchedGameOffer?.IsOnUpdate !== 'True') {
        this.OpenAddPlayer(details); //uncomment me
      } else {
        this.errorHandling.showAlert(
          'warning',
          'Game is under update!. Please try again later.',
        );
        return;
      }
      // this.RedirecttoCredentials(); // comment me

      // Game nahi mila
      // if (specialGames.includes(gameName)) {
      //   this.openAddScoreModal();
      //   this.toastr.info('Player is missing!', 'Info');
      // } else {
      //   this.OpenAddPlayer();
      //   this.toastr.info('Player is missing!', 'Info');
      // }
    }
  }
  croswsIcon = faXmark;
  AddPlayerModal = false;
  CloseAddPlayer() {
    this.AddPlayerModal = false;
  }
  matchedGameDetails: any = null;

  //   {
  //     "id": 3,
  //     "customerId": 2,
  //     "agentcode": "",
  //     "t": 0,
  //     "account": "ashan736gt",
  //     "nickname": "",
  //     "rechargeAmount": "",
  //     "login_pwd": "gtms5937",
  //     "check_pwd": "gtms5937",
  //     "gameName": "GoldenTreasure",
  //     "gameUserID": 0
  // }
  NewPlayerAddPayload: any = {
    gameName: '',
    customerId: localStorage.getItem('customerId') || '',
    playerUserName: '',
    rechargeBalance: 0,
    playerPassword: '',
    gameId: 0,
  };

  //   {
  //     "id": 24,
  //     "gameName": "LuckyStar",
  //     "customerID": 10050,
  //     "playerUserName": "harry2c5ls",
  //     "playerPassword": "Lsry2400",
  //     "rechargeBalance": 0,
  //     "gameId": 24
  // }
  OpenAddPlayer(details: any) {
    this.AddPlayerModal = true;
    this.NewPlayerAddPayload.playerPassword = '';
    // this.NewPlayerAddPayload.check_pwd = '';
    // this.NewPlayerAddPayload.t = 0;
    this.NewPlayerAddPayload.playerUserName = '';
    // this.NewPlayerAddPayload.agentcode = '';
    // this.payloadaddnewPlayer(details)
    this.NewPlayerAddPayload.gameName = details.name;
    this.NewPlayerAddPayload.gameId = details.id;
    this.NewPlayerAddPayload.customerId = localStorage.getItem('customerId') || '';
  }

  RedirectToSpinner() {
    this.router.navigate(['/dashboard/spinner']);
  }
  RedirecttoCredentials() {
    this.router.navigate(['/dashboard/credentials']);
  }

  onTabChange(selectedTab: TabItem) {
    this.selectedMainTab = selectedTab.value;

    // Scroll to the section smoothly
    const target = document.getElementById(selectedTab.scrollingId || '');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  captchaImages: any;
  onPlayerSubmit() {
    this._loaderService.show();
    const payload = this.NewPlayerAddPayload;
    payload.customerId = localStorage.getItem('customerId') || '';
    if (payload.playerUserName == '') {
      payload.playerUserName = this.generateGameAccountIdentifier(
        this.getCustomerName(),
        payload.gameId,
      );
    }
    if (payload.playerPassword == '') {
      this.NewPlayerAddPayload.playerPassword = this.generateGameIdentifier(
        payload.gameId,
      );
      // this.NewPlayerAddPayload.playerPassword = this.NewPlayerAddPayload.playerPassword;
      this.NewPlayerAddPayload.playerPassword =
        this.NewPlayerAddPayload.playerPassword.charAt(0).toUpperCase() +
        this.NewPlayerAddPayload.playerPassword.slice(1);
    }
    // payload.agentcode =
    //   this.scoreCaptchaForm?.value?.captchaCode?.toString() || '';
    this.apiCallService
      .PostCallWithToken(payload, 'AddGameScore/CreatePanelPlayer')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.AddPlayerModal = false;

            if (response?.data?.base64String) {
              // this.AddCaptchaPlayerModal = true;
              // if (
              //   response?.data?.base64String?.startsWith(
              //     'data:image/png;base64,'
              //   )
              // ) {
              //   this.captchaImages = response?.data?.base64String;
              // } else {
              //   this.captchaImages =
              //     'data:image/png;base64,' + response.data.base64String;
              // }
              // this.NewPlayerAddPayload.t = Number(response?.data?.tCode);
              // this.OpenCaptchaAddPlayer(payload);
            } else {
              this.CloseCaptchaAddPlayer();
              this.getGameAccount(payload.gameName);
            }
            this._loaderService.hide();
          } else {
            this.errorHandling.handleResponseError(response);
            this.AddPlayerModal = false;
            this._loaderService.hide();
          }
        },
        (error) => {
          this.errorHandling.handleHttpError(error);
          this._loaderService.hide();
          this.AddPlayerModal = false;
        },
      );
  }

  generateGameIdentifier(gameId: number): string {
    let prefix: string = this._utilsService.gameNameInitials(gameId);
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // Generates a random 4-digit number
    const randomLetters =
      String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(97 + Math.floor(Math.random() * 26)); // Generates 2 random lowercase letters

    return `${prefix}${randomLetters}${randomDigits}`; // Combines prefix, random letters, and random digits
  }
  // generateGameAccountIdentifier(CustomerName: string, gameId: number): string {

  //   let prefix: string = CustomerName.slice(0, 5).toLowerCase();
  //   let gameInitials: string = this._utilsService.gameNameInitials(gameId);

  //   const randomDigits = Math.floor(100 + Math.random() * 900);
  //   const randomLetters =
  //     String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
  //     String.fromCharCode(97 + Math.floor(Math.random() * 26));

  //   return `${prefix}${randomDigits}${gameInitials}`;
  // }
  // generateGameAccountIdentifier(CustomerName: string, gameId: number): string {
  //   let cleanName = CustomerName.replace(/[^a-zA-Z0-9]/g, '');
  //   if (!cleanName) {
  //     cleanName = 'user';
  //   }
  //   let prefix: string = cleanName.slice(0, 5).toLowerCase();
  //   let gameInitials: string = this._utilsService.gameNameInitials(gameId);

  //   const randomDigits = Math.floor(100 + Math.random() * 900);

  //   const randomLetters =
  //     String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
  //     String.fromCharCode(97 + Math.floor(Math.random() * 26));

  //   return `${prefix}${randomDigits}${gameInitials}`;
  // }
  generateGameAccountIdentifier(CustomerName: string, gameId: any): string {
    // 1. Clean the name: Remove anything that isn't a letter or number
    let cleanedName = CustomerName.replace(/[^a-zA-Z0-9]/g, () => {
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    });

    // --- NEW FIX START ---
    // if only numbers
    if (/^\d+$/.test(cleanedName)) {
      // replce first 2 with alpahbet
      const randomChar1 = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      const randomChar2 = String.fromCharCode(97 + Math.floor(Math.random() * 26));

      cleanedName = randomChar1 + randomChar2 + cleanedName.slice(2);
    }
    // --- NEW FIX END ---

    // Then take the first 5 chars
    let prefix: string = cleanedName.slice(0, 5).toLowerCase();

    // 2. Pad if shorter than 5
    if (prefix.length < 5) {
      const charsNeeded = 5 - prefix.length;
      for (let i = 0; i < charsNeeded; i++) {
        prefix += String.fromCharCode(97 + Math.floor(Math.random() * 26));
      }
    }

    // 3. Get game initials
    let gameInitials: string = this._utilsService.gameNameInitials(gameId);

    // 4. Generate the 3 random components (2 digits, 1 letter)
    const digit1 = Math.floor(Math.random() * 10).toString();
    const digit2 = Math.floor(Math.random() * 10).toString();
    const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));

    // 5. Place them in an array and shuffle
    let components = [digit1, digit2, letter];
    for (let i = components.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [components[i], components[j]] = [components[j], components[i]];
    }

    // 6. Join the shuffled components and return
    const randomPart = components.join('');
    return `${prefix}${randomPart}${gameInitials}`;
  }
  ///////////////////////////Hitting Hot Games

  HotLottery: any;
  HotSctrach: any;
  HotSpinner: any;
  getGameNews() {
    if (this.isToken) {
      this._loaderService.show();
      this.apiCallService
        .GetCallWithToken('TestImonials/GetHotHittingGames')
        .subscribe(
          (response) => {
            if (response && response.responseCode === 200) {
              this.gameOffers = response.data;
              this._loaderService.hide();
              // Assuming `this.games` is the array where you want to patch the Percentage
              this.games.forEach((game: any) => {
                const matchingOffer = this.gameOffers.find(
                  (offer: any) => offer.GameName === game.name,
                );
                if (matchingOffer) {
                  game.isHot = matchingOffer.IsHot;
                  game.bonus = matchingOffer.Bonus;
                  if (matchingOffer.GameName === 'Spinner') {
                    this.HotSpinner = matchingOffer.IsHot;
                  } else if (matchingOffer.GameName === 'Lottery') {
                    this.HotLottery = matchingOffer.IsHot;
                  } else if (matchingOffer.GameName === 'ScratchCard') {
                    this.HotSctrach = matchingOffer.IsHot;
                  }
                }
              });
              this._loaderService.setArrayInLocalStorage(
                'bis_offer',
                this.gameOffers,
              );
            } else {
              this._loaderService.hide();
              this.errorHandling.handleResponseError(response);
            }
          },
          (error) => {
            this._loaderService.hide();
            this.errorHandling.handleHttpError(error);
          },
        );
    }
  }
}
