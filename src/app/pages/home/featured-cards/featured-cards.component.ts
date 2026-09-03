import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { LoaderService } from '../../../Services/loader-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-featured-cards',
  imports: [CommonModule, CarouselModule],
  templateUrl: './featured-cards.component.html',
  styleUrl: './featured-cards.component.scss',
})
export class FeaturedCardsComponent {
  cardsOpen = true;
  stripsOpen = true;

  constructor(
    private router: Router,
    private apiCallService: ApiCallService,
    private _loaderService: LoaderService,
    private ErroHandling: ErrorhandlingService,
  ) {}
  showReferralInsect = true;

  ngOnInit() {
    this.getGameNews();
  }

  toggleCards() {
    this.cardsOpen = !this.cardsOpen;
  }

  toggleStrips() {
    this.stripsOpen = !this.stripsOpen;
  }

  // Navigation handler

  openModule(key: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    switch ((key || '').toLowerCase()) {
      case 'aviatar':
        this.navigateAndScroll('/dashboard/Avaitar');
        break;
      case 'lottery':
        this.navigateAndScroll('/dashboard/lottery');
        break;
      case 'scratch':
        this.navigateAndScroll('/dashboard/SectrechCards');
        break;
      case 'spinner':
        this.navigateAndScroll('/dashboard/spinner');
        break;
      default:
        console.warn('[openModule] Unknown module key:', key);
        break;
    }
  }

  redirectTo(link: string) {
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      this.router.navigate([link]);
    }
  }

  private navigateAndScroll(path: string) {
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

  // Api CAlll For Hitiing Hot Games

  HotSpinner: any;
  HotLottery: any;
  HotSctrach: any;
  gameOffers: any;

  hotBadges: Record<string, string> = {};

  getGameNews() {
    this._loaderService.show();
    const token = localStorage.getItem('token');

    if (token) {
      this.apiCallService
        .GetCallWithToken('TestImonials/GetHotHittingGames')
        .subscribe(
          (response) => {
            if (response && response.responseCode === 200) {
              this._loaderService.hide();
              this.gameOffers = response.data; // array of games
              this._loaderService.hide();

              this.gameOffers.forEach((game: any) => {
                if (
                  game.GameName === 'Spinner' ||
                  game.GameName === 'Lottery' ||
                  game.GameName === 'ScratchCard'
                ) {
                  this.hotBadges[game.GameName] = game.Text;
                }
              });

              // Check each game in the response
              // this.gameOffers.forEach((game: any) => {
              //   if (game.GameName === 'Spinner') {
              //     this.HotSpinner = game.Text;
              //   } else if (game.GameName === 'Lottery') {
              //     this.HotLottery = game.Text;
              //   } else if (game.GameName === 'ScratchCard') {
              //     this.HotSctrach = game.Text;
              //   }
              // });

              // Save in local storage
              this._loaderService.setArrayInLocalStorage(
                'bis_offer',
                this.gameOffers,
              );
            } else {
              this._loaderService.hide();
              this.ErroHandling.handleResponseError(response);
            }
          },
          (error) => {
            this._loaderService.hide();
            this.ErroHandling.handleHttpError(error);
          },
        );
    }
  }

  carouselOptions = {
    loop: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    dots: true,
    nav: false,
    margin: 8,
    responsive: {
      0: {
        items: 1,
      },
      480: {
        items: 1,
      },
      640: {
        items: 2,
      },
      1024: {
        items: 4,
      },
    },
  };

  cards = [
    {
      key: 'aviatar',
      title: 'Aviatar',
      subtitle: 'Flying to win',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/aviator.png',
      gradient: 'from-[#2a1f3d] via-[#4b2d7f] to-[#6a4bc0]',
      hotKey: 'Aviatar',
    },
    {
      key: 'spinner',
      title: 'Spin',
      subtitle: 'Spin to win',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/spinner.png',
      gradient: 'from-[#003f41] via-[#006b6f] to-[#00a4a8]',
      hotKey: 'Spinner',
    },
    {
      key: 'lottery',
      title: 'Lottery',
      subtitle: 'Try your luck with numbers',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/lottery.png',
      gradient: 'from-[#3d0046] via-[#7a1da1] to-[#d474ff]',
      hotKey: 'Lottery',
    },
    {
      key: 'scratch',
      title: 'Scratch',
      subtitle: 'Instant wins await',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/scratch.png',
      gradient: 'from-[#422800] via-[#b45f00] to-[#ffae00]',
      hotKey: 'ScratchCard',
    },
    {
      key: 'aviatar',
      title: 'Aviator',
      subtitle: 'Flying to win',
      image: 'https://cmaxv2images2.pages.dev/assets/icons/aviator.png',
      gradient: 'from-[#2a1f3d] via-[#4b2d7f] to-[#6a4bc0]',
      hotKey: 'Aviatar',
    },
  ];
}
