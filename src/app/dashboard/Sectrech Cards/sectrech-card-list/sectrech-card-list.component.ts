import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { UtilsService } from '../../../Services/utils.service';
import { GuideStep } from '../../../Interfaces/interfaces';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { SafeHtml } from '@angular/platform-browser';

interface Card {
  backgroundColor: string;
  ribbonGradient: string;
  buttonGradient: string;
  title: string;
  description: string;
  buttonText: string;
  maxWinText: string;
  upToText: string;
  chanceText: string;
  cardImage: string;
  iconImage: string;
}

@Component({
  selector: 'app-sectrech-card-list',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './sectrech-card-list.component.html',
  styleUrls: ['./sectrech-card-list.component.scss'],
})
export class SectrechCardListComponent implements OnInit {
  selectedGame: any;
  score = '';
  accountType = '';
  selectedPaymentMethod: 'wallet' | 'withdraw' = 'wallet';
  startDate: string | null = null;
  endDate: string | null = null;
  viewMode: 'grid' | 'table' = 'grid';
  leftArrow = faChevronLeft;
  showDateFilter: boolean = false;
  dropdownOpen: boolean = false;
  searchTerm: string = '';
  @Input() isHomePage: boolean = true;
  @ViewChild('cardScrollSection') cardScrollSection!: ElementRef;
  grainBackdrop: SafeHtml = '';
  activeIndex = 0;
  isLocked = false;
  totalCards = 3;
  isInCardSection = false;
  cardSectionTop = 0;

  constructor(
    private router: Router,
    private _route: ActivatedRoute,
    private location: Location,
    private utils: UtilsService,
  ) { }

  isLandingPage: boolean = true;
  isDashboardPage: boolean = true;
  isScratchCardPage: boolean = true;

  ngOnInit() {
    this.grainBackdrop = this.utils.getGrainBackdrop();
    this.isLandingPage = this.router.url === '/';
    this.isDashboardPage = this.router.url === '/dashboard/home';
    this.isScratchCardPage = this.router.url === '/dashboard/SectrechCards';

    if (this.isDashboardPage) {
      this.scratchCards = this.scratchCards.slice(0, 3);
    } else if (this.isLandingPage) {
      this.scratchCards = this.scratchCards.slice(0, 3);
    } else {
      this.scratchCards = this.scratchCards;
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.cardScrollSection) {
        this.cardSectionTop = this.cardScrollSection.nativeElement.offsetTop;
      }
    }, 100);
  }

  @HostListener('window:scroll')
  onScroll() {
    if (!this.cardScrollSection) return;

    const element = this.cardScrollSection.nativeElement;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const progress = 1 - rect.bottom / (element.offsetHeight + viewportHeight);

    if (progress >= 0 && progress <= 1) {
      this.activeIndex = Math.floor(progress * this.totalCards);
      this.activeIndex = Math.max(
        0,
        Math.min(this.activeIndex, this.totalCards - 1),
      );
    }
  }

  @HostListener('window:wheel', ['$event'])
  onWheel(event: WheelEvent) {
    if (!this.cardScrollSection || this.isLocked) return;

    const element = this.cardScrollSection.nativeElement;
    const rect = element.getBoundingClientRect();
    const delta = event.deltaY;

    if (rect.top <= 1 && rect.top >= -1) {
      if (delta > 0 && this.activeIndex < this.totalCards - 1) {
        event.preventDefault();
        this.lockScroll();
        this.activeIndex++;

        const scrollAmount = element.offsetHeight / this.totalCards;
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth',
        });
        return;
      }

      if (delta < 0 && this.activeIndex > 0) {
        event.preventDefault();
        this.lockScroll();
        this.activeIndex--;

        const scrollAmount = element.offsetHeight / this.totalCards;
        window.scrollBy({
          top: -scrollAmount,
          behavior: 'smooth',
        });
        return;
      }

      if (delta < 0 && this.activeIndex === 0) {
        event.preventDefault();
        return;
      }
    }
  }

  lockScroll() {
    this.isLocked = true;
    setTimeout(() => {
      this.isLocked = false;
    }, 600);
  }

  goToCard(index: number) {
    if (this.isLocked || !this.cardScrollSection) return;

    this.lockScroll();
    this.activeIndex = index;

    const element = this.cardScrollSection.nativeElement;
    const sectionHeight = element.offsetHeight;
    const sectionTop = this.cardSectionTop;

    const cardScrollHeight = sectionHeight / this.totalCards;
    const targetScroll = sectionTop + cardScrollHeight * index;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  }

  goBack() {
    this.location.back();
  }

  get token() {
    return this.utils.getItem('token');
  }

  goToBuyNow(cardData: any) {
    if (this.token && this.token != null) {
      const encodedData = encodeURIComponent(JSON.stringify(cardData));
      this.router.navigate(['/dashboard/buy-now', encodedData]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: { redirectUrl: '/dashboard/SectrechCards' },
      });
    }
  }

  get isToken(): boolean {
    return typeof localStorage !== 'undefined' && !!localStorage.getItem('token');
  }

  onStartDateChange(date: string) {
    if (this.endDate && new Date(this.endDate) < new Date(date)) {
      this.endDate = null;
    }
  }

  resetDates() {
    this.startDate = null;
    this.endDate = null;
  }

  showGuide() {
    const steps: GuideStep[] = [
      {
        imageUrl: 'https://spinhub-6rb.pages.dev/assets/scratchguide.png',
        alt: 'Scratch Card Guide',
      },
    ];

    this.utils.open(steps, 0, {
      title: 'Scratch Card Guide',
    });
  }

  cards = [
    {
      ticketprice: 5,
      backgroundColor: '#062b35',
      ribbonGradient: 'from-[#0c3b4a] to-[#12485c]',
      buttonGradient: 'from-[#70e1f5] to-[#536976]',
      title: 'Scratch and Win',
      mainTitle: 'Exciting Scratch Cards',
      description:
        'Get ready to uncover incredible prizes! Our scratch card section is the perfect place to test your luck and see if fortune is on your side.',
      buttonText: 'Buy Now!',
      maxWinText: '$200',
      upToText: 'Up to',
      chanceText: 'Chance to Win',
      cardImage: '/scratchcard/scratch1.png',
      iconImage: '/scratchcard/scratch1.png',
    },
    {
      ticketprice: 10,
      backgroundColor: '#231438',
      ribbonGradient: 'from-[#3A1F5C] to-[#5A3C88]',
      buttonGradient: 'from-[#70e1f5] to-[#536976]',
      title: 'Daily Jackpot',
      mainTitle: 'Daily Jackpot Fun',
      description:
        'Try your luck every day! Scratch your way to amazing prizes and see if you are the lucky winner.',
      buttonText: 'Buy Now!',
      maxWinText: '$500',
      upToText: 'Up to',
      chanceText: 'Chance to Win',
      cardImage: '/scratchcard/scratch2.png',
      iconImage: '/scratchcard/scratch2.png',
    },
    {
      ticketprice: 15,
      backgroundColor: '#315994',
      ribbonGradient: 'from-[#1F3B66] to-[#223d72]',
      buttonGradient: 'from-[#70e1f5] to-[#536976]',
      title: 'Mega Prize',
      mainTitle: 'Mega Rewards',
      description:
        'Step into the world of mega prizes! Every scratch could bring you closer to the ultimate reward.',
      buttonText: 'Buy Now!',
      maxWinText: '$1000',
      upToText: 'Up to',
      chanceText: 'Chance to Win',
      cardImage: '/scratchcard/scratch3.png',
      iconImage: '/scratchcard/scratch3.png',
    },
  ];

  card = {
    backgroundColor: '#062b35',
    ribbonGradient: 'from-[#0c3b4a] to-[#12485c]',
    buttonGradient: 'from-[#70e1f5] to-[#536976]',
    title: 'Scratch and Win',
    description:
      'Get ready to uncover incredible prizes! Our scratch card section is the perfect place to test your luck and see if fortune is on your side.',
    buttonText: 'Buy Now!',
    maxWinText: '$200',
    upToText: 'Up to',
    chanceText: 'Chance to Win',
    cardImage: '/scratchcard/scratch1.png',
    iconImage: '/scratchcard/scratch1.png',
  };

  activeCategory: string = 'all';

  setCategory(category: string): void {
    this.activeCategory = category;
  }

  get displayedCards(): any[] {
    if (this.activeCategory === 'starter') {
      return this.scratchCards.filter(c => c.ticketprice <= 10);
    }
    if (this.activeCategory === 'high') {
      return this.scratchCards.filter(c => c.ticketprice > 10 && c.ticketprice <= 20);
    }
    if (this.activeCategory === 'mega') {
      return this.scratchCards.filter(c => c.ticketprice >= 25);
    }
    return this.scratchCards;
  }

  scratchCards = [
    {
      ticketprice: 5,
      node: 'NODE 01',
      tier: 'QUANTUM CIPHER',
      securityLevel: 'LVL 1 FIREWALL',
      code: 'NODE-0199',
      odds: '1 in 2.8',
      title: 'Cipher Core',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/daimond.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$200',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Decrypt Node',
      scratchText: '⚡ BREACH QUANTUM CIPHER',
    },
    {
      ticketprice: 10,
      node: 'NODE 02',
      tier: 'GOLD MATRIX',
      securityLevel: 'LVL 2 FIREWALL',
      code: 'NODE-0284',
      odds: '1 in 3.1',
      title: 'Matrix Vault',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/fire.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$300',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Decrypt Node',
      scratchText: '⚡ OVERRIDE GOLD MATRIX',
    },
    {
      ticketprice: 15,
      node: 'NODE 03',
      tier: 'ROYAL PROTOCOL',
      securityLevel: 'LVL 3 FIREWALL',
      code: 'NODE-0371',
      odds: '1 in 3.4',
      title: 'Neural Core',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/crown.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$400',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Decrypt Node',
      scratchText: '⚡ EXTRACT NEURAL VAULT',
    },
    {
      ticketprice: 20,
      node: 'NODE 04',
      tier: 'CYBER DIAMOND',
      securityLevel: 'LVL 4 FIREWALL',
      code: 'NODE-0465',
      odds: '1 in 3.6',
      title: 'Diamond Breach',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/daimond.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$500',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Decrypt Node',
      scratchText: '⚡ CRACK CYBER DIAMOND',
    },
    {
      ticketprice: 25,
      node: 'NODE 05',
      tier: 'FIREWALL BREACHER',
      securityLevel: 'LVL 5 FIREWALL',
      code: 'NODE-0518',
      odds: '1 in 3.8',
      title: 'Fire Storm',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/fire.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$1000',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Decrypt Node',
      scratchText: '⚡ OVERDRIVE FIRE STORM',
    },
    {
      ticketprice: 30,
      node: 'NODE 06',
      tier: 'OMEGA SINGULARITY',
      securityLevel: 'APEX FIREWALL',
      code: 'NODE-0601',
      odds: '1 in 4.0',
      title: 'Omega Core',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/crown.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$2000',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Decrypt Node',
      scratchText: '⚡ UNLOCK OMEGA SINGULARITY',
    },
  ];
}