import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../Services/loader-service.service';
import { GuideStep } from '../../../Interfaces/interfaces';
import { UtilsService } from '../../../Services/utils.service';
import { LoaderComponent } from '../../../components/loader/loader.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-buy-now',
  templateUrl: './buy-now.component.html',
  styleUrls: ['./buy-now.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LoaderComponent, FontAwesomeModule],
})
export class BuyNowComponent implements AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scratchArea') scratchAreaRef!: ElementRef<HTMLDivElement>;

  leftArrow = faChevronLeft;

  private ctx!: CanvasRenderingContext2D;
  isScratching = false;
  isRevealed = false;
  private lastPoint: { x: number; y: number } | null = null;
  cardData: any;
  grainBackdrop: SafeHtml = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiCallService: ApiCallService,
    private handleError: ErrorhandlingService,
    private toastr: ToastrService,
    private _loaderService: LoaderService,
    private _utils: UtilsService,
  ) {
    this.grainBackdrop = this._utils.getGrainBackdrop();
    this.route.params.subscribe((params) => {
      const rawData = params['cardData'];
      if (rawData) {
        try {
          this.cardData = JSON.parse(decodeURIComponent(rawData));
        } catch (error) {
          console.error('Invalid cardData format:', error);
          this.cardData = {
            title: 'Golden Fortune',
            price: '$20',
            prize: '$200',
          };
        }
      }
    });
  }
  ngAfterViewInit() {
    // this.showCongratulations();
    this.initCanvas();
    //  if (this.scratchVideo && this.scratchVideo.nativeElement) {
    //    this.scratchVideo.nativeElement.playbackRate = 0.5; // 0.5x speed (half speed)
    //  }
  }

  private initCanvas() {
    const canvas = this.canvasRef.nativeElement;
    const scratchArea = this.scratchAreaRef.nativeElement;
    canvas.width = scratchArea.offsetWidth;
    canvas.height = scratchArea.offsetHeight;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.fillStyle = '#e5e7eb';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  hasStarted: boolean = false;

  // Start Scratch ----------------------

  startScratching(event: MouseEvent | TouchEvent) {
    // this.isScratching = true;
    this.scratchTicket(event);
    if (!this.hasStarted) {
      this.hasStarted = true;
    }
  }

  scratch(event: MouseEvent | TouchEvent) {
    if (!this.isScratching) return;
    event.preventDefault();

    const point = this.getPoint(event);
    if (!point || !this.lastPoint) return;

    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.lineWidth = 40;
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
    this.ctx.lineTo(point.x, point.y);
    this.ctx.stroke();

    this.lastPoint = point;

    // Har scratch ke baad check karo
    this.checkScratchProgress();
  }

  private checkScratchProgress() {
    const canvas = this.canvasRef.nativeElement;
    const imageData = this.ctx.getImageData(0, 0, canvas.width, canvas.height);

    let transparentPixels = 0;
    const totalPixels = imageData.data.length / 4;

    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] === 0) {
        // alpha channel = 0 (transparent)
        transparentPixels++;
      }
    }

    const scratchedPercent = (transparentPixels / totalPixels) * 100;

    if (scratchedPercent >= 70 && !this.isRevealed) {
      this.BuyAndOpenScratchTicket();
      this.revealPrize();
      this.isScratching = false; // 70% pr scratch rok do
    }
  }

  ScratchProgress() {
    const canvas = this.canvasRef?.nativeElement;
    const imageData = this.ctx?.getImageData(0, 0, canvas.width, canvas.height);

    let transparentPixels = 0;
    const totalPixels = imageData?.data?.length / 4;

    for (let i = 0; i < imageData?.data?.length; i += 4) {
      if (imageData?.data?.[i + 3] === 0) {
        // alpha channel = 0 (transparent)
        transparentPixels++;
      }
    }

    const scratchedPercent = (transparentPixels / totalPixels) * 100;
    this.BuyAndOpenScratchTicket();
    this.revealPrize();
    // if (scratchedPercent >= 70 && !this.isRevealed) {
    //   this.BuyAndOpenScratchTicket();
    //   this.revealPrize();
    //   this.isScratching = false; // 70% pr scratch rok do
    // }
  }

  stopScratching() {
    this.isScratching = false;
    this.lastPoint = null;
  }

  private getPoint(
    event: MouseEvent | TouchEvent,
  ): { x: number; y: number } | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (event instanceof MouseEvent) {
      x = event.clientX - rect.left;
      y = event.clientY - rect.top;
    } else if (event instanceof TouchEvent && event.touches?.[0]) {
      const touch = event.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      return null;
    }

    return { x, y };
  }

  showReturnButton: boolean = false;
  showSuccessModal: boolean = false;

  scratchTicket(event: MouseEvent | TouchEvent | null = null) {
    if (!event) return;

    this.isScratching = true;
    const point = this.getPoint(event);
    if (point) {
      this.lastPoint = point;
      this.scratch(event);
    }
  }

  closeSuccessModal() {
    this.showSuccessModal = false;
  }

  // Buy Ticket Api Call -------------
  playScratching: boolean = false;
  BuyAndOpenScratchTicket(event: any = null, isFromButton: boolean = false) {
    // this._loaderService.show();
    // Prevent multiple calls
    if (this.isDisabled) {
      this._loaderService.hide();
      return;
    }

    this.playScratching = isFromButton;
    this.isScratching = true;
    this.isRevealed = false;
    this.scratchTicket(event);
    this.isDisabled = true;

    const payload = {
      customerId: this.customerId,
      betType: 'scratch',
      bet: this.cardData.ticketprice,
    };

    this.apiCallService
      .PostCallWithToken(payload, 'Spinner/CustomerBet')
      .subscribe(
        (response) => {
          this.playScratching = false;
          if (response && response.responseCode === 200) {
            this.revealedPrize = response.data;
            this.isScratching = false;
            this.isRevealed = true;
            // this.showSuccessModal = true;
            this.revealPrize();
            this.showReturnButton = true;
            this.showCongratulations();
            this._loaderService?.triggerWalletFunction();
            this._loaderService.hide();
          } else {
            this.handleError.handleResponseError(response);
            this._loaderService.hide();
          }

          // Allow another call only after response
          this.isDisabled = false;
        },
        (error) => {
          this.handleError.handleHttpError(error);
          this.isDisabled = false;
          this.playScratching = false;
          this._loaderService.hide();
        },
      );
  }

  // Reveal Price or Close Modlaa Functions ---------

  revealPrize() {
    if (this.isRevealed) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
    // this.isRevealed = true;
  }

  get customerId() {
    return localStorage.getItem('customerId');
  }

  revealedPrize: number = 0;
  isDisabled: boolean = false;

  showCongrats: boolean = false;
  private showCongratulations() {
    this.showCongrats = true;
  }
  closeModal() {
    this.showCongrats = false;
    // this.router.navigate(['dashboard/SectrechCards']);
  }

  redirectToCards() {
    this.isRevealed = false;
    this.showCongrats = false;
    this.isScratching = false;
    this.BuyAndOpenScratchTicket();
    // this.router.navigate(['dashboard/SectrechCards']);
  }

  // Show Guide User Manual -------------------

  showGuide() {
    const steps: GuideStep[] = [
      {
        imageUrlLg:
          'https://cmaxv2images2.pages.dev/assets/user-manual/cardguide.png',
      },
      // {
      //   imageUrlLg: '/Images/user-manual/scratch-cards/card-inner-after-lg.png',
      //   imageUrlSm: '/Images/user-manual/scratch-cards/card-inner-after-sm.png',
      //   alt: 'scratch card after revealed',
      // },
    ];

    this._utils.open(steps, 0, {
      title: 'Scratch Card Guide',
    });
  }
  back() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/dashboard/SectrechCards']);
    }
  }
}
