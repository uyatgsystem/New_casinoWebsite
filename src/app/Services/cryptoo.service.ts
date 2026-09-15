import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';

const SERVER_TIME_SYNC_TIMEOUT_MS = 5000;

const BASE_ROUTE = 'https://154.38.161.3:44364/api/';
// const BASE_ROUTE = 'https://cz.lessonplay.win/api/';

@Injectable({
  providedIn: 'root',
})
export class CryptooService {
  private http = inject(HttpClient);
  private ngZone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);

  // 1. Must match C# configuration exactly
  private readonly ROTATION_INTERVAL_SECONDS = 20;
  private readonly STATIC_CORRELATION_ID = '1zmafdrlmbaqze5b7f9a2c4e609iuhgb';
  private readonly STATIC_TOKEN_PADDING = 'oiuy65rc4b3a210sft34aft10a493827202122232425262728292alkmn654fg0';
  private readonly TIME_SYNC_INTERVAL_MS = 10 * 60 * 1000; // re-sync periodically to bound drift over a long session

  // Measured delta between this device's clock and the server's clock (server - local).
  // Stays 0 (i.e. falls back to raw local time) until the first sync resolves.
  private clockOffsetMs = 0;

  constructor() {
    // Server-side rendering has no need for clock-drift correction (the server's own
    // clock is used directly), and awaiting this call would otherwise block SSR from
    // reaching zone stability if the sync endpoint is slow or unreachable.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Run outside Angular's zone -- a pending request (or repeating timer) inside the
    // zone never lets it go "stable", which would otherwise hang SSR/hydration.
    this.ngZone.runOutsideAngular(() => {
      this.syncServerTime().subscribe();
      setInterval(() => this.syncServerTime().subscribe(), this.TIME_SYNC_INTERVAL_MS);
    });
  }

  /**
   * Measures this client's clock offset from the server's clock (a lightweight handshake
   * against the AllowAnonymous auth/server-time endpoint) so signed requests use time
   * corrected for local clock drift instead of raw, possibly-inaccurate local time. Also
   * called on-demand by clockDriftRetryInterceptor when a signature is rejected, so a
   * mid-session system clock change (sleep/wake, manual change, VM pause) self-heals on the
   * next request instead of waiting for the next scheduled interval. Failures are silently
   * ignored -- the previously measured offset (or 0) is kept and the caller can retry later.
   */
  syncServerTime(): Observable<void> {
    const requestSentAt = Date.now();
    return this.http.get<{ serverTimeMs: number }>(`${BASE_ROUTE}User/server-time`).pipe(
      timeout(SERVER_TIME_SYNC_TIMEOUT_MS),
      tap((response) => {
        const responseReceivedAt = Date.now();
        const estimatedOneWayLatency = (responseReceivedAt - requestSentAt) / 2;
        this.clockOffsetMs = (response.serverTimeMs + estimatedOneWayLatency) - responseReceivedAt;
      }),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  /**
   * Generates headers required by HmacValidationMiddleware (.NET)
   */
  generateSecurityHeaders(payload: any): { [key: string]: string } {
    const timestampMs = Math.round(Date.now() + this.clockOffsetMs);
    const clientUnixSeconds = Math.floor(timestampMs / 1000);
    const currentIntervalStep = Math.floor(clientUnixSeconds / this.ROTATION_INTERVAL_SECONDS);

    // Normalize request body (handling null/undefined safely)
    let requestBodyText = '';
    if (payload !== null && payload !== undefined) {
      if (typeof payload === 'string') {
        requestBodyText = payload.trim();
      } else {
        requestBodyText = JSON.stringify(payload).trim();
      }
    }

    // Structure unique message: "{timestampMs}.{body}"
    const messageToSign = `${timestampMs}.${requestBodyText}`;

    // Derive dynamic key & Compute HMAC-SHA256 signature
    const derivedKey = this.deriveTimeBasedKey(this.STATIC_TOKEN_PADDING, currentIntervalStep);
    const computedSignature = CryptoJS.HmacSHA256(messageToSign, derivedKey).toString(CryptoJS.enc.Hex);

    return {
      'X-FP-Timestamp': timestampMs.toString(),
      'X-FP-Signature': computedSignature,
      'X-Correlation-Id': this.STATIC_CORRELATION_ID
    };
  }

  /**
   * Replicates .NET's BitConverter & byte-reversing logic to derive a dynamic key
   */
  private deriveTimeBasedKey(baseSecretUtf8: string, timeStep: number): CryptoJS.lib.WordArray {
    // Generate a Big-Endian 64-bit integer byte representation of timeStep (8 bytes)
    const stepBytes = new Uint8Array(8);
    const view = new DataView(stepBytes.buffer);

    // Set lower 32-bits (safe for JS numeric limit) in Big-Endian representation
    view.setUint32(4, timeStep, false);

    const stepWordArray = CryptoJS.lib.WordArray.create(stepBytes as any);
    const baseSecretWordArray = CryptoJS.enc.Utf8.parse(baseSecretUtf8);

    // Compute derived key: HMAC-SHA256(baseSecret, timeStepBytes)
    return CryptoJS.HmacSHA256(stepWordArray, baseSecretWordArray);
  }
}
