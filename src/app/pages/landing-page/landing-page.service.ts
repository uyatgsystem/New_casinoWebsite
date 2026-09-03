import { Injectable } from '@angular/core';
import { ApiCallService } from '../../Services/api-call-service.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class LandingPageService {
  constructor(
    private apicallservice: ApiCallService,
    private toastr: ToastrService
  ) {}

  lotterypayload() {
    return {
      pageNumber: 1,
      pageSize: 100,
      searchText: '',
      startDate: '',
      serialNumber: 0,
      endDate: '',
      orderBy: '',
      totalRecords: 0,
    };
  }
  getActiveLotteries(): Observable<any[]> {
    const Payload = this.lotterypayload();
    return this.apicallservice
      .PostCallWithoutToken(Payload, 'Public/GetAllLotteries')
      .pipe(
        map((response: any) => {
          if (response && response.responseCode === 200) {
            return response.data;
          } else {
            // this.toastr.error(
            //   response?.errorMessage || 'Lottery not found',
            //   'Error',
            //   {
            //     timeOut: 3000,
            //     progressBar: true,
            //     closeButton: true,
            //   }
            // );
            return [];
          }
        }),
        catchError((error) => {
          // this.toastr.error(
          //   'An error occurred while getting lottery',
          //   'Error',
          //   {
          //     timeOut: 3000,
          //     progressBar: true,
          //     closeButton: true,
          //   }
          // );
          return throwError(() => error);
        })
      );
  }
}
