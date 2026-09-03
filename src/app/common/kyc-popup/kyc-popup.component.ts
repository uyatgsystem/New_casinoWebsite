import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-kyc-popup',
  imports: [CommonModule],
  templateUrl: './kyc-popup.component.html',
  styleUrl: './kyc-popup.component.scss'
})
export class KycPopupComponent {
  //  Dynamic content
  @Input() title: string = 'KYC Verification';
  @Input() message: string = '';
  @Input() buttonText: string = 'Got it';

  //  Optional routing
  @Input() redirectRoute: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() action = new EventEmitter<void>();

  isProcessing = false;

  constructor(private router: Router) { }

  onAction() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    if (this.redirectRoute) {
      this.router.navigate([this.redirectRoute]);
    }
    this.action.emit();
    this.close.emit();
  }

  onClose() {
    this.close.emit();
  }
}
