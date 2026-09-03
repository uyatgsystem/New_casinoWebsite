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
    // this.getTestimonials();
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

  testimonialsImages: any[] = 
  [
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
    // {
    //   Name: "",
    //   Description: "Stack higher to win more.",
    //   ImageUrl: "https://bannerscmaxs.pages.dev/assets/stack.png",
    //   Route: "StackBuilder",
    //   ImageBase64: "https://bannerscmaxs.pages.dev/assets/stack.png",
    //    lookup: "Treasure"
    // },
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
            // console.log('Testimonials Data:', response.data);
            this.testimonialsImages.push(...response.data);
            //? add isLoading attribute
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
      0: {
        items: 1,
        stagePadding: 0,
        margin: 0,
      },
      480: {
        items: 1,
        stagePadding: 0,
        margin: 0,
      },
      640: {
        items: 1,
        stagePadding: 0,
        margin: 0,
      },
      768: {
        items: 1,
        stagePadding: 0,
        margin: 0,
      },
      1024: {
        items: 1,
        stagePadding: 0,
        margin: 0,
      },
    },
    nav: false,
  };
  textName: string = '';

  /**
   * Navigate to a route and scroll to top with smooth animation when navigation completes.
   */
  private navigateAndScroll(path: string) {
    // `navigate` returns a Promise<boolean> that resolves when navigation succeeds/fails
    this.router
      .navigate([path])
      .then((navigated) => {
        if (navigated) {
          this.scrollToTopSmooth();
        }
      })
      .catch(() => {
        // On error, still attempt to scroll to top as a fallback
        this.scrollToTopSmooth();
      });
  }

  /** Smooth scroll to top with graceful fallback. */
  private scrollToTopSmooth(): void {
    try {
      // Use smooth scrolling when supported
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      // Fallback for older browsers/environments
      try {
        window.scrollTo(0, 0);
      } catch {
        // ignore
      }
    }
  }

  isdownloadApps: boolean = false;

  onPlayNow(name: any) {
    // 2. Retrieve and parse data from LocalStorage
    const storedGames = JSON.parse(localStorage.getItem('bis_offer') || '[]');
    // 3. Find the specific game in the stored array
    // Ensure the name in quickGames matches the GameName in your local storage
    const gameStatus = storedGames.find((g: any) => g.GameName === name.lookup);
    // 4. Check if game is on update
    if (gameStatus && gameStatus.IsOnUpdate === 'True') {
      // Show error (e.g., Alert, Snackbar, or Toast)
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
