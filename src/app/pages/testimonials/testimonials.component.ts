import { Component } from '@angular/core';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { CarouselModule, OwlOptions } from 'ngx-owl-carousel-o';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-testimonials',
  imports: [CarouselModule, CommonModule, NgxSkeletonLoaderModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
})
export class TestimonialsComponent {
  constructor(
    private apiCallService: ApiCallService,
    private ErrorHandling: ErrorhandlingService,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.getTestimonials();
  }

  testimonialsImages: any[] = [];
  getTestimonials() {
    const payload = null;
    const apiRoute = 'Public/GetTestImonialsApp';

    this.apiCallService.PostCallWithToken(payload, apiRoute).subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          // console.log('Testimonials Data:', response.data);
          this.testimonialsImages = response.data;
        } else {
          this.ErrorHandling.handleResponseError(response);
        }
      },
      (error) => {
        this.ErrorHandling.handleHttpError(error);
      }
    );
  }

  trackBySlide(index: number, item: any) {
    return item.id;
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
        items: 1,
      },
    },
    nav: false,
  };
}
