import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-rules',
  templateUrl: './rules.component.html',
  styleUrls: ['./rules.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class RulesComponent {
  @Output() closed = new EventEmitter<void>();
  close() {
    this.closed.emit();
  }
}