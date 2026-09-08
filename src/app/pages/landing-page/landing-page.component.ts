import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { CasinoLandingComponent } from './casino-landing/casino-landing.component';
import { GamesLandingComponent } from './games-landing/games-landing.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { CustomerReviewsComponent } from './customer-reviews/customer-reviews.component';
import { GamePromoBannerComponent } from './game-promo-banner/game-promo-banner.component';
import { OnBoardingStepsComponent } from './on-boarding-steps/on-boarding-steps.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { SubscribeNewslettergeComponent } from './subscribe-newsletterge/subscribe-newsletterge.component';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MusicService } from '../../Services/music.service';
import { LotteryCardsComponent } from './lottery-cards/lottery-cards.component';
import { LotteryWinnersComponent } from './lottery-winners/lottery-winners.component';
import { ShiningStarsOfGamesComponent } from './shining-stars-of-games/shining-stars-of-games.component';
import { HowItWorkComponent } from './how-it-work/how-it-work.component';
import { LandingPageService } from './landing-page.service';
import { SpinnerComponent } from './spinner/spinner.component';
import { SectrechCardListComponent } from '../../dashboard/Sectrech Cards/sectrech-card-list/sectrech-card-list.component';
import { SpinComponent } from './spin/spin.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';
import { HighlightCardComponent } from './highlight-card/highlight-card.component';
import { GameService } from '../../Services/game.service';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../Services/utils.service';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CarouselModule,
    CommonModule,
    CasinoLandingComponent,
    GamesLandingComponent,
    AboutUsComponent,
    CustomerReviewsComponent,
    GamePromoBannerComponent,
    OnBoardingStepsComponent,
    ContactUsComponent,
    SubscribeNewslettergeComponent,
    ShiningStarsOfGamesComponent,
    SpinnerComponent,
    SectrechCardListComponent,
    SpinComponent,
    HeroSectionComponent,
    FooterComponent,
    HighlightCardComponent,
  ],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss',
})
export class LandingPageComponent implements OnInit, AfterViewInit {
  private platformId = inject(PLATFORM_ID);
  isMobile: boolean = false;
  isLandingPage: boolean = true;
  activeLotteries: any = [];
  showSignupBonusPopup: boolean = true;
  selectedGuideCard: string = 'Register';
  grainBackdrop: SafeHtml = '';

  // Display data for the "How to Play" guide cards — ids match the existing
  // selectedGuideCard/selectGuideCard values, so behavior is unchanged.
  guideSteps = [
    {
      id: 'Register',
      number: '01',
      icon: 'fas fa-user-plus',
      title: 'Register',
      description: 'Sign up now and claim your welcome offer!',
    },
    {
      id: 'Deposit',
      number: '02',
      icon: 'fas fa-wallet',
      title: 'Deposit',
      description: 'Deposit now and claim your deposit offer!',
    },
    {
      id: 'Enjoy',
      number: '03',
      icon: 'fas fa-gamepad',
      title: 'Enjoy the Game',
      description: 'Start playing now and enjoy the experience!',
    },
    {
      id: 'Withdraw',
      number: '04',
      icon: 'fas fa-sack-dollar',
      title: 'Withdraw',
      description: 'Withdraw your winnings easily.',
    },
  ];

  premiumFeatures = [
    {
      icon: 'fas fa-dice',
      title: 'Premium Games',
      description:
        'Hundreds of premium slots, table games, and instant-wins crafted for real thrills.',
    },
    {
      icon: 'fas fa-gift',
      title: 'Daily Rewards',
      description:
        'Log in daily to claim exclusive bonuses, free spins, and cash rewards.',
    },
    {
      icon: 'fas fa-bolt',
      title: 'Fast & Easy Gameplay',
      description:
        'Smooth, lag-free gameplay that gets you from sign-up to spinning in seconds.',
    },
    {
      icon: 'fas fa-shield-halved',
      title: 'Secure Wallet',
      description:
        'Bank-level encryption keeps your deposits, withdrawals, and data fully protected.',
    },
    {
      icon: 'fas fa-bullseye',
      title: 'Exciting Promotions',
      description:
        'Regular tournaments, leaderboards, and limited-time offers to boost your wins.',
    },
    {
      icon: 'fas fa-mobile-screen-button',
      title: 'Mobile Friendly',
      description:
        'Play anywhere, anytime with a fully responsive experience on any device.',
    },
  ];

  promoOffers = [
    {
      icon: 'fas fa-crown',
      tag: 'New Players',
      title: 'Welcome Offer',
      description:
        'Kick off your journey with a boosted welcome bonus on your first deposit, ready to use across our top games.',
      color: 'gold',
    },
    {
      icon: 'fas fa-calendar-check',
      tag: 'Every Day',
      title: 'Daily Rewards',
      description:
        'Come back each day to claim free spins, bonus credits, and surprise rewards.',
      color: 'orange',
    },
    {
      icon: 'fas fa-fire',
      tag: 'Limited Time',
      title: 'Exciting Promotions',
      description:
        'Enjoy regularly refreshed promotions, tournaments, and leaderboard challenges.',
      color: 'amber',
    },
    {
      icon: 'fas fa-user-plus',
      tag: 'Refer & Earn',
      title: 'Referral Program',
      description:
        'Share Spin Club with friends and earn rewards together when they join and play.',
      color: 'deep',
    },
  ];

  constructor(
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private musicService: MusicService,
    private landingPageService: LandingPageService,
    private gameService: GameService,
    private _utills: UtilsService,
  ) {
    this.Games = this.gameService.getGames();
    this.grainBackdrop = this._utills.getGrainBackdrop();
  }
  Games: any = [];
  private interactionStarted = false;
  ngOnInit(): void {
    this.isLandingPage = this.router.url === '/';

    // Observe screen size changes
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });

    setTimeout(() => {
      this.startMusic();
    }, 3000);

    //? Add interaction listeners
    this.addInteractionListeners();

    this.landingPageService.getActiveLotteries().subscribe((data) => {
      this.activeLotteries = data;
    });
  }

  // Lightweight fade-in-on-scroll for `.reveal` elements across the page
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      const targets = document.querySelectorAll('.reveal');
      if (!targets.length) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 },
      );

      targets.forEach((el) => observer.observe(el));
    }, 0);
  }

  isSticky = false;
  showPopup = true;

  closePopup() {
    this.showPopup = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const triggerHeight = 120; // works on all screens
    this.isSticky = window.scrollY > triggerHeight;
  }

  isMobileMenuOpen = false;
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  RedirectToLogin(): void {
    this.router.navigate(['/login']);
  }

  RedirectToSignUp(): void {
    this.router.navigate(['/SignUp']);
  }

  closeSignupPopup(event: Event) {
    event.stopPropagation();
    this.showSignupBonusPopup = false;
  }

  selectGuideCard(card: string) {
    this.selectedGuideCard = card;
  }

  scrollTo(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -20;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  handleMobileNav(sectionId: string) {
    this.scrollTo(sectionId);
    this.isMobileMenuOpen = false;
  }

  addInteractionListeners() {
    if (!this.interactionStarted) {
      document.addEventListener('click', this.startMusicOnce, { once: true });
      document.addEventListener('mousemove', this.startMusicOnce, {
        once: true,
      });
      document.addEventListener('keydown', this.startMusicOnce, { once: true });
      this.interactionStarted = true;
    }
  }

  startMusicOnce = () => {
    this.startMusic();
    this.removeInteractionListeners();
  };

  removeInteractionListeners() {
    document.removeEventListener('mousemove', this.startMusicOnce);
    document.removeEventListener('scroll', this.startMusicOnce);
    document.removeEventListener('click', this.startMusicOnce);
  }

  ngOnDestroy() {
    this.removeInteractionListeners();
  }

  startMusic() {
    this.musicService.playMusic();
  }

  cardList = [
    {
      id: '01',
      title: 'Rome Treasury',
      subtitle: '$116 Million Win',
      amount: '$20',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      time: { hh: '03', mm: '03', ss: '03' },
    },
    {
      id: '02',
      title: 'Paris Vault',
      subtitle: '$90 Million Win',
      amount: '$15',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      time: { hh: '01', mm: '15', ss: '42' },
    },
    {
      id: '03',
      title: 'London Luck',
      subtitle: '$75 Million Win',
      amount: '$10',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      time: { hh: '05', mm: '45', ss: '22' },
    },
    {
      id: '04',
      title: 'Tokyo Draw',
      subtitle: '$110 Million Win',
      amount: '$25',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      time: { hh: '02', mm: '25', ss: '08' },
    },
    {
      id: '05',
      title: 'Dubai Jackpot',
      subtitle: '$98 Million Win',
      amount: '$30',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      time: { hh: '04', mm: '12', ss: '33' },
    },
    {
      id: '06',
      title: 'Vegas Vault',
      subtitle: '$120 Million Win',
      amount: '$40',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      time: { hh: '06', mm: '05', ss: '18' },
    },
  ];

  desktopImages = [
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/card.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/game-room.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/fire-kirin.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/e-game.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/dragon.png', // center
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/ace.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/dragon-2.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/cash-machine.png',
    'https://cmaxv2images.pages.dev/assets/games/carousel-game/dragn-game.png',
  ];

  trackByImage(index: number, img: string) {
    return img + '-' + index;
  }

  // Repeated 4x so the track is always wider than the viewport — otherwise
  // the seamless loop point exposes empty background on wide screens.
  get marqueeImages() {
    return [
      ...this.desktopImages,
      ...this.desktopImages,
      ...this.desktopImages,
      ...this.desktopImages,
    ];
  }
}
