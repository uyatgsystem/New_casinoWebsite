import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiCallService } from '../../Services/api-call-service.service';

export interface PaymentRequestPayload {
  customerId: number;
  source: string;
  amount: number;
}

export interface PaymentRequestResponse {
  responseCode: number;
  errorMessage: string;
  responseMessage: string;
  data: string; // This is the request ID
}

export interface BetResponse {
  responseCode: number;
  errorMessage: string;
  responseMessage: string;
  data: {
    type: 'BOMB' | 'DIAMOND';
  };
}

export interface CheckoutPayload {
  customerId: number;
  requestId: string;
  source: string;
  amount: number;
}

export interface CheckoutResponse {
  responseCode: number;
  errorMessage: string;
  responseMessage: string;
  data: string;
}

@Injectable({
  providedIn: 'root'
})
export class MinesApiService {

  constructor(private apiCallService: ApiCallService) {}

  createPaymentRequest(payload: PaymentRequestPayload): Observable<PaymentRequestResponse> {
    return this.apiCallService.PostCallWithToken(payload, 'Customer/CreateMinesPaymentRequest');
  }


  // payload must include customerId, requestId, totalMines and cubeSize
  placeBet(payload: { customerId: number; requestId: string; totalMines: number; cubeSize: string }): Observable<BetResponse> {
    return this.apiCallService.PostCallWithToken(payload, 'Customer/MinesBet');
  }

  checkout(payload: CheckoutPayload): Observable<CheckoutResponse> {
    return this.apiCallService.PostCallWithToken(payload, 'Customer/MinesCheckout');
  }
}
