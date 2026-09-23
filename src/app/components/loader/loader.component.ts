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

  private readonly statusMessages: string[] = [
    'CONNECTING SECURE PROTOCOLS...',
    'SYNCING VIP REWARDS MATRIX...',
    'AUTHENTICATING CROWN-SPIN LEDGER...',
    'VERIFYING PROVABLY FAIR VAULT...',
    'INITIALIZING CASINO ENGINE...'
  ];

  currentMessageIndex: number = 0;
  statusMessage: string = this.statusMessages[0];

  segments: number[] = Array.from({ length: 14 }, (_, i) => i);
  activeSegment: number = 0;

  private messageTimer?: ReturnType<typeof setInterval>;
  private meterTimer?: ReturnType<typeof setInterval>;

  constructor(private loaderService: LoaderService) {}

  ngOnInit() {
    this.sub = this.loaderService.loading$.subscribe((loading) => {
      this.isLoading = loading;
    });

    this.messageTimer = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.statusMessages.length;
      this.statusMessage = this.statusMessages[this.currentMessageIndex];
    }, 1800);

    this.meterTimer = setInterval(() => {
      this.activeSegment = (this.activeSegment + 1) % this.segments.length;
    }, 120);
  }

  ngOnDestroy() {
    if (this.sub) this.sub.unsubscribe();
    if (this.messageTimer) clearInterval(this.messageTimer);
    if (this.meterTimer) clearInterval(this.meterTimer);
  }
}