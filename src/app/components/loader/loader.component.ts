import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSpinnerModule } from 'ngx-spinner';
import { LoaderService } from '../../Services/loader-service.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit, OnDestroy {
  isLoading: boolean = false;
  private sub?: Subscription;

  readonly statusMessages: string[] = [
    'Loading VIP Experience',
    'Preparing Provably Fair Games',
    'Syncing Live Jackpots',
    'Securing Player Session',
    'Welcome to SpinHub'
  ];

  currentMessageIndex: number = 0;
  statusMessage: string = this.statusMessages[0];
  private messageTimer?: ReturnType<typeof setInterval>;

  constructor(private loaderService: LoaderService) {}

  ngOnInit() {
    this.sub = this.loaderService.loading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    this.messageTimer = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.statusMessages.length;
      this.statusMessage = this.statusMessages[this.currentMessageIndex];
    }, 1800);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.messageTimer) clearInterval(this.messageTimer);
  }
}