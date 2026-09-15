import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ApiCallService } from './api-call-service.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private pageNumber = 1;
  private pageSize = 10;
  private hasMore = true;
  private isLoading = false;

  constructor(private apiCallService: ApiCallService) { }

  // Initial load or refresh
  loadNotifications(reset: boolean = false) {
    if (this.isLoading || (!this.hasMore && !reset)) return;
    this.isLoading = true;
    if (reset) {
      this.pageNumber = 1;
      this.hasMore = true;
    }
    const url = `NotificationMessages/GetAllNotifications?PageNumber=${this.pageNumber}&PageSize=${this.pageSize}`;
    this.apiCallService.GetCallWithToken(url).subscribe(
      (response) => {
        if (response && response.responseCode === 200) {
          const newNotifications = response.data || [];
          if (newNotifications.length < this.pageSize) {
            this.hasMore = false;
          }
          if (this.pageNumber === 1 || reset) {
            this.notificationsSubject.next(newNotifications);
          } else {
            this.notificationsSubject.next([
              ...this.notificationsSubject.value,
              ...newNotifications,
            ]);
          }
        }
        this.isLoading = false;
      },
      () => {
        this.isLoading = false;
        this.hasMore = false;
      }
    );
  }

  // For infinite scroll
  loadMoreNotifications() {
    if (this.hasMore && !this.isLoading) {
      this.pageNumber++;
      this.loadNotifications();
    }
  }

  // Remove notification
  removeNotification(index: number) {
    const current = [...this.notificationsSubject.value];
    current.splice(index, 1);
    this.notificationsSubject.next(current);
  }

  // Clear all
  clearNotifications() {
    this.notificationsSubject.next([]);
    this.pageNumber = 1;
    this.hasMore = true;
  }
}
