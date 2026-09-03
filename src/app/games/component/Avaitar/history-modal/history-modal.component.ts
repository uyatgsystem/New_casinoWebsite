import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './history-modal.component.html',
  styleUrls: ['./history-modal.component.scss']
})
export class HistoryModalComponent {
  @Input() rounds: { id?: string, crashPoint: number }[] = [];
  @Output() close = new EventEmitter<void>();

  getCrashColor(crashPoint: number): string {
    if (crashPoint < 2) return 'red';
    if (crashPoint < 5) return 'yellow';
    return 'green';
  }
}