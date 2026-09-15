import { CommonModule } from '@angular/common';
import { afterNextRender, Component, ViewEncapsulation } from '@angular/core';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { isPlatformBrowser } from '@angular/common';
import { Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';


@Component({
  selector: 'app-landing-carosel',
  standalone: true,
  imports: [CommonModule, CarouselModule],
  templateUrl: './landing-carosel.component.html',
  styleUrls: ['./landing-carosel.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LandingCaroselComponent {
  constructor(
    // @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // customOptions: OwlOptions = {
  //   loop: true,
  //   autoplay: true,
  //   mouseDrag: true,
  //   touchDrag: true,
  //   pullDrag: true,
  //   dots: true,
  //   navSpeed: 900,
  //   navText: ['Previous', 'Next'],
  //   responsive: {
  //     0: {
  //       items: 1
  //     },
  //     400: {
  //       items: 2
  //     },
  //     740: {
  //       items: 3
  //     },
  //     940: {
  //       items: 4
  //     }
  //   },
  //   nav: false,
  //   items: 1,
  //   autoplayTimeout: 5000,
  //   smartSpeed: 1000,
  //   center: true
  // };

  customOptions: OwlOptions = {
    loop: false,
    mouseDrag: true,
    touchDrag: true,
    pullDrag: true,
    dots: false,
    navSpeed: 700,
    navText: ['', ''],
    responsive: {
      0: {
        items: 1
      },
      400: {
        items: 1
      },
      740: {
        items: 1
      },
      940: {
        items: 1
      }
    },
    nav: true
  }
  
  // slides = [
  //   { id: 1, src: '/Images/landing_1.png', heading: 'Spin and Win Big!', content: 'Take a spin and grab your chance to win exciting prizes instantly!' },
  //   { id: 2, src: '/Images/landing_2.png', heading: 'Explore Games!', content: 'Choose from a variety of exciting casino games and start your winning streak today!' },
  //   { id: 3, src: '/Images/landing_3.png', heading: 'Fast and Secure Transactions!', content: 'Deposit and withdraw your funds with ease, ensuring a seamless gaming experience!' }
  // ];

  ngOnInit() {
    // Force single item display
    // if (isPlatformBrowser(this.platformId)) {
    //   setTimeout(() => {
    //     const carousel = document.querySelector('.owl-carousel');
    //     if (carousel) {
    //       carousel.setAttribute('data-items', '1');
    //     }
    //   });
    // }
  }

  // trackById(index: number, slide: any): number {
  //   return slide.id;
  // }
}