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
  // activeTab: ActiveTabType = 'All';
  showModal = false;
  selectedGame: any;
  score = '';
  accountType = '';
  selectedPaymentMethod: 'wallet' | 'withdraw' = 'wallet';
  startDate: string | null = null;
  endDate: string | null = null;
  viewMode: 'grid' | 'table' = 'grid';
  // plusIcon = faPlus;
  //infoIcon = faCircleInfo;
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

    // this.isDashboardPage = this.router.url.startsWith('/dashboard');

    if (this.isDashboardPage) {
      this.scratchCards = this.scratchCards.slice(0, 3);
    } else if (this.isLandingPage) {
      this.scratchCards = this.scratchCards.slice(0, 3);
    } else {
      this.scratchCards = this.scratchCards;
    }
  }

  ngAfterViewInit() {
    // Calculate card section position after view init
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

    // Calculate progress through the section (0 to 1)
    const progress = 1 - rect.bottom / (element.offsetHeight + viewportHeight);

    // Map progress to card index
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

    // Only intercept when section is stuck at top
    if (rect.top <= 1 && rect.top >= -1) {
      // Scrolling down through cards
      if (delta > 0 && this.activeIndex < this.totalCards - 1) {
        event.preventDefault();
        this.lockScroll();
        this.activeIndex++;

        // Manually scroll the page by one card height worth
        const scrollAmount = element.offsetHeight / this.totalCards;
        window.scrollBy({
          top: scrollAmount,
          behavior: 'smooth',
        });
        return;
      }

      // Scrolling up through cards
      if (delta < 0 && this.activeIndex > 0) {
        event.preventDefault();
        this.lockScroll();
        this.activeIndex--;

        // Manually scroll the page by one card height worth
        const scrollAmount = element.offsetHeight / this.totalCards;
        window.scrollBy({
          top: -scrollAmount,
          behavior: 'smooth',
        });
        return;
      }

      // At first card, prevent scrolling up
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

    // Calculate target scroll position for this card
    // Each card takes up (sectionHeight / totalCards) of scroll
    const cardScrollHeight = sectionHeight / this.totalCards;
    const targetScroll = sectionTop + cardScrollHeight * index;

    // Smooth scroll to target position
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
    return !!localStorage.getItem('token'); // returns true if token exists, false otherwise
  }

  onStartDateChange(date: string) {
    if (this.endDate && new Date(this.endDate) < new Date(date)) {
      this.endDate = null;
    }
  }
  resetDates() {
    this.startDate = null;
    this.endDate = null;
    // this.GetAllGames(true);
  }

  showGuide() {
    const steps: GuideStep[] = [
      {
        imageUrl:
          'https://cmaxv2images2.pages.dev/assets/user-manual/scratchguide.png',

        // imageUrlLg: '/Images/user-manual/scratch-cards/card-1.png',
        alt: 'scratch card',
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
    // Add more cards as needed
  ];

  card = {
    backgroundColor: '#062b35', // Card background color
    ribbonGradient: 'from-[#0c3b4a] to-[#12485c]', // Ribbon gradient
    buttonGradient: 'from-[#70e1f5] to-[#536976]', // Button gradient
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

  scratchCards = [
    {
      ticketprice: 5,
      title: 'Diamond Rush',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/daimond.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$200',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Buy Now!',
    },
    {
      ticketprice: 10,
      title: 'Gold Mania',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/fire.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$300',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Buy Now!',
    },
    {
      ticketprice: 15,
      title: 'Treasure Hunt',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/crown.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$400',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Buy Now!',
    },
    {
      ticketprice: 20,
      title: 'Diamond Rush',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/daimond.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$500',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Buy Now!',
    },
    {
      ticketprice: 25,
      title: 'Gold Mania',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/fire.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$1000',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Buy Now!',
    },
    {
      ticketprice: 30,
      title: 'Treasure Hunt',
      icon: 'https://cmaxv2images2.pages.dev/assets/icons/crown.png',
      bgImage: 'https://cmax.pages.dev/assets/scratchcard/scratch-card.png',
      winning: '$2000',
      treasure: 'https://cmaxv2images2.pages.dev/assets/icons/treasure.png',
      buttonText: 'Buy Now!',
    },
  ];
}
