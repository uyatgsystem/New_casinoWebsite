import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ApiCallService } from '../../Services/api-call-service.service';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { ErrorhandlingService } from '../../Services/error-handling.service';
import { PaymentResponse } from '../../Interfaces/interfaces';
@Component({
  selector: 'app-verify-payment-taptap',
 imports: [CommonModule, ToastrModule],
  templateUrl: './verify-payment-taptap.component.html',
  styleUrl: './verify-payment-taptap.component.scss'
})
export class VerifyPaymentTaptapComponent implements OnInit {
  loading:boolean = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private apicalling: ApiCallService,
    private toastr: ToastrService,
    private errorHandling: ErrorhandlingService
  ) { }

  GetStatusAsync!: any;
  status!: string;
  message!: string;
  amount: number = 0;
  source!: any;

  ngOnInit() {
    this.GetStatusAsync = this.route.snapshot.queryParams['GetStatusAsync'];
    this.source = this.route.snapshot.queryParams['source'];
    this.verifyPayment(this.GetStatusAsync,this.source);
  }

private verifyPayment(GetStatusAsync: any, source: any) {
  this.loading = true; // Ensure loader starts
  
  this.apicalling
    .GetCallWithoutToken(
      `TapTapup/checkstatus?GetStatusAsync=${GetStatusAsync}&source=${source}`
    )
    .subscribe({
      next: (response) => {
        this.loading = false; // Always stop loader

        if (response.responseCode === 200) {
          this.status = 'success';
          this.message = response.responseMessage;
          this.toastr.success(this.message);
        } else {
          // Handles 400s or any other non-200 code
          this.status = 'error';
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error: any) => {
        this.loading = false; // Always stop loader
        this.status = 'error';
        this.errorHandling.handleHttpError(error);
      }
    });
}

}
