import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { ApiCallService } from './api-call-service.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorhandlingService {
  showModalSubject = new BehaviorSubject<boolean>(false);
  unauthorizedSubject = new Subject<void>();

  // constructor(private spinner: NgxSpinnerService) { }

  constructor(
    private spinner: NgxSpinnerService,
    private router: Router,
    private toastr: ToastrService,
    private apicalling: ApiCallService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) { }

  private getResponseMessage(response: any): string {
    const message =
      response?.errorMessage ??
      response?.responseMessage ??
      response?.message ??
      '';

    return typeof message === 'string' ? message.trim() : '';
  }

  public showAlert(
    icon: 'warning' | 'error' | 'success',
    text: string,
    compact = true,
    autoCloseMs?: number,
  ) {
    const normalizedText = (text ?? '').toString().trim();

    // Avoid empty startup popups like a bare "Warning!".
    if (icon === 'warning' && !normalizedText) {
      this.spinner.hide();
      return;
    }

    this.spinner.hide();

    const defaultTimers: Record<string, number> = {
      warning: 3500,
      error: 5000,
      success: 2200,
    };

    const timer =
      typeof autoCloseMs === 'number' ? autoCloseMs : defaultTimers[icon];

    Swal.fire({
      icon,
      title:
        icon === 'error'
          ? 'Error!'
          : icon === 'warning'
            ? 'Warning!'
            : 'Success!',
      text: normalizedText,
      customClass: { popup: compact ? 'swal-compact' : '' },
      showClass: {
        popup: 'animate__animated animate__backInUp animate__fast',
      },
      hideClass: {
        popup: 'animate__animated animate__backOutUp animate__fast',
      },
      ...(timer > 0
        ? {
          timer,
          timerProgressBar: true,
          didOpen: () => {
            const popup = Swal.getPopup();
            if (!popup) return;
            popup.addEventListener('mouseenter', Swal.stopTimer);
            popup.addEventListener('mouseleave', Swal.resumeTimer);

            // Fallback: if SweetAlert2 doesn't inject the timer bar, create our own and animate it
            const existing = popup.querySelector('.swal2-timer-progress-bar');
            if (!existing) {
              const bar = document.createElement('div');
              bar.className = 'swal2-timer-progress-bar';
              const fill = document.createElement('div');
              fill.className = 'swal2-timer-progress-filled';
              bar.appendChild(fill);
              popup.appendChild(bar);

              // animate width from 100% -> 0% over `timer` ms
              const start = performance.now();
              const duration = timer as number;
              let rafId: number | null = null;

              const frame = (now: number) => {
                const elapsed = now - start;
                const pct = Math.max(0, 1 - elapsed / duration);
                fill.style.width = `${pct * 100}%`;
                if (pct > 0) rafId = requestAnimationFrame(frame);
              };

              rafId = requestAnimationFrame(frame);

              // Pause/resume on hover
              const pause = () => {
                if (rafId) cancelAnimationFrame(rafId);
              };
              const resume = () => {
                const w = parseFloat(fill.style.width) || 0;
                const remaining = (w / 100) * duration;
                const newStart = performance.now() - (duration - remaining);
                const frameResume = (now: number) => {
                  const elapsed = now - newStart;
                  const pct = Math.max(0, 1 - elapsed / duration);
                  fill.style.width = `${pct * 100}%`;
                  if (pct > 0) rafId = requestAnimationFrame(frameResume);
                };
                rafId = requestAnimationFrame(frameResume);
              };

              popup.addEventListener('mouseenter', pause);
              popup.addEventListener('mouseleave', resume);

              const observer = new MutationObserver(() => {
                if (!document.body.contains(popup)) {
                  if (rafId) cancelAnimationFrame(rafId);
                  observer.disconnect();
                }
              });
              observer.observe(document.body, {
                childList: true,
                subtree: true,
              });
            }
          },
          willClose: () => {
            const popup = Swal.getPopup();
            if (!popup) return;
            popup.removeEventListener('mouseenter', Swal.stopTimer);
            popup.removeEventListener('mouseleave', Swal.resumeTimer);
          },
        }
        : {}),
    });
  }

  handleResponseError(response: any): void {
    const responseMessage = this.getResponseMessage(response);

    if (response.responseCode === 400) {
      if (
        response.errorMessage ===
        'You dont have sufficient balance for this request' ||
        response.errorMessage === 'Insufficient balance in your wallet.'
      ) {
        this.showModalSubject.next(true);
      }
      this.showAlert('warning', responseMessage);
      return;
    }

    if (response.responseCode === 500) {
      this.showAlert(
        'error',
        responseMessage || 'Please Try Again Error occurred',
      );
      return;
    }

    // default for other response codes (401, 404, etc.)
    this.showAlert('warning', responseMessage);
  }

  handleHttpError(error: HttpErrorResponse): void {
    if (error.status === 400) {
      this.showAlert('warning', 'Please Try Again 400');
      return;
    }

    if (error.status === 404) {
      this.showAlert('warning', 'Please Try Again 404');
      return;
    }

    if (error.status === 401) {
      this.refreshToken();
      // this.unauthorizedSubject.next();
      return;
    }

    this.showAlert('error', 'Please Try Again Error occurred');
  }
  refreshToken() {
    const userId = localStorage.getItem('userId');
    this.apicalling
      .GetCallWithToken('User/RefreshToken?UserId=' + userId)
      .subscribe({
        next: (response) => {
          if (response && response.responseCode === 200) {
            if (response.data.token) {
              localStorage.setItem('token', response.data.token);
            }
          }
        },
        error: (error) => {
          // this.handleError.handleHttpError(error);
          // this.hideWalletModal();
        },
      });
  }
}
