import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  Inject,
  PLATFORM_ID,
  Input,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft, faXmark, faLock } from '@fortawesome/free-solid-svg-icons';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../../Services/utils.service';
import { SpinnerSegment } from '../../../Interfaces/interfaces';

@Component({
  selector: 'app-spin',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, FormsModule],
  templateUrl: './spin.component.html',
  styleUrl: './spin.component.scss',
})
export class SpinComponent implements OnInit {
  @Input() showHeaderSection: boolean = true;
  @Output() spinEnd = new EventEmitter<string>();

  grainBackdrop: SafeHtml = '';
  leftArrow = faChevronLeft;
  crossicon = faXmark;
  lockIcon = faLock; // Lock icon added here

  segments: SpinnerSegment[] = [
    { id: 'seg-01', prize: '$1', icon: 'heroTrophy' },
    { id: 'seg-02', prize: '$2', icon: 'ionDiamond' },
    { id: 'seg-03', prize: '$3', icon: 'heroTrophy' },
    { id: 'seg-04', prize: '$5', icon: 'hugeMoneyBag02' },
    { id: 'seg-05', prize: '$9', icon: 'heroCurrencyDollar' },
    { id: 'seg-06', prize: '$8', icon: 'ionDiamond' },
    { id: 'seg-07', prize: '$6', icon: 'heroCurrencyDollar' },
    { id: 'seg-08', prize: '$10', icon: 'hugeMoneyBag02' },
    { id: 'seg-09', prize: '$13', icon: 'heroGift' },
    { id: 'seg-10', prize: '$15', icon: 'heroCurrencyDollar' },
  ];

  private prizeImages = [
    'https://cmaxv2images2.pages.dev/assets/icons/money-bag.png',
    'https://cmaxv2images2.pages.dev/assets/icons/money-box.png',
  ];

  getPrizeImageByIndex(index: number): string {
    return this.prizeImages[index % this.prizeImages.length];
  }

  spinAmount: string = '5';
  allowedSpinAmounts = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
  public readonly segmentAngle = 360 / this.segments.length;

  constructor(
    private router: Router,
    private _utils: UtilsService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.grainBackdrop = this._utils.getGrainBackdrop();
  }

  ngOnInit(): void {}

  isMobile(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return window.innerWidth < 768;
    }
    return false;
  }

  goBack() {
    if (isPlatformBrowser(this.platformId)) {
      window.history.back();
    }
  }

  incrementSpinAmount(): void {
    let current = Number(this.spinAmount) || 1;
    const idx = this.allowedSpinAmounts.indexOf(current);
    if (idx < this.allowedSpinAmounts.length - 1) {
      this.spinAmount = this.allowedSpinAmounts[idx + 1].toString();
    }
  }

  decrementSpinAmount(): void {
    let current = Number(this.spinAmount) || 1;
    const idx = this.allowedSpinAmounts.indexOf(current);
    if (idx > 0) {
      this.spinAmount = this.allowedSpinAmounts[idx - 1].toString();
    }
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
}