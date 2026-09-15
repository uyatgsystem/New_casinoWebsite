import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { SpinResult } from '../../Baccaret/models/spin-result.model';

@Component({
  selector: 'app-result-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './result-popup.component.html',
  styleUrls: ['./result-popup.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class ResultPopupComponent implements OnInit {
  @Input() result: SpinResult | null = null;
  @Input() show: boolean = false;
  @Output() close = new EventEmitter<void>();

  autoCloseTimeout: any;

  ngOnInit(): void {
    if (this.show && this.result) {
      this.startAutoClose();
    }
  }

  ngOnChanges(): void {
    if (this.show && this.result) {
      this.startAutoClose();
    } else {
      this.clearAutoClose();
    }
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
  }

  startAutoClose(): void {
    this.clearAutoClose();
    this.autoCloseTimeout = setTimeout(() => {
      this.onClose();
    }, 3000);
  }

  clearAutoClose(): void {
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
