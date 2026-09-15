import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { PaymentResponse } from '../../Interfaces/interfaces';

@Component({
  selector: 'app-verify-payment',
  templateUrl: './verify-payment.component.html',
  imports: [CommonModule, ToastrModule],
})
export class VerifyPaymentComponent implements OnInit {
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private apicalling: ApiCallService,
    private toastr: ToastrService,
    private errorHandling: ErrorhandlingService
  ) { }

  paymentId!: string;
  status!: string;
  message!: string;
  amount: number = 0;
  accountId!: string;

  ngOnInit() {
    this.paymentId = this.route.snapshot.queryParams['payment_intent'];
    this.accountId = this.route.snapshot.queryParams['accountId'];
    this.verifyPayment(this.paymentId);
  }

  private verifyPayment(paymentId: string) {
    this.apicalling
      .PostCallWithoutToken(null,
        `PaymentIntent/CheckPayment?Id=${paymentId}&AccountId=${this.accountId}`
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.responseCode === 200) {
            this.status = 'success'
            const message = response.responseMessage;
            this.message = message;
            this.toastr.success(message);
          }
          else if (response.responseCode === 400) {
            this.status = 'error'
            this.loading = false;
            this.toastr.error(response.errorMessage);
          }
          else {
            this.errorHandling.handleResponseError(response);
            this.status = 'error'
            this.loading = false;
          }
          error: (error: any) => {
            this.loading = false;
            this.status = 'error'
            this.errorHandling.handleHttpError(error);
          }
        }
      });
  }

}
