import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiCallService } from '../../Services/api-call-service.service';
import { VerificationState } from '../../Interfaces/interfaces';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LoaderComponent } from '../../components/loader/loader.component';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../Services/error-handling.service';

@Component({
  selector: 'app-verification-email',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FontAwesomeModule,
    RouterModule,
    ToastrModule,
  ],
  templateUrl: './verification-email.component.html',
  styleUrls: ['./verification-email.component.scss'],
})
export class VerificationEmailComponent implements OnInit {
  state: VerificationState = {
    status: 'loading',
    progress: 0,
    message: 'Initiating verification...',
    image: '/Images/https://cmax-2.pages.dev/assets/icons/EmailVerified.png',
  };
  isApiRequestCompleted: boolean = false;

  constructor(
    private router: Router,
    private apiCallService: ApiCallService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private handleError: ErrorhandlingService
  ) { }

  ngOnInit() {
    localStorage.clear();
    const token = this.route.snapshot.queryParams['token'];

    if (token) {
      this.verifyEmail(token);
    } else {
      this.state = {
        status: 'error',
        progress: 100,
        message: 'Invalid or missing token. Please try again.',
        image: 'https://cmax-2.pages.dev/assets/icons/EmailError.png',
      };
      this.isApiRequestCompleted = true;
    }
  }

  async verifyEmail(token: string) {
    try {
      for (let i = 0; i <= 80; i += 20) {
        this.state = {
          ...this.state,
          progress: i,
          message: `Verifying email... ${i}%`,
        };
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const apiurl = `User/UserVerify?token=${token}`;
      this.apiCallService.PostCallWithToken(null, apiurl).subscribe(
        (response) => {
          if (response.responseCode === 200) {
            this.state = {
              status: 'success',
              progress: 100,
              message:
                'Thank you for verifying your email address. Your verification is in progress and will be completed shortly. Please do not refresh or close this page.',
              image: 'https://cmax-2.pages.dev/assets/icons/EmailVerified.png',
            };
            this.toastr.success(
              'Thank you for verifying your email address. Your verification is in progress and will be completed shortly. Please do not refresh or close this page.',
              'Email Verified'
            );
          } else {
            this.state = {
              status: 'error',
              progress: 100,
              message:
                "We're sorry, but we couldn't verify your email address. This may be due to an invalid link or an expired verification request. Please try again by requesting a new verification email.",
              image: 'https://cmax-2.pages.dev/assets/icons/EmailError.png',
            };
            this.handleError.handleResponseError(response);
          }
          this.isApiRequestCompleted = true;
        },
        (error) => {
          this.state = {
            status: 'error',
            progress: 100,
            message: 'An error occurred during verification. Please try again.',
            image: 'https://cmax-2.pages.dev/assets/icons/EmailError.png',
          };
          this.isApiRequestCompleted = true;
          this.handleError.handleHttpError(error);
        }
      );
    } catch (error) {
      this.state = {
        status: 'error',
        progress: 100,
        message: 'An error occurred during verification. Please try again.',
        image: 'https://cmax-2.pages.dev/assets/icons/EmailError.png',
      };
      this.toastr.error(
        'An error occurred during verification. Please try again.',
        'Error'
      );
      this.isApiRequestCompleted = true;
    }
  }
}
