import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxSpinnerService, NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule, NgxSpinnerModule],
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit, OnDestroy {
  private statusMessages: string[] = [
    'INITIALIZING VIP MATRIX...',
    'SHUFFLING PROVABLY FAIR REELS...',
    'CONNECTING TO ENCRYPTED VAULT...',
    'SECURING 256-BIT TRANSACTIONS...',
    'SYNCHRONIZING CASINO NETWORK...'
  ];
  currentMessageIndex: number = 0;
  statusMessage: string = this.statusMessages[0];
  private timer: any;

  constructor(private spinner: NgxSpinnerService) {}

  ngOnInit() {
    this.timer = setInterval(() => {
      this.currentMessageIndex = (this.currentMessageIndex + 1) % this.statusMessages.length;
      this.statusMessage = this.statusMessages[this.currentMessageIndex];
    }, 1800);
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}