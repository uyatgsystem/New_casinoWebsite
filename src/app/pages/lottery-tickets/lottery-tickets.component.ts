import {
  Component,
  ElementRef,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiCallService } from '../../Services/api-call-service.service';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { ToastrService } from 'ngx-toastr';
import { GameCard, GameCardInterface } from '../../Interfaces/interfaces';
import { faPlus, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { GameService } from '../../Services/game.service';
import { UtilsService } from '../../Services/utils.service';
import { Subject, takeUntil } from 'rxjs';
import { DatePipe } from '@angular/common';

interface TicketData {
  id: number;
  ticketNumber: string;
  isAvailable: boolean;
}
// Add DatePipe to imports array in @Component decorator
@Component({
  selector: 'app-redeem',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    LoaderComponent,
    NgIf,
    FontAwesomeModule,
    DatePipe, // Add this
  ],
  providers: [ApiCallService],
  templateUrl: './lottery-tickets.component.html',
  styleUrls: ['./lottery-tickets.component.scss'],
})
export class LotteryTicketsComponent implements OnInit, OnDestroy {
  private _apiCall = inject(ApiCallService);
  searchControl = new FormControl('');
  accountInfo: string = '';
  constructor(
    private loaderService: LoaderService,
    private ErroHandling: ErrorhandlingService,
    private utilsService: UtilsService,
    private toastr: ToastrService
  ) {
    this.updateLotteryTicketDetails();
  }

  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  ngOnInit(): void {
    this.generateTickets();
    this.GetAllPurchasedTickets();
    this.getCustomerTicketsList();
    this.utilsService
      .getTriggerLotteryTicketObservable()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.GetAllPurchasedTickets();
      });

    // Store interval reference
    // this.refreshInterval = setInterval(() => {
    //   this.GetAllPurchasedTickets();
    // }, 3000);
    setInterval(() => {
      this.checkExpiredTickets();
    }, 1000);
  }
  private checkExpiredTickets() {
    this.purchasedTicketsList.forEach((ticket) => {
      if (
        this.getTimeLeft(ticket.AddedDate) <= 0 &&
        !this.cancelledTickets.has(ticket.Id) &&
        ticket.Status !== 'Complete'
      ) {
        this.handleExpiredTicket(ticket);
      }
    });
  }
  searchTerm: string = '';
  get filteredTickets() {
    return this.lotteryTickets.filter((ticket) => {
      const matchesSearch =
        !this.searchTerm ||
        ticket.ticketNumber
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase()) ||
        ticket.id
          .toString()
          .toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      return matchesSearch; // Remove the isAvailable check to show all tickets
    });
  }

  // Add this property to store purchased tickets
  purchasedTickets: string[] = []; // Will be populated from API

  generateTickets() {
    const tickets: TicketData[] = [];
    for (let i = 0; i < this.totalTickets; i++) {
      // Start from 100 and increment
      const sequentialNum = (101 + i).toString().padStart(4, '0');
      const ticketNumber = `${this.ticketPrefix}${sequentialNum}`;
      tickets.push({
        id: i + 1,
        ticketNumber: ticketNumber,
        isAvailable:
          !this.purchasedTickets.includes(ticketNumber) &&
          i < this.remainingTickets,
      });
    }
    this.lotteryTickets = this.shuffleArray(tickets);
  }

  get getLotteryDetails(): any | [] {
    const details = localStorage.getItem('LID');
    return details ? JSON.parse(details) : null;
  }

  // Update GetAllPurchasedTickets to populate purchasedTickets array
  GetAllPurchasedTickets() {
    // this.loaderService.show();
    const payload = {
      searchText: '',
      pageSize: 10,
      totalRecords: 0,
    };

    this._apiCall
      .GetCallWithToken(
        'Lottery/GetAllLotteryTickets?LotteryId=' + this.getLotteryDetails?.IDO
      )
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            // Store purchased ticket numbers
            this.closedTickets = response?.data?.length || 0;
            this.totalTickets =
              response?.data[0]?.TotalTickets ||
              this.getLotteryDetails?.TLT ||
              0;
            this.getRemainingTickets();
            this.purchasedTickets = response.data.map(
              (ticket: any) => ticket.TicketNumber
            );
            // this.getRemainingTickets()
            this.generateTickets(); // Regenerate tickets with updated availability
            this.loaderService.hide();
          } else {
            this.ErroHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.ErroHandling.handleHttpError(error);
        },
      });
  }
  integerValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (value && !Number.isInteger(Number(value))) {
      return { notInteger: true };
    }
    return null;
  }

  getRemainingTickets() {
    this.remainingTickets = this.totalTickets - this.closedTickets;
  }

  updateLotteryTicketDetails() {
    this.lotteryName = this.getLotteryDetails?.LYN || '';
    this.ticketPrefix = this.getLotteryDetails?.ILC || 'SC';
    this.totalTickets = this.getLotteryDetails?.TLT || 0;
    // this.remainingTickets = this.getLotteryDetails?.remainingTickets || 0;
    // this.closedTickets = this.getLotteryDetails?.closedTickets || 0;
  }
  lotteryName: string = '';
  totalTickets: number = 0;
  remainingTickets: number = 0;
  closedTickets: number = 0;
  ticketPrefix: string = ''; // For numbers like 023345
  lotteryTickets: TicketData[] = [];

  private shuffleArray(array: TicketData[]): TicketData[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    // Clear the refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }
  // Add this function to your component class
  reserveTicket(ticket: TicketData) {
    if (!ticket.isAvailable) {
      this.toastr.warning('This ticket is already purchased', 'Warning');
      return;
    }

    const payload = {
      lotteryId: this.getLotteryDetails?.IDO,
      ticketNumber: ticket.ticketNumber,
      customerId: localStorage.getItem('customerId'),
      status: 'Pending',
      isWinner: false,
      prizeRank: 0,
    };
    // {
    //   "status": "string",
    //   "isWinner": true,
    //   "prizeRank": 0
    // }
    this._apiCall
      .PostCallWithToken(payload, 'Lottery/CreateCustomerTicket')
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            ticket.isAvailable = false;
            this.purchasedTickets.push(ticket.ticketNumber);
            this.toastr.success('Ticket Reserved successfully', 'Success');
            // this.GetAllPurchasedTickets(); // Refresh the tickets list
            this.getCustomerTicketsList();
          } else {
            this.ErroHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.ErroHandling.handleHttpError(error);
        },
      });
  }

  // Add these properties to your component
  showPurchasedModal: boolean = false;
  purchasedTicketsList: any[] = [];
  timeLeft: number = 30 * 60; // 30 minutes in seconds
  private timerInterval: any;

  // // Add this method to start countdown
  // startCountdown() {
  //   if (this.timerInterval) {
  //     clearInterval(this.timerInterval);
  //   }

  //   this.timerInterval = setInterval(() => {
  //     if (this.timeLeft > 0) {
  //       this.timeLeft--;
  //     } else {
  //       clearInterval(this.timerInterval);
  //     }
  //   }, 1000);
  // }

  // Add this getter for formatted time
  get formattedTimeLeft(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  get getCustomerId(): number | 0 {
    const customerId = localStorage.getItem('customerId');
    return Number(customerId);
  }
  reservedTickets: number = 0;
  // Add this method to get purchased tickets
  // Update the getCustomerTicketsList method
  getCustomerTicketsList() {
    const payload = {
      customerId: this.getCustomerId,
      lotteryId: this.getLotteryDetails?.IDO,
    };

    this._apiCall
      .PostCallWithToken(payload, 'Lottery/GetCustomerLotteryTickets')
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.purchasedTicketsList = response.data;
            this.reservedTickets = response?.data?.length || 0;
            if (response.data.length > 0) {
              const purchaseTime = new Date(
                response.data[response.data.length - 1].AddedDate
              );
              const currentTime = new Date();
              const timeDiffInMinutes = Math.floor(
                (currentTime.getTime() - purchaseTime.getTime()) / (1000 * 60)
              );
              // Check if the time difference is within the 10-minute window
              if (timeDiffInMinutes < 10) {
                // 10 minutes window
                this.timeLeft = (10 - timeDiffInMinutes) * 60; // Convert remaining minutes to seconds
                this.showTimer = true;
                this.startCountdown();
              } else {
                this.timeLeft = 0;
                this.showTimer = false;
                if (this.timerInterval) {
                  clearInterval(this.timerInterval);
                }
              }
            }
          } else {
            this.ErroHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.ErroHandling.handleHttpError(error);
        },
      });
  }
  openReservedTicketsModal() {
    this.resetSelection();
    this.showPurchasedModal = !this.showPurchasedModal;
  }
  // Update the startCountdown method
  startCountdown() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.timerInterval);
        // Update the UI to remove the timer message
        this.showTimer = false;
      }
    }, 1000);
  }

  // Add new property to control timer visibility
  showTimer: boolean = true;

  // Add method to cancel ticket
  cancelTicket(ticket: any) {
    this._apiCall
      .PostCallWithToken(
        null,
        'Lottery/DeleteCustomerTicket?Id=' +
          (typeof ticket === 'number' ? ticket : ticket?.Id)
      )
      .subscribe({
        next: (response) => {
          if (response.responseCode === 200) {
            this.toastr.success('Ticket cancelled successfully', 'Success');
            this.getCustomerTicketsList();
            this.GetAllPurchasedTickets();
          } else {
            this.ErroHandling.handleResponseError(response);
          }
        },
        error: (error) => {
          this.ErroHandling.handleHttpError(error);
        },
      });
  }

  // Add these methods to handle individual ticket timers
  // Update the getTimeLeft method
  handleExpiredTicket(ticket: any) {
    if (ticket.Id && ticket.Status !== 'Complete') {
      this.cancelTicket(ticket.Id);
    }
  }

  // Update getTimeLeft to handle expired tickets
  // Add a property to track cancelled tickets
  private cancelledTickets: Set<number> = new Set();

  // Update getTimeLeft method
  getTimeLeft(addedDate: string): number {
    const purchaseTime = new Date(addedDate + 'Z');
    const currentTime = new Date();
    const timeDiffInSeconds = Math.floor(
      (currentTime.getTime() - purchaseTime.getTime()) / 1000
    );
    const timeWindow = 5 * 60; // 5 minutes in seconds
    const timeLeft = Math.max(0, timeWindow - timeDiffInSeconds);

    if (timeLeft <= 0) {
      const ticket = this.purchasedTicketsList.find(
        (t) => t.AddedDate === addedDate
      );
      if (ticket && !this.cancelledTickets.has(ticket.Id)) {
        this.cancelledTickets.add(ticket.Id);
        this.handleExpiredTicket(ticket);
      }
    }

    return timeLeft;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Add these properties
  showConfirmationModal: boolean = false;
  actionType: 'Buy' | 'Cancel' = 'Buy';
  selectedTicket: any = null;

  // Add these methods
  showConfirmation(
    ticket: any,
    action: 'Buy' | 'Cancel',
    isReset: boolean = false
  ) {
    if (isReset) {
      this.resetSelection();
    }
    this.selectedTicket = ticket || this.selectedTicketsString;
    this.actionType = action;
    this.showConfirmationModal = true;
  }

  cancelConfirmation() {
    this.showConfirmationModal = false;
    this.selectedTicket = null;
  }

  // confirmAction() {
  //   if (this.actionType === 'Buy') {
  //     // Call your buy method
  //     this.buyTicket(this.selectedTicket);
  //   } else {
  //     this.cancelTicket(this.selectedTicket.Id);
  //   }
  //   this.cancelConfirmation();
  // }
  confirmAction() {
    // if (typeof this.selectedTicket === 'string') {
    // Handle multiple tickets
    if (this.actionType === 'Buy') {
      this.buyTicket(this.selectedTicket || this.selectedTicketsString);
    } else {
      this.cancelTicket(
        this.selectedTicketIds.length > 0
          ? this.selectedTicketsString
          : this.selectedTicket
      );
    }
    // } else {
    //   // Handle single ticket
    //   if (this.actionType === 'Buy') {
    //     this.purchaseTicket(this.selectedTicket);
    //   } else {
    //     this.cancelTicket(this.selectedTicket.Id);
    //   }
    // }
    this.cancelConfirmation();
  }
  buyTicket(ticket: any) {
    // Your existing buy logic here
    // this.toastr.success('Ticket purchased successfully');
    this.purchaseTicket(ticket);
    // this.getCustomerTicketsList();
    // this.GetAllPurchasedTickets();
  }
  // Add method to Purchase ticket
  purchaseTicket(ticket: any) {
    this.loaderService.show();
    const payload = {
      ticketId: ticket?.Id?.toString() || this.selectedTicketsString,
      lotteryId: ticket?.LotteryId || this.selectedTicketIds[0]?.LotteryId,
      customerId: ticket?.CustomerId || this.selectedTicketIds[0]?.CustomerId,
    };
    this._apiCall.PostCallWithToken(payload, 'Wallet/BuyTicket').subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.toastr.success(response.responseMessage, 'Success');
          this.getCustomerTicketsList();
          this.GetAllPurchasedTickets();
          this.resetSelection();
          this.loaderService.hide();
        } else {
          this.resetSelection();
          this.loaderService.hide();
          this.ErroHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.resetSelection();
        this.loaderService.hide();
        this.ErroHandling.handleHttpError(error);
      },
    });
  }
  selectedTicketIds: any[] = [];
  isAllSelected: boolean = false;
  resetSelection() {
    this.selectedTicketIds = [];
    this.isAllSelected = false;
    this.purchasedTicketsList.forEach((ticket) => {
      ticket.isSelected = false;
    });
  }
  toggleSelectAll() {
    this.isAllSelected = !this.isAllSelected;
    const pendingTickets = this.purchasedTicketsList.filter(
      (ticket) => ticket.Status === 'Pending'
    );

    // Clear existing selections
    this.selectedTicketIds = [];

    pendingTickets.forEach((ticket) => {
      ticket.isSelected = this.isAllSelected;
      if (this.isAllSelected) {
        this.selectedTicketIds.push(ticket);
      }
    });
  }

  updateSelectedTickets(ticket: any) {
    if (ticket.isSelected) {
      if (!this.selectedTicketIds.some((t) => t.Id === ticket.Id)) {
        this.selectedTicketIds.push(ticket);
      }
    } else {
      this.selectedTicketIds = this.selectedTicketIds.filter(
        (t) => t.Id !== ticket.Id
      );
    }

    // Update isAllSelected state
    const pendingTickets = this.purchasedTicketsList.filter(
      (t) => t.Status === 'Pending'
    );
    this.isAllSelected =
      pendingTickets.length > 0 &&
      pendingTickets.every((t) =>
        this.selectedTicketIds.some((selected) => selected.Id === t.Id)
      );
  }

  get selectedTicketsString(): string {
    return this.selectedTicketIds.map((ticket) => ticket.Id).join(',');
  }
  get selectedTicketsNumbers(): string {
    return this.selectedTicketIds
      .map((ticket) => ticket.TicketNumber)
      .join(',');
  }
}
