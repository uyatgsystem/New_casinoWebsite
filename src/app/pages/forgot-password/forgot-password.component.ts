import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../components/loader/loader.component';
import { LoaderService } from '../../Services/loader-service.service';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { SafeHtml } from '@angular/platform-browser';
import { UtilsService } from '../../Services/utils.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    CommonModule,
    LoaderComponent,
    FontAwesomeModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  leftArrow = faChevronLeft;
  grainBackdrop: SafeHtml = '';
  constructor(
    private fb: FormBuilder,
    private apiCallService: ApiCallService,
    private router: Router,
    private toastr: ToastrService,
    private loaderService: LoaderService,
    private errorHandling: ErrorhandlingService,
    private location: Location,
    private utils: UtilsService,
  ) {
    this.grainBackdrop = this.utils.getGrainBackdrop();
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  //   ngOnInit(): void {
  //   this.loaderService.show();
  //   setTimeout(() => {
  //     this.loaderService.hide();
  //   }, 1000); // 1 second
  // }

  //   onSubmit() {
  //     if (this.forgotPasswordForm.valid) {
  //       this.loaderService.show();
  //       const email = this.forgotPasswordForm.value.email;

  //       this.apiCallService
  //         .PostCallWithoutToken({ email }, 'User/ForgotPassword')
  //         .subscribe(
  //           (response) => {
  //             if (response && response.responseCode === 200) {
  //               // console.log('Password reset email sent successfully', response);
  //               this.toastr.success(
  //                 'Password reset email sent successfully. Please check your inbox.',
  //                 'Success',
  //                 {
  //                   timeOut: 3000,
  //                   progressBar: true,
  //                   closeButton: true,
  //                 }
  //               );
  //               this.router.navigate(['/Login']);
  //               this.loaderService.hide();
  //             } else {
  //               // console.log('Password reset failed', response);
  //               this.toastr.error(
  //                 response?.errorMessage ||
  //                   'Failed to send password reset email. Please try again.',
  //                 'Error',
  //                 {
  //                   timeOut: 3000,
  //                   progressBar: true,
  //                   closeButton: true,
  //                 }
  //               );
  //             }
  //           },
  //           (error) => {
  //             // console.error('Password reset failed', error);
  //             this.toastr.error(
  //               'An error occurred while sending the password reset email. Please try again.'
  //             );
  //             this.loaderService.hide();
  //           }
  //         );
  //     }
  //   }

  //   goBack() {
  //     this.router.navigate(['/Login']);
  //   }
  // }

  onSubmit() {
    if (this.forgotPasswordForm.valid) {
      this.loaderService.show();
      const email = this.forgotPasswordForm.value.email;
      this.apiCallService
        .PostCallWithoutToken({ email }, 'User/ForgotPassword')
        .subscribe(
          (response) => {
            if (response && response.responseCode === 200) {
              this.toastr.success(
                'Password reset email sent successfully. Please check your inbox.',
                'Success',
                {
                  timeOut: 3000,
                  progressBar: true,
                  closeButton: true,
                },
              );
              // Navigate to ForgotChangePasswordComponent and pass email
              // this.router.navigate(['/ForgotChangePassword'], {
              //   queryParams: { email: email },
              // });
              this.loaderService.hide();
              // console.log('first' + email);
            } else {
              // this.toastr.error(
              //   response?.errorMessage || 'Failed to send password reset email. Please try again.',
              //   'Error',
              //   {
              //     timeOut: 3000,
              //     progressBar: true,
              //     closeButton: true,
              //   }
              // );
              this.errorHandling.handleResponseError(response);
            }
          },
          (error) => {
            this.toastr.error(
              'An error occurred while sending the password reset email. Please try again.',
            );
            this.loaderService.hide();
            this.errorHandling.handleHttpError(error);
          },
        );
    }
  }

  goBack() {
    this.location.back();
  }
}
