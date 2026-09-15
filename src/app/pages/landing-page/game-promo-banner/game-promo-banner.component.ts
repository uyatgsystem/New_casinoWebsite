import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router } from '@angular/router';
import { OwlOptions } from 'ngx-owl-carousel-o';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { register } from 'swiper/element/bundle';
import {GameService} from "../../../Services/game.service";

@Component({
  selector: 'app-game-promo-banner',
  imports: [CarouselModule, CommonModule],
  templateUrl: './game-promo-banner.component.html',
  styleUrls: ['./game-promo-banner.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GamePromoBannerComponent implements AfterViewInit {
  private swiperEl: any;

  logos :any= [];

    loadLogosFromService(): void {
        const games = this.gameService.getGames();
        this.logos = games.map((game: any, index: number) => ({
            uniqueId: `slide-${index + 1}`,
            src: game.image,
            alt: game.name || `Logo ${index + 1}`
        }));
    }

    customOptions: OwlOptions = {
    loop: true,
    autoplay: true,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 900,
    navText: ['Previous', 'Next'],
    responsive: {
      0: {
        items: 1,
      },
      400: {
        items: 1,
      },
      740: {
        items: 1,
      },
      940: {
        items: 4,
      },
    },
    nav: false,
  };

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
    private gameService: GameService,
  ) {
      this.loadLogosFromService();
    register();

    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  trackByFn(index: number, slide: any): string {
    return `${slide.uniqueId}-${index}`;
  }
  isBrowser: boolean;
  ngAfterViewInit() {
    // console.log('Game promo initialized');
  }
  breakpoints = {
    640: {
      slidesPerView: 1,

      spaceBetween: 10,
    },

    768: {
      slidesPerView: 2,

      spaceBetween: 20,
    },

    1024: {
      slidesPerView: 3,

      spaceBetween: 30,
    },
  };

  redirectToSignUp() {
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/dashboard/home']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
