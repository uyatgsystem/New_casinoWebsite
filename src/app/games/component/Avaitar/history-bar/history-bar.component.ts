import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-history-bar',
  templateUrl: './history-bar.component.html',
  styleUrls: ['./history-bar.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class HistoryBarComponent {
  @Input() rounds: { id?: string, crashPoint: number }[] = [];
  @Output() openHistoryModal = new EventEmitter<void>();

  getCrashColor(crashPoint: number): string {
    if (crashPoint < 2) return 'red';
    if (crashPoint < 5) return 'yellow';
    return 'green';
  }

  openModal() {
    this.openHistoryModal.emit();
  }
}