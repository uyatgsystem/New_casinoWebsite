import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiCallService } from './api-call-service.service';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  constructor(private apiCallService: ApiCallService) { }

  private countryCodeSubject = new BehaviorSubject<string | null>(null);
  countryCode$ = this.countryCodeSubject.asObservable();

  setCountry(code: string) {
    this.countryCodeSubject.next(code);
  }


  // Customer Level Update
  UpdateCustomerLevel(customerId: any) {
    return this.apiCallService.GetCallWithToken(
      `User/UpdateCustomerLevel?customerId=` + customerId
    );
  }
}
