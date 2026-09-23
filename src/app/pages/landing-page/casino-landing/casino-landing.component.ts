import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { ChangeDetectorRef } from '@angular/core';

import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ToastrService } from 'ngx-toastr';
import { GameService } from '../../../Services/game.service';
import { LoaderService } from '../../../Services/loader-service.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { UtilsService } from '../../../Services/utils.service';
import { Subject, takeUntil } from 'rxjs';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { ReferalCtaComponent } from '../../../common/referal-cta/referal-cta.component';

@Component({
  selector: 'app-casino-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CarouselModule,
    FontAwesomeModule,
    FormsModule,
    NgxSkeletonLoaderModule,
    ReferalCtaComponent
  ],
  templateUrl: './casino-landing.component.html',
  styleUrl: './casino-landing.component.scss',
})
export class CasinoLandingComponent implements OnInit {
  constructor(
    private _apiCall: ApiCallService,
    private router: Router,
    private toastr: ToastrService,
    private gameService: GameService,
    private fb: FormBuilder,
    private ErroHandling: ErrorhandlingService,
    private _loaderService: LoaderService,
    private breakpointObserver: BreakpointObserver,
    private _utilsService: UtilsService,
  ) {}

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Use the same proven Quick Win Casino games/logos (spinhub-6rb.pages.dev) used
    // elsewhere in the app, so every slide reliably shows its own correct logo.
    // Their PNGs carry a lot of internal transparent padding, so zoom the icon in —
    // except Spin, whose logo is already sized right.
    const quickWinSlides = this.gameService.getQuickWinGames().map((g: any) => ({
      ...g,
      iconZoom: g.name !== 'Spin',
    }));

    // Plus 12 Elite Games (panel games are launched via the Add Player flow on
    // their own card, so route these slides to the dashboard where that lives).
    // Keep their logo at its original (unzoomed) size.
    const eliteSlides = this.gameService
      .getGames()
      .slice(0, 12)
      .map((g: any) => ({
        name: g.name,
        image: g.image,
        redirectLink: '/dashboard/home',
        iconZoom: false,
      }));

    this.heroGames = [...quickWinSlides, ...eliteSlides];
  }

  // Hero banner games array
  heroGames: any[] = [];

  playHeroGame(link: string): void {
    if (link) {
      this.navigateAndScroll(link);
    }
  }

  quickLaunch(path: string): void {
    this.navigateAndScroll(path);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  croswsIcon = faXmark;
  AddPlayerNameModal = false;
  AddPlayerModal = false;
  captchaImages: any;
  captchaCode: any;

  allowedGames: string[] = [];
  gameAccounts: any;
  GameName: any;
  matchedGameDetails: any = null;

  testimonialsImages: any[] = [
    {
      Name: '',
      Description: 'Fly high and cash out big.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/avitr.png',
      Route: 'Avaitar',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/avitr.png',
      lookup: 'aviator',
    },
    {
      Name: '',
      Description: 'Elite card gaming at its best.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/baccaret.png',
      Route: 'Baccaret',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/baccaret.png',
      lookup: 'bacchrat',
    },
    {
      Name: '',
      Description: 'Pick numbers, win instant prizes.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/keno.png',
      Route: 'Keno',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/keno.png',
      lookup: 'kino',
    },
    {
      Name: '',
      Description: 'Avoid bombs for massive multipliers.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/mines.png',
      Route: 'Mines',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/mines.png',
      lookup: 'Mines',
    },
    {
      Name: '',
      Description: 'Drop the ball, win big.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/plinko.png',
      Route: 'Plinko',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/plinko.png',
      lookup: 'Plinko',
    },
    {
      Name: '',
      Description: 'Spin the wheel of fortune.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/roulet.png',
      Route: 'Roulette',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/roulet.png',
      lookup: 'roulette',
    },
    {
      Name: '',
      Description: 'Scratch and reveal instant wealth.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/scrach.png',
      Route: 'SectrechCards',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/scrach.png',
      lookup: 'scratch',
    },
    {
      Name: '',
      Description: 'One spin can change everything.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/spin.png',
      Route: 'spinner',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/spin.png',
      lookup: 'spinner',
    },
    {
      Name: '',
      Description: 'Fast-paced action, legendary rewards.',
      ImageUrl: 'https://bannerscmaxs.pages.dev/assets/traseur.png',
      Route: 'TreasurePick',
      ImageBase64: 'https://bannerscmaxs.pages.dev/assets/traseur.png',
      lookup: 'Treasure',
    },
  ];

  isMobileScreen: boolean = false;

  getTestimonials() {
    const payload = null;
    const apiRoute = 'Public/GetTestImonialsApp';

    this._apiCall
      .PostCallWithToken(payload, apiRoute)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (response) => {
          if (response && response.responseCode === 200) {
            this.testimonialsImages.push(...response.data);
            this.testimonialsImages.forEach((testimonial) => {
              testimonial.isLoading = true;
            });
          } else {
            this.ErroHandling.handleResponseError(response);
          }
        },
        (error) => {
          this.ErroHandling.handleHttpError(error);
        },
      );
  }

  gameOffers: any;
  HotLottery: any;
  HotSctrach: any;
  HotSpinner: any;

  customOptions: OwlOptions = {
    loop: true,
    autoplay: true,
    autoplayTimeout: 5000,
    autoplayHoverPause: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 700,
    navText: [
      '<span class="sr-only">Previous</span>',
      '<span class="sr-only">Next</span>',
    ],
    margin: 0,
    stagePadding: 0,
    responsive: {
      0: { items: 1, stagePadding: 0, margin: 0 },
      480: { items: 1, stagePadding: 0, margin: 0 },
      640: { items: 1, stagePadding: 0, margin: 0 },
      768: { items: 1, stagePadding: 0, margin: 0 },
      1024: { items: 1, stagePadding: 0, margin: 0 },
    },
    nav: false,
  };

  textName: string = '';

  private navigateAndScroll(path: string) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      this.router.navigate(['/login'], { queryParams: { redirectUrl: path } });
      return;
    }
    this.router
      .navigate([path])
      .then((navigated) => {
        if (navigated) {
          this.scrollToTopSmooth();
        }
      })
      .catch(() => {
        this.scrollToTopSmooth();
      });
  }

  private scrollToTopSmooth(): void {
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      try {
        window.scrollTo(0, 0);
      } catch {}
    }
  }

  isdownloadApps: boolean = false;

  onPlayNow(name: any) {
    const storedGames = JSON.parse(localStorage.getItem('bis_offer') || '[]');
    const gameStatus = storedGames.find((g: any) => g.GameName === name.lookup);
    if (gameStatus && gameStatus.IsOnUpdate === 'True') {
      this.toastr.warning(
        'warning',
        'Game is under update!. Please try again later.',
      );
      return;
    }

    const targetRoute = name.Route || '';
    if (targetRoute !== '') {
      this.navigateAndScroll(`/dashboard/${targetRoute}`);
    } else {
      console.warn('[openModule] Unknown module key:', targetRoute);
    }
  }

  getTestimonialsImages = [];
}