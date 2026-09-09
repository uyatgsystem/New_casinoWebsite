import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { CryptooService } from './cryptoo.service';

const RETRY_HEADER = 'X-Clock-Resynced';
const SIGNATURE_INVALID_STATUS = 903;

/**
 * HmacValidationMiddleware responds with the dedicated HTTP status 903 for a rejected
 * signature -- distinct from standard 403s (e.g. role-based [AllowedRoles] authorization
 * failures) which are not clock-related and shouldn't trigger a resync/retry. A request
 * rejected this way never reached the controller -- the middleware returns 903 before calling
 * into business logic -- so retrying it is safe (no risk of a duplicate financial operation).
 * On such a rejection, re-syncs this client's clock against the server and retries once with
 * freshly-signed headers. This self-heals cases like a manual system clock change, laptop
 * sleep/wake, or a paused VM mid-session, instead of requiring a page reload or waiting for
 * the next scheduled 10-minute sync.
 */
export const clockDriftRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const crypto = inject(CryptooService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isSignatureFailure = error.status === SIGNATURE_INVALID_STATUS;
      const alreadyRetried = req.headers.has(RETRY_HEADER);

      if (!isSignatureFailure || alreadyRetried) {
        return throwError(() => error);
      }

      return crypto.syncServerTime().pipe(
        switchMap(() => {
          const freshHeaders = crypto.generateSecurityHeaders(req.body);
          const retriedReq = req.clone({
            setHeaders: { ...freshHeaders, [RETRY_HEADER]: '1' }
          });
          return next(retriedReq);
        })
      );
    })
  );
};
