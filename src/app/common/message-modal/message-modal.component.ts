import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-message-modal',
  imports: [
    CommonModule
  ],
  templateUrl: './message-modal.component.html',
  styleUrl: './message-modal.component.scss'
})
export class MessageModalComponent {
  @Input() show = false;            // modal show/hide
  @Input() type: 'success' | 'warning' | 'error' = 'success'; // modal type
  @Input() title: string = '';
  @Input() message: string = '';
  @Output() close = new EventEmitter<void>();

  // internal computed values
  get iconColor(): string {
    switch (this.type) {
      case 'success': return '#00F5D4'; // hyper teal
      case 'warning': return '#FF9F1C'; // solar amber
      case 'error': return '#ef4444';   // red
      default: return '#00F5D4';
    }
  }

  get iconSvg(): string {
    switch (this.type) {
      case 'success': return 'M20 6L9 17l-5-5';       // checkmark
      case 'warning': return 'M12 8v4m0 4h.01';       // exclamation
      case 'error': return 'M6 18L18 6M6 6l12 12';  // cross
      default: return 'M20 6L9 17l-5-5';
    }
  }

  closeModal() {
    this.close.emit();
  }
}
