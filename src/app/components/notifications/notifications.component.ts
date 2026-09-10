import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Output,
  OnInit,
  EventEmitter,
  ChangeDetectorRef,
  Input,
  ViewChild,
  AfterViewInit,
} from '@angular/core';

import { ApiCallService } from '../../Services/api-call-service.service';
import { NotificationService } from '../../Services/notification.service';
import { Router } from '@angular/router';
import { CarouselSlideDirective } from 'ngx-owl-carousel-o';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'],
})
export class NotificationsComponent implements OnInit, AfterViewInit {
  @Input() notifications: any[] = [];
  @Output() closeNotification = new EventEmitter<void>();
  @Output() notificationsCount = new EventEmitter<number>();
  @Output() openChat = new EventEmitter<void>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  isVisible = true;
  pageNumber = 1;
  pageSize = 10;
  isLoading = false;
  hasMore = true;

  constructor(
    private eRef: ElementRef,
    private apiCallService: ApiCallService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private router: Router
  ) { }

  ngOnInit() {
    this.notificationService.notifications$.subscribe((notifs) => {
      this.notifications = notifs;
      this.notificationsCount.emit(notifs.length);
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.addEventListener(
        'scroll',
        this.onScroll.bind(this)
      );
    }
  }

  onScroll(event: any) {
    const element = event.target;
    if (
      element.scrollHeight - element.scrollTop <= element.clientHeight + 10 &&
      !this.isLoading &&
      this.hasMore
    ) {
      this.notificationService.loadMoreNotifications();
    }
  }
  onNotificationClick(notification: any) {
    const notificationId = notification.Id;
    const type = notification.Type;
    let lastWord = '';
    if (notification?.Type == 'AddScore' && notification?.Notifications) {
      const words = notification.Notifications.trim().split(/\s+/);
      lastWord = words[words.length - 1];
    }
    this.apiCallService
      .PostCallWithToken(
        '',
        `NotificationMessages/ReadMessages?NotificationId=${notificationId}&Type=${type}`
      )
      .subscribe();
    this.navigateByType(type, lastWord);

    this.notificationService.loadNotifications(true);
    this.isVisible = false;
    this.closeNotification.emit();
  }
  navigateByType(type: string, gameName: string = '') {
    switch (type.toLowerCase()) {
      case 'wallet':
        this.router.navigate(['/dashboard/wallet']);
        break;
      case 'radeem':
        this.router.navigate(['/dashboard/redeem']);
        break;
      case 'home':
        this.router.navigate(['/dashboard/home']);
        break;
      case 'lottery':
        this.router.navigate(['/dashboard/lottery']);
        break;
      case 'addscore':
        localStorage.setItem('GN', gameName);
        this.router.navigate(['/dashboard/credentials']);
        break;
      case 'message':
        this.openChat.emit(); // Emit event to open chat
        break;
      default:
        this.router.navigate(['/dashboard/home']);
        break;
    }
  }

  removeNotification(index: number, event: Event) {
    event.stopPropagation();   // stop parent click
    event.preventDefault();
    ;
    const notification = this.notifications[index];
    const notificationId = notification.Id;
    const type = notification.Type;

    // Call the read API when closing
    this.apiCallService
      .PostCallWithToken(
        '',
        `NotificationMessages/ReadMessages?NotificationId=${notificationId}&Type=${type}`
      )
      .subscribe();

    this.notifications[index].removing = true;
    setTimeout(() => {
      this.notificationService.removeNotification(index);
      this.cdr.detectChanges();
    }, 600);
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isVisible = false;
      this.closeNotification.emit();
    }
  }
}
