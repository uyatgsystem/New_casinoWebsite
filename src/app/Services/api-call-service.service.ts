import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class ApiCallService {
  constructor(private http: HttpClient) { }
  // Dev Url
  // private baseRoute = 'https://154.38.161.3:44360/api/';

  //Local Url
  // private baseRoute = 'https://localhost:7251/api/'
  // Live url
  //private baseRoute = 'https://154.38.161.3:44301/api/';
  private baseRoute = 'https://root.c-maxs.com/api/';
  // private baseRoute = 'https://154.38.161.3:44301/api/';
  PostCallWithoutToken(Payload: any, apiroute: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    var finalroute = this.baseRoute + apiroute;
    var response = this.http
      .post<any>(finalroute, Payload, { headers })
      .pipe(catchError(this.handleError));
    // console.log(response);
    return response;
  }
  PostCallWithToken(Payload: any, apiroute: string): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    headers.set('Authorization', `Bearer ${token}`);
    var finalroute = this.baseRoute + apiroute;
    var response = this.http
      .post<any>(finalroute, Payload, { headers })
      .pipe(catchError(this.handleError));
    // console.log(response);
    return response;
  }
  GetCallWithoutToken(apiroute: string): Observable<any> {
    var apiurl = this.baseRoute + apiroute;
    var response = this.http
      .get<any>(apiurl)
      .pipe(catchError(this.handleError));
    // console.log(response);
    return response;
  }
  GetCallWithToken(apiroute: string): Observable<any> {
    var apiurl = this.baseRoute + apiroute;
    const token = localStorage.getItem('token');

    // Create headers and append the token
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    var response = this.http
      .get<any>(apiurl, { headers })
      .pipe(catchError(this.handleError));
    // console.log(response);
    return response;
  }

  DeleteCallWithToken(apiroute: string): Observable<any> {
    const apiurl = this.baseRoute + apiroute;
    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    return this.http
      .delete<any>(apiurl, { headers })
      .pipe(catchError(this.handleError));
  }

  handleError(error: HttpErrorResponse) {
    if (error.status === 400) {
      // If status is 400, user already exists
      return throwError('User already exists');
    } else {
      // For other errors, log the error and throw a generic message
      // console.error('An error occurred:', error.error);
      return throwError('Something went wrong. Please try again later.');
    }
  }
}
