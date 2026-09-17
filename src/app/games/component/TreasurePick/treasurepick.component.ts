import { Component } from '@angular/core';
import { TreasureGameStatingComponent } from './treasure-game-stating/treasure-game-stating.component';
import { CommonModule } from '@angular/common';
import { GameNewComponent } from './game-new/game-new.component';
@Component({
  selector: 'app-treasurepick',
  imports: [CommonModule, GameNewComponent],
  templateUrl: './treasurepick.component.html',
  standalone: true,
  styleUrls: ['./treasurepick.component.scss']
})
export class TreasurepickComponent {
  showLoading = true;
  onLoadingComplete() {
    this.showLoading = false;
  }
}
