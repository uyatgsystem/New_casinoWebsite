import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, Input, input, PLATFORM_ID } from '@angular/core';
import { SpinnerComponent } from '../spinner/spinner.component';
import { Router } from '@angular/router';
import { SpinnerSegment } from '../../../Interfaces/interfaces';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../../Services/utils.service';

@Component({
  selector: 'app-spin',
  imports: [CommonModule, SpinnerComponent],
  templateUrl: './spin.component.html',
  styleUrl: './spin.component.scss',
})
export class SpinComponent {
  @Input() isHeadingShown: boolean = true;

  constructor(
    private router: Router,
    private _apiCall: ApiCallService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private utilsService: UtilsService,
  ) {}
  grainBackdrop: SafeHtml = '';
  ngOnInit() {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
  }

  openLoginModal() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (token) {
        this.router.navigate(['/dashboard/spinner']);
      } else {
        this.router.navigate(['/login'], {
          queryParams: { redirectUrl: '/dashboard/spinner' },
        });
      }
    }
  }

  isMobile() {
    return window.innerWidth < 768;
  }

  allowedSpinAmounts = [1, 2, 3, 4, 5, 10, 15, 20];

  private _spinAmount: string = '5';

  get spinAmount(): string {
    return this._spinAmount;
  }

  private baseSegments: SpinnerSegment[] = [
    { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
    { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
    { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
    { id: 'seg-04', prize: '$5', icon: 'hugeMoneyBag02' },
    // { id: 'seg-05', prize: '$6', icon: 'heroCurrencyDollar' },
    { id: 'seg-06', prize: '$8', icon: 'ionDiamond' },
    // { id: 'seg-07', prize: '$9', icon: 'heroCurrencyDollar' },
    { id: 'seg-08', prize: '$13', icon: 'hugeMoneyBag02' },
    { id: 'seg-09', prize: '$15', icon: 'heroGift' },
    { id: 'seg-10', prize: '$20', icon: 'heroCurrencyDollar' },
  ];

  segments: SpinnerSegment[] = [...this.baseSegments];

  private prizeImages = [
    'https://cmaxv2images2.pages.dev/assets/icons/money-bag.png',
    'https://cmaxv2images2.pages.dev/assets/icons/money-box.png',
  ];

  getPrizeImageByIndex(index: number): string {
    const imageIndex = index % this.prizeImages.length;
    return this.prizeImages[imageIndex];
  }

  customerSpinnerHistory = [
    { NO: 1, Balance: 35, AddedDate: new Date('2026-04-07T16:45:00') },
    { NO: 2, Balance: 50, AddedDate: new Date('2026-04-07T16:20:00') },
    { NO: 3, Balance: 12, AddedDate: new Date('2026-04-07T15:55:00') },
    { NO: 4, Balance: 16, AddedDate: new Date('2026-04-07T15:30:00') },
    { NO: 5, Balance: 11, AddedDate: new Date('2026-04-07T15:05:00') },
    { NO: 6, Balance: 21, AddedDate: new Date('2026-04-07T14:40:00') },
    { NO: 7, Balance: 10, AddedDate: new Date('2026-04-07T14:15:00') },
    { NO: 8, Balance: 18, AddedDate: new Date('2026-04-07T13:50:00') },
    { NO: 9, Balance: 12, AddedDate: new Date('2026-04-07T13:25:00') },
    { NO: 10, Balance: 30, AddedDate: new Date('2026-04-07T13:00:00') },
    { NO: 11, Balance: 11, AddedDate: new Date('2026-04-06T22:30:00') },
    { NO: 12, Balance: 10, AddedDate: new Date('2026-04-06T21:10:00') },
    { NO: 13, Balance: 40, AddedDate: new Date('2026-04-06T19:45:00') },
    { NO: 14, Balance: 13, AddedDate: new Date('2026-04-06T18:20:00') },
    { NO: 15, Balance: 19, AddedDate: new Date('2026-04-06T17:00:00') },
  ];
}
