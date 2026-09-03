import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../../services/game.service';

@Component({
  selector: 'app-chip-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chip-selector.component.html',
  styleUrls: ['./chip-selector.component.scss']
})
export class ChipSelectorComponent {
  gameService = inject(GameService);

  selectChip(value: number): void {
    this.gameService.selectChip(value);
  }
}
