import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CryptooService } from './cryptoo.service'; // Ensure this path matches your file structure

@Injectable({
  providedIn: 'root',
})
export class ApiCallService {

    private baseRoute = 'https://154.38.161.3:44364/api/';
    // private baseRoute = 'https://cz.lessonplay.win/api/';
  constructor(
    private http: HttpClient,
    private crypto: CryptooService // Injecting the time-based crypto engine
  ) {}

  /**
   * Helper to construct headers with dynamic time-based HMAC validation signatures
   */
  private getHeaders(payload: any, useToken: boolean): HttpHeaders {
    // 1. Generate rolling dynamic signatures
    const cryptoHeaders = this.crypto.generateSecurityHeaders(payload);

    let headerConfig: { [key: string]: string } = {
      'Content-Type': 'application/json',
      ...cryptoHeaders
    };

    // 2. Safely grab and append Bearer token if required
    if (useToken) {
      const token = localStorage.getItem('token');
      if (token) {
        headerConfig['Authorization'] = `Bearer ${token}`;
      }
    }

    return new HttpHeaders(headerConfig);
  }

  /* ==========================================
      POST CALLS
     ========================================== */
  PostCallWithoutToken<T = any>(Payload: any, apiroute: string): Observable<T> {
    const headers = this.getHeaders(Payload, false);
    const finalroute = this.baseRoute + apiroute;
    return this.http
      .post<T>(finalroute, Payload, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  PostCallWithToken<T = any>(Payload: any, apiroute: string): Observable<T> {
    const headers = this.getHeaders(Payload, true);
    const finalroute = this.baseRoute + apiroute;
    return this.http
      .post<T>(finalroute, Payload, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  /* ==========================================
      GET CALLS
     ========================================== */
  GetCallWithoutToken<T = any>(apiroute: string): Observable<T> {
    const headers = this.getHeaders(null, false);
    const apiurl = this.baseRoute + apiroute;
    return this.http
      .get<T>(apiurl, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  GetCallWithToken<T = any>(apiroute: string): Observable<T> {
    const headers = this.getHeaders(null, true);
    const apiurl = this.baseRoute + apiroute;
    return this.http
      .get<T>(apiurl, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  /* ==========================================
      DELETE CALLS
     ========================================== */
  DeleteCallWithoutToken<T = any>(apiroute: string): Observable<T> {
    const headers = this.getHeaders(null, false);
    const apiurl = this.baseRoute + apiroute;
    return this.http
      .delete<T>(apiurl, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  DeleteCallWithToken<T = any>(apiroute: string): Observable<T> {
    const headers = this.getHeaders(null, true);
    const apiurl = this.baseRoute + apiroute;
    return this.http
      .delete<T>(apiurl, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  /* ==========================================
      PUT CALLS
     ========================================== */
  PutCallWithoutToken<T = any>(Payload: any, apiroute: string): Observable<T> {
    const headers = this.getHeaders(Payload, false);
    const finalroute = this.baseRoute + apiroute;
    return this.http
      .put<T>(finalroute, Payload, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  PutCallWithToken<T = any>(Payload: any, apiroute: string): Observable<T> {
    const headers = this.getHeaders(Payload, true);
    const finalroute = this.baseRoute + apiroute;
    return this.http
      .put<T>(finalroute, Payload, { headers })
      .pipe(catchError(this.handleError), shareReplay());
  }

  /* ==========================================
      ERROR HANDLING
     ========================================== */
  /**
   * Changed from "private" to "public" to prevent TS2341 compilation errors
   * when components access this helper directly.
   */
  public handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }
}
