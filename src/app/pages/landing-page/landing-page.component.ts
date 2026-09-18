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
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SafeHtml } from '@angular/platform-browser';
import { MusicService } from '../../Services/music.service';
import { LandingPageService } from './landing-page.service';
import { GameService } from '../../Services/game.service';
import { UtilsService } from '../../Services/utils.service';

import { CasinoLandingComponent } from './casino-landing/casino-landing.component';
import { GamesLandingComponent } from './games-landing/games-landing.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { CustomerReviewsComponent } from './customer-reviews/customer-reviews.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { SpinComponent } from './spin/spin.component';
import { HeroSectionComponent } from './hero-section/hero-section.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CarouselModule,
    CommonModule,
    GamesLandingComponent,
    ContactUsComponent,
    HeroSectionComponent,
    AboutUsComponent,
    CustomerReviewsComponent,
    SpinComponent,
    FooterComponent
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
      title: 'Create Account',
      description: 'Quick 30-second sign up. No tedious paperwork to get started.',
    },
    {
      id: 'Deposit',
      number: '02',
      icon: 'fas fa-wallet',
      title: 'Instant Deposit',
      description: 'Instant zero-fee deposits via Crypto, Cards, or Apple Pay.',
    },
    {
      id: 'Enjoy',
      number: '03',
      icon: 'fas fa-gamepad',
      title: 'Play & Win',
      description: 'Choose from 500+ high-RTP slots, wheels, and table games.',
    },
    {
      id: 'Withdraw',
      number: '04',
      icon: 'fas fa-bolt',
      title: 'Instant Cashout',
      description: 'Withdraw your real money winnings directly in under 60 seconds.',
    },
  ];

  premiumFeatures = [
    {
      icon: 'fas fa-bolt',
      title: 'Sub-Minute Cashouts',
      description:
        'Zero waiting times. Withdraw your winnings directly to your wallet in under 60 seconds.',
      badge: '< 60 SECONDS',
    },
    {
      icon: 'fas fa-shield-halved',
      title: 'Provably Fair RNG',
      description:
        'Cryptographic client & server seeds ensure 100% transparent and verifiable gameplay.',
      badge: '256-BIT FAIR',
    },
    {
      icon: 'fas fa-dice',
      title: '500+ High-RTP Titles',
      description:
        'Industry-leading 98.5%+ average RTP across premium slots, wheels, and live tables.',
      badge: '99.8% RTP',
    },
    {
      icon: 'fas fa-headset',
      title: '24/7 VIP Concierge',
      description:
        'Direct live chat assistance and dedicated personal account managers around the clock.',
      badge: 'LIVE 24/7',
    },
  ];

  promoOffers = [
    {
      icon: 'fas fa-crown',
      tag: 'Welcome Pack',
      title: '150% First Deposit Bonus',
      description:
        'Double your bankroll instantly up to $1,500 + 50 Free Spins on your first deposit.',
      perk: 'Instant Credit',
    },
    {
      icon: 'fas fa-dharmachakra',
      tag: 'Daily Perk',
      title: 'Free Daily Wheel Spins',
      description:
        'Log in every 24 hours to claim guaranteed free matrix spins with cash multipliers.',
      perk: 'Guaranteed Prize',
    },
    {
      icon: 'fas fa-coins',
      tag: 'VIP Cashback',
      title: 'Up to 20% Weekly Rakeback',
      description:
        'Get rewarded win or lose. Automatic rakeback credited directly to your player wallet.',
      perk: 'Zero Wager',
    },
    {
      icon: 'fas fa-users',
      tag: 'Refer & Earn',
      title: 'VIP Referral Bounty',
      description:
        'Earn $50 instantly + lifetime 10% revenue share for every friend who joins and plays.',
      perk: 'Lifetime Pay',
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

  trackByImage(index: number, img: string) {
    return img + '-' + index;
  }

  // Real game artwork (same catalog as the Elite Games grid), repeated so
  // the track is always wider than the viewport — otherwise the seamless
  // loop point exposes empty background on wide screens.
  get marqueeImages() {
    const images = this.Games.map((game: any) => game.image).filter(
      (image: any) => !!image,
    );
    return [...images, ...images];
  }
}
