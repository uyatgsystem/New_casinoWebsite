import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { LoaderService } from '../../../Services/loader-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { GameService } from '../../../Services/game.service';
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
    private gameService: GameService,
  ) {}
  showReferralInsect = true;

  ngOnInit() {
    this.buildCards();
    this.getGameNews();
  }

  // Build the Hero Banner from every Elite Games + Quick Win Casino game,
  // each using that exact game's own logo/color.
  buildCards() {
    const eliteCards = this.gameService.getGames().map((g: any) => ({
      key: g.name,
      title: g.name,
      subtitle: 'Play & Win',
      image: g.image,
      color1: g.bgclr || '#FE8912',
      color2: g.color2 || g.bgclr || '#FE8912',
      hotKey: g.name,
      scrollTo: 'games-scroll-id',
    }));

    // The hot-hitting-games API reports these under their older display names
    const hotKeyAlias: Record<string, string> = {
      Aviator: 'Aviatar',
      Spin: 'Spinner',
      Scratch: 'ScratchCard',
    };

    const quickWinCards = this.gameService.getQuickWinGames().map((g: any) => ({
      key: g.name,
      title: g.name,
      subtitle: 'Play & Win',
      image: g.image,
      color1: g.bgColor || '#FE8912',
      color2: g.bgColor || '#FE8912',
      hotKey: hotKeyAlias[g.name] || g.name,
      redirectLink: g.redirectLink,
    }));

    this.cards = [...eliteCards, ...quickWinCards];
  }

  trackByCardKey(index: number, card: any) {
    return card?.key ?? index;
  }

  toggleCards() {
    this.cardsOpen = !this.cardsOpen;
  }

  toggleStrips() {
    this.stripsOpen = !this.stripsOpen;
  }

  // Navigation handler
  onCardClick(card: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (card.redirectLink) {
      // Quick Win Casino games have a direct route
      this.navigateAndScroll(card.redirectLink);
    } else if (card.scrollTo) {
      // Elite Games are launched from their own card (Add Player flow) — scroll to that grid
      const el = document.getElementById(card.scrollTo);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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

  // Populated in buildCards() from Elite Games + Quick Win Casino
  cards: any[] = [];
}
