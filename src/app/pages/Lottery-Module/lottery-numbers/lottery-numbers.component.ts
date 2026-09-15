import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UtilsService } from '../../../Services/utils.service';
import { Router } from '@angular/router';
import { LoaderComponent } from '../../../components/loader/loader.component';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderService } from '../../../Services/loader-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { GuideStep } from '../../../Interfaces/interfaces';

@Component({
  selector: 'app-lottery-numbers',
  imports: [CommonModule, LoaderComponent],
  templateUrl: './lottery-numbers.component.html',
  styleUrl: './lottery-numbers.component.scss',
})
export class LotteryNumbersComponent {
  numbers: number[] = [];
  selectedNumbers: number[] = [];
  ticketPrice: number = 100.58;
  totalAmount: number = 0;

  lotteryData: any;

  countdownTime = { hh: '00', mm: '00', ss: '00' };
  private interval: any;
  leftArrow: any;

  constructor(
    private lotteryDataService: UtilsService,
    private router: Router,
    private apicallservice: ApiCallService,
    private handleError: ErrorhandlingService,
    private toaster: ToastrService,
    private loaderService: LoaderService
  ) {
    this.lotteryDataService.lotteryData$.subscribe((data) => {
      if (data) {
        this.lotteryData = data;
        sessionStorage.setItem('lotteryData', JSON.stringify(data));
      } else {
        const savedData = sessionStorage.getItem('lotteryData');
        if (savedData) {
          this.lotteryData = JSON.parse(savedData);
        }

        // this.fetchLotteryDataFromService();
      }
    });

    // Generate numbers 1-99
    // for (let i = 1; i <= 99; i++) {
    //   this.numbers.push(i);
    // }
    this.GetLotteryNumbersById();
  }

  fetchLotteryDataFromService() {
    this.lotteryDataService.lotteryData$.subscribe((data) => {
      if (data) {
        this.lotteryData = data;
        sessionStorage.setItem('lotteryData', JSON.stringify(data));
      }
    });
  }

  ngOnInit() {
    if (this.lotteryData?.time) {
      this.startCountdown(this.lotteryData.time);
    }
    this.GetLotteryDataById();
  }

  //////////////////////////////////  List Of Lottery Numbers

  toggleNumber(number: number): void {
    const isPurchased = this.purchasedNumbers.includes(number);
    const index = this.selectedNumbers.indexOf(number);

    if (isPurchased) {
      this.toaster.info(
        'You have already purchased this ticket. It cannot be removed.',
        'Info'
      );
      return;
    }

    if (index > -1) {
      // Remove
      this.selectedNumbers.splice(index, 1);
      this.totalAmount -= this.lotteryData.TicketPrice;
    } else {
      // Check limit before adding
      if (this.selectedNumbers.length >= this.lotteryData.MaxTickectLimit) {
        this.toaster.error(
          `You can only select up to ${this.lotteryData.MaxTickectLimit} tickets.`,
          'Limit Reached'
        );
        return;
      }

      // Add
      this.selectedNumbers.push(number);
      this.totalAmount += this.lotteryData.TicketPrice;
      this.totalAmount = Math.max(this.totalAmount, 0);
    }

    // Sort selected numbers
    this.selectedNumbers.sort((a, b) => a - b);
  }

  isSelected(number: number): boolean {
    return this.selectedNumbers.includes(number);
  }

  clearAll(): void {
    this.selectedNumbers = [];
    this.totalAmount = 0;
  }

  removeSelectedNumber(number: number): void {
    if (this.purchasedNumbers.includes(number)) return;

    const index = this.selectedNumbers.indexOf(number);
    if (index > -1) {
      this.selectedNumbers.splice(index, 1);
      this.totalAmount -= this.lotteryData.TicketPrice;
    }
  }

  back() {
    window.history.back();
  }

  ////////////////////////// Remaining Time

  startCountdown(timeObj: { hh: string; mm: string; ss: string }) {
    // Convert to seconds
    let totalSeconds =
      parseInt(timeObj.hh) * 3600 +
      parseInt(timeObj.mm) * 60 +
      parseInt(timeObj.ss);

    this.updateCountdownDisplay(totalSeconds);

    this.interval = setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
        this.updateCountdownDisplay(totalSeconds);
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  updateCountdownDisplay(totalSeconds: number) {
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;

    this.countdownTime = {
      hh: String(hh).padStart(2, '0'),
      mm: String(mm).padStart(2, '0'),
      ss: String(ss).padStart(2, '0'),
    };
  }

  ngOnDestroy(): void {
    clearInterval(this.interval);
  }

  ///////////////////////////////////Get Lottery Numbers By Id

  GetLotteryNumbersById(): void {
    const payload = this.lotteryData.Id;

    this.apicallservice
      .GetCallWithToken('Lottery/GetLotteryNumbersById?LotteryId=' + payload)
      .subscribe(
        (response: any) => {
          if (response.responseCode === 200 && response.data) {
            const tickets = response.data;
            this.numbers = tickets.map((t: any) => t.ticketNumber);
          } else {
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          this.handleError.handleHttpError(error);
        }
      );
  }

  ///////////////////////////////////GEt Already Purchased Tickets

  purchasedLotteryPayload() {
    return {
      lotteryId: this.lotteryData.Id,
      customerId: localStorage.getItem('customerId'),
    };
  }

  purchasedNumbers: any[] = [];
  GetLotteryDataById(): void {
    const payload = this.purchasedLotteryPayload();

    this.apicallservice
      .PostCallWithToken(payload, 'Lottery/GetCustomersPurchasedTickets')
      .subscribe(
        (response: any) => {
          if (response.responseCode === 200 && response.data) {
            const tickets = response.data;
            this.purchasedNumbers = tickets.map(
              (t: { Ticketnumber: string }) => +t.Ticketnumber
            );
            this.selectedNumbers = [...this.purchasedNumbers];
          } else {
            this.handleError.handleResponseError(response);
          }
        },
        (error) => {
          this.handleError.handleHttpError(error);
        }
      );
  }

  /////////////////////////////////// Buy Tickets Api Call

  ApiPaylaod() {
    const newNumbers = this.selectedNumbers.filter(
      (num) => !this.purchasedNumbers.includes(num)
    );

    return {
      customerId: localStorage.getItem('customerId'),
      lotteryId: this.lotteryData.Id,
      status: 'Complete',
      list: newNumbers.map((num) => ({
        ticketNumber: num.toString(),
      })),
    };
  }

  showSuccessModal = false;

  buyTicket(): void {
    this.loaderService.show();
    const newNumbers = this.selectedNumbers.filter(
      (num) => !this.purchasedNumbers.includes(num)
    );

    if (newNumbers.length === 0) {
      this.toaster.warning(
        'You have already purchased these tickets. Please select new ones.',
        'Info'
      );
      this.loaderService.hide();

      return;
    }

    const payload = this.ApiPaylaod();

    this.apicallservice
      .PostCallWithToken(payload, 'Lottery/BuyCustomerTicket')
      .subscribe(
        (response: any) => {
          if (response.responseCode === 200) {
            this.showSuccessModal = true;
            this.loaderService?.triggerWalletFunction();
          } else {
            this.handleError.handleResponseError(response);
          }
          this.loaderService.hide();
        },
        (error) => {
          this.handleError.handleHttpError(error);
          this.loaderService.hide();
        }
      );
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    this.GetLotteryDataById();
  }

  goToMyTickets(): void {
    this.GetLotteryDataById();
    this.closeSuccessModal();
  }

  ///////coins

  coins = [
    { top: '5%', left: '10%', size: '60px', animation: 'animate-bounce' },
    { top: '15%', right: '15%', size: '70px', animation: 'animate-spin' },
    { bottom: '10%', left: '20%', size: '65px', animation: 'animate-pulse' },
    { bottom: '20%', right: '25%', size: '80px', animation: 'animate-bounce' },
    { top: '30%', left: '5%', size: '75px', animation: 'animate-spin' },
    { top: '40%', right: '20%', size: '70px', animation: 'animate-pulse' },
    { bottom: '30%', left: '30%', size: '85px', animation: 'animate-bounce' },
    { top: '50%', left: '40%', size: '90px', animation: 'animate-spin' },
    { top: '60%', right: '10%', size: '80px', animation: 'animate-bounce' },
    { top: '10%', left: '50%', size: '70px', animation: 'animate-pulse' },
    { bottom: '5%', left: '5%', size: '75px', animation: 'animate-spin' },
    { top: '70%', left: '20%', size: '65px', animation: 'animate-bounce' },
    { bottom: '25%', right: '15%', size: '85px', animation: 'animate-pulse' },
  ];

  getCoinSize(size: string) {
    if (window.innerWidth < 640) {
      return `${parseInt(size) * 0.6}px`; // mobile ke liye 60% size
    } else {
      return size; // desktop ke liye original
    }
  }


  /////////////////////////  Show Guide Line

  showGuide() {
    const steps: GuideStep[] = [
      {
        imageUrl: 'https://cmaxv2images2.pages.dev/assets/user-manual/Lotteryguide.png',
      },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery6.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery4.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery3.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery2.png',
      // },
      // {
      //   imageUrl: '/Images/user-manual/lottery/lottery1.png',
      // },
    ];

    this.lotteryDataService.open(steps, 0, {
      title: 'Lottery Guide',
    });
  }


}
