import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../../components/loader/loader.component';
import { LoaderService } from '../../../Services/loader-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscribe-newsletterge',
  standalone: true,
  imports: [ReactiveFormsModule, LoaderComponent, CommonModule], // Add ReactiveFormsModule here
  templateUrl: './subscribe-newsletterge.component.html',
  styleUrls: ['./subscribe-newsletterge.component.scss'],
})
export class SubscribeNewslettergeComponent {
  newsletterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiCallService,
    @Inject(ToastrService) private toastr: ToastrService,
    private loaderService: LoaderService,
    private errorHandlingService: ErrorhandlingService
  ) {
    // Initialize the reactive form
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.newsletterForm.valid) {
      this.loaderService.show();
      const emailPayload = { email: this.newsletterForm.value.email };
      this.apiService
        .PostCallWithoutToken(
          null,
          `Public/SubscribeToNewsLetter?email=${this.newsletterForm.value.email}`
        )
        .subscribe({
          next: (response) => {
            // console.log('Subscription successful:', response);
            // alert('Subscription successful!');
            if (response.responseCode === 200) {
              this.toastr.success(
                'Thank you! You are now subscribed and will start receiving updates.',
                'Success'
              );
            }
            else{
              //error handling service
              this.errorHandlingService.handleResponseError(response);
            }
          },
          error: (error) => {
            // console.error('Error:', error);
            // alert('An error occurred. Please try again.');
            //error handling service
            this.errorHandlingService.handleHttpError(error);
          },
        });
    } else {
      // alert('Please enter a valid email address.');
      this.toastr.warning('Email is required', 'Warning');
    }
  }
}
