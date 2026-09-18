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
    SpinComponent,
    AboutUsComponent,
    SpinnerComponent
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

  mainTabs: TabItem[] = [
    { id: 1, label: 'Games', value: 'games', scrollingId: 'games-scroll-id' },
    {
      id: 2,
      label: 'Instant Games',
      value: 'quick',
      scrollingId: 'quick-scrolling-id',
    },
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
      image: 'Plinko2.png',
      redirectLink: '/dashboard/Plinko',
      bgColor: '#10b981',
      titleColor: '#ffffff',
    },
    {
      id: 5,
      name: 'Aviator',
      image: 'Aviator2.png',
      redirectLink: '/dashboard/Avaitar',
      bgColor: '#059669',
      titleColor: '#ffffff',
    },
    {
      id: 12,
      name: 'Double',
      image: 'Double1.png',
      redirectLink: '/dashboard/Double',
      bgColor: '#db2777',
      titleColor: '#ffffff',
    },
    {
      id: 7,
      name: 'Roulette',
      image: 'Roulette1.png',
      redirectLink: '/dashboard/Roulette',
      bgColor: '#d97706',
      titleColor: '#ffffff',
    },
    {
      id: 4,
      name: 'Treasure',
      image: 'Treasure1.png',
      redirectLink: '/dashboard/TreasurePick',
      bgColor: '#0d9488',
      titleColor: '#ffffff',
    },
    {
      id: 18,
      name: 'Toss',
      image: 'Toss1.png',
      redirectLink: '/dashboard/coin',
      bgColor: '#65a30d',
      titleColor: '#ffffff',
    },
    {
      id: 6,
      name: 'Baccarat',
      image: 'Baccarat1.png',
      redirectLink: '/dashboard/Baccaret',
      bgColor: '#0891b2',
      titleColor: '#ffffff',
    },
    {
      id: 3,
      name: 'Scratch',
      image: 'Scratch1.png',
      redirectLink: '/dashboard/SectrechCards',
      bgColor: '#4f46e5',
      titleColor: '#ffffff',
    },
    {
      id: 8,
      name: 'Mines',
      image: 'https://spinhub-6rb.pages.dev/assets/mines.png',
      redirectLink: '/dashboard/Mines',
      bgColor: '#16a34a',
      titleColor: '#ffffff',
    },
    {
      id: 11,
      name: 'Keno',
      image: 'https://spinhub-6rb.pages.dev/assets/Keno.png',
      redirectLink: '/dashboard/Keno',
      bgColor: '#2563eb',
      titleColor: '#ffffff',
    },
    {
      id: 1,
      name: 'Spin',
      image: 'https://spinhub-6rb.pages.dev/assets/Spin.png',
      redirectLink: '/dashboard/spinner',
      bgColor: '#d97706',
      titleColor: '#ffffff',
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

    this.checkCurrentRoute();
    this.filterGames = [...this.allGames];
  }

  AddCaptchaPlayerModal: boolean = false;
  CloseCaptchaAddPlayer() {
    this.AddCaptchaPlayerModal = false;
    this.NewPlayerAddPayload.playerPassword = '';
    this.NewPlayerAddPayload.playerUserName = '';
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
  allGames: any[] = [];
  onSearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (term === '') {
      this.filterGames = [...this.allGames];
    } else {
      this.filterGames = this.allGames.filter((game) =>
        game.name.toLowerCase().includes(term),
      );
    }
  }

  games: any[] = [];
  sub!: Subscription;
  private routeSub!: Subscription;

  ngOnInit() {
    this.games = this.gameService.getGames();

    // A to Z unique non-repeating vibrant distinct colors palette
    const uniqueColors = [
      '#7c3aed', '#db2777', '#059669', '#d97706', '#2563eb', 
      '#4f46e5', '#0891b2', '#65a30d', '#dc2626', '#9333ea', 
      '#0d9488', '#ca8a04', '#e11d48', '#4f46e5', '#16a34a', 
      '#2563eb', '#9333ea', '#c026d3', '#0284c7', '#10b981',
      '#f59e0b', '#84cc16', '#6366f1', '#ec4899', '#14b8a6'
    ];

    this.games.forEach((game: any, index: number) => {
      game.bgclr = uniqueColors[index % uniqueColors.length];
      game.titleColor = '#ffffff'; // Always crisp white for maximum clarity and readability
    });

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
    return !!localStorage.getItem('token');
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
            this.games.forEach((game: any) => {
              const matchingOffer = this.gameOffers.find(
                (offer: any) => offer.GameName === game.name,
              );
              if (matchingOffer) {
                game.offer = matchingOffer.Percentage;
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

    if (matchedGame) {
      matchedGame.IsOnUpdate = matchedGameOffer
        ? matchedGameOffer.IsOnUpdate
        : 'False';
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
        this.OpenAddPlayer(details);
      } else {
        this.errorHandling.showAlert(
          'warning',
          'Game is under update!. Please try again later.',
        );
        return;
      }
    }
  }

  croswsIcon = faXmark;
  AddPlayerModal = false;
  CloseAddPlayer() {
    this.AddPlayerModal = false;
  }
  matchedGameDetails: any = null;

  NewPlayerAddPayload: any = {
    gameName: '',
    customerId: localStorage.getItem('customerId') || '',
    playerUserName: '',
    rechargeBalance: 0,
    playerPassword: '',
    gameId: 0,
  };

  OpenAddPlayer(details: any) {
    this.AddPlayerModal = true;
    this.NewPlayerAddPayload.playerPassword = '';
    this.NewPlayerAddPayload.playerUserName = '';
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
      this.NewPlayerAddPayload.playerPassword =
        this.NewPlayerAddPayload.playerPassword.charAt(0).toUpperCase() +
        this.NewPlayerAddPayload.playerPassword.slice(1);
    }
    this.apiCallService
      .PostCallWithToken(payload, 'AddGameScore/CreatePanelPlayer')
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.AddPlayerModal = false;
            if (!response?.data?.base64String) {
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
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const randomLetters =
      String.fromCharCode(97 + Math.floor(Math.random() * 26)) +
      String.fromCharCode(97 + Math.floor(Math.random() * 26));

    return `${prefix}${randomLetters}${randomDigits}`;
  }

  generateGameAccountIdentifier(CustomerName: string, gameId: any): string {
    let cleanedName = CustomerName.replace(/[^a-zA-Z0-9]/g, () => {
      return String.fromCharCode(97 + Math.floor(Math.random() * 26));
    });

    if (/^\d+$/.test(cleanedName)) {
      const randomChar1 = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      const randomChar2 = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      cleanedName = randomChar1 + randomChar2 + cleanedName.slice(2);
    }

    let prefix: string = cleanedName.slice(0, 5).toLowerCase();

    if (prefix.length < 5) {
      const charsNeeded = 5 - prefix.length;
      for (let i = 0; i < charsNeeded; i++) {
        prefix += String.fromCharCode(97 + Math.floor(Math.random() * 26));
      }
    }

    let gameInitials: string = this._utilsService.gameNameInitials(gameId);

    const digit1 = Math.floor(Math.random() * 10).toString();
    const digit2 = Math.floor(Math.random() * 10).toString();
    const letter = String.fromCharCode(97 + Math.floor(Math.random() * 26));

    let components = [digit1, digit2, letter];
    for (let i = components.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [components[i], components[j]] = [components[j], components[i]];
    }

    const randomPart = components.join('');
    return `${prefix}${randomPart}${gameInitials}`;
  }

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