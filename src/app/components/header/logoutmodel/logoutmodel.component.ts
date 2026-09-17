import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logoutmodel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logoutmodel.component.html',
  styleUrl: './logoutmodel.component.scss',
})
export class LogoutmodelComponent {
  @Input() isOpen = false;
  @Input() profileImage = '';
  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  cancel(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.onCancel.emit();
  }

  confirm(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.onConfirm.emit();
  }
}
