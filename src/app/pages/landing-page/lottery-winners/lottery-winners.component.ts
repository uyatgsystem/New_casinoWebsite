import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { LocalTimePipe } from "../../../Pipes/local-time.pipe";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


interface Winner {
  id: number;
  name: string;
  location: string;
  amount: number;
  avatar: string;
}

interface LotteryTab {
  id: string;
  name: string;
  active: boolean;
}

interface LotteryWinner {
  winnerName: string;
  winningNumbers: string;
  prize: number;
  drawDateTime: Date;
}

@Component({
  selector: 'app-lottery-winners',
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './lottery-winners.component.html',
  styleUrl: './lottery-winners.component.scss'
})
export class LotteryWinnersComponent {
  infoIcon = faCircleInfo;

  activeTabId: number | null = null;
  originalLotteryList: any = [];
  private initialized = false;

  lotteryWinner: LotteryWinner[] = [
    {
      winnerName: 'Alice Johnson',
      winningNumbers: '12, 23, 34, 45, 56',
      prize: 5000,
      drawDateTime: new Date('2025-09-25T14:30:00'),
    },
    {
      winnerName: 'Bob Smith',
      winningNumbers: '03, 18, 21, 39, 44',
      prize: 3000,
      drawDateTime: new Date('2025-09-26T11:00:00'),
    },
    {
      winnerName: 'Charlie Davis',
      winningNumbers: '07, 14, 28, 33, 49',
      prize: 10000,
      drawDateTime: new Date('2025-09-27T18:45:00'),
    },
    {
      winnerName: 'Diana Prince',
      winningNumbers: '02, 13, 26, 37, 48',
      prize: 2000,
      drawDateTime: new Date('2025-09-28T09:15:00'),
    },
    {
      winnerName: 'Ethan Hunt',
      winningNumbers: '01, 19, 24, 35, 50',
      prize: 7500,
      drawDateTime: new Date('2025-09-29T16:20:00'),
    }
  ];

  @Input() set lotteryName(value: any[]) {
    if (value && value.length) {
      this.originalLotteryList = value;
    }
  }

  constructor(private apicallservice: ApiCallService, private toaster: ToastrService) { }

  ngOnInit() {
    this.selectTab(1)
  }

  // ngAfterViewChecked(): void {
  //   if (!this.initialized && this.originalLotteryList.length > 0) {

  //     this.activeTabId = this.originalLotteryList[0].Id;
  //     this.selectTab(this.activeTabId);
  //     this.initialized = true;
  //   }
  // }

  // Handle Tabs

  showAllTabs: boolean = false;

  get displayedTabs() {
    return this.showAllTabs ? this.originalLotteryList : this.originalLotteryList.slice(0, 6);
  }

  // Api CAll s for Lottery Winners Tab

  isLoading = false;
  lotteryWinners: any[] = [];

  selectTab(id: any) {


    this.activeTabId = id;
    this.isLoading = true;

    this.apicallservice.GetCallWithoutToken('Public/GetLotteryWinner?LotteryId=' + id).subscribe(
      (response: any) => {
        if (response.responseCode === 200) {
          this.lotteryWinners = response.data;
        } else {
          this.lotteryWinners = [];
        }
        this.isLoading = false;
      },
      (error) => {
        this.toaster.error('Something went wrong');
        this.isLoading = false;
      }
    );
  }


}
