import { Component } from '@angular/core';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { LoaderService } from '../../Services/loader-service.service';
import { ApiCallService } from '../../Services/api-call-service.service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-referal-cta',
  imports: [CommonModule],
  templateUrl: './referal-cta.component.html',
  styleUrl: './referal-cta.component.scss'
})
export class ReferalCtaComponent {
    constructor(
        private router: Router,
        private apiCallService: ApiCallService,
        private loaderService: LoaderService,
        private _errorHandleService: ErrorhandlingService,
      ) {
      }
      ngOnInit(){
           this.getReferalbonus();
      }
 showRefralModal:boolean=false;
  buttonText = "COPY LINK";
private readonly baseUrl = "https://gilded.game/SignUp?refral=";
get referralLink(): string {
    const code = localStorage.getItem('code') || '';
    return `${this.baseUrl}${encodeURIComponent(code)}`;
  }
  copyToClipboard() {
    navigator.clipboard.writeText(this.referralLink).then(() => {
      this.buttonText = "COPIED!";
      setTimeout(() => this.buttonText = "COPY LINK", 2000);
    });
  }

  closeReferal() {
      this.showRefralModal=false;
  }
  openrefral(){
    
      // this.router.navigate(['dashboard/complete-profile']);   
      this.router.navigate(['dashboard/complete-profile'], { queryParams: { ref: 'active' } });
    // this.showRefralModal=true;
    // this.getReferalbonus();
  }
  refPercentage:any
  refCount:any
getReferalbonus() {
  this.apiCallService
    .GetCallWithoutToken('User/Getreferralbonus')
    .subscribe({
      next: (response) => {
        if (response.responseCode === 200 && response.data) {
          const data = response.data;
          // Safely find the specific objects based on PaymentName
          const percentageObj = data.find((item: any) => item.PaymentName === 'ReferralBonus');
          const countObj = data.find((item: any) => item.PaymentName === 'Referralcount');
          // Assign the values if found, otherwise default to 0
          this.refPercentage = percentageObj ? percentageObj.Bonus : '';
          this.refCount = countObj ? countObj.Bonus : '';
        }
      },
      error: (error) => {
        this.apiCallService.handleError(error);
      },
    });
}

  // Add this variable to your class
isBannerVisible = true;

// Add this function
closeBanner(event: Event) {
  // This prevents the click from bubbling up to the button underneath
  event.stopPropagation();
  this.isBannerVisible = false;
}

gotoreflist(){
  this.showRefralModal=false;
      this.router.navigate(['dashboard/complete-profile']);        
}
}
