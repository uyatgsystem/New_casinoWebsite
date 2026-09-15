import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStats } from '../models/card.model';

@Component({
  selector: 'app-score-board',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="score-board bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 shadow-2xl border-2 border-gray-700">
      <h3 class="text-xl font-bold text-white mb-4 text-center">Scoreboard</h3>
      
      <div class="grid grid-cols-3 gap-4 mb-4">
        <!-- Player Wins -->
        <div class="stat-card bg-blue-900 bg-opacity-50 rounded-lg p-4 text-center border-2 border-blue-600">
          <div class="text-blue-300 text-xs font-semibold mb-2">PLAYER</div>
          <div class="text-4xl font-bold text-white">{{stats.playerWins}}</div>
          <div class="mt-2 h-1 bg-blue-600 rounded"></div>
        </div>

        <!-- Ties -->
        <div class="stat-card bg-green-900 bg-opacity-50 rounded-lg p-4 text-center border-2 border-green-600">
          <div class="text-green-300 text-xs font-semibold mb-2">TIE</div>
          <div class="text-4xl font-bold text-white">{{stats.ties}}</div>
          <div class="mt-2 h-1 bg-green-600 rounded"></div>
        </div>

        <!-- Banker Wins -->
        <div class="stat-card bg-red-900 bg-opacity-50 rounded-lg p-4 text-center border-2 border-red-600">
          <div class="text-red-300 text-xs font-semibold mb-2">BANKER</div>
          <div class="text-4xl font-bold text-white">{{stats.bankerWins}}</div>
          <div class="mt-2 h-1 bg-red-600 rounded"></div>
        </div>
      </div>

      <!-- Total Games -->
      <div class="bg-black bg-opacity-30 rounded-lg p-3 text-center">
        <div class="text-gray-400 text-sm">Total Games</div>
        <div class="text-2xl font-bold text-white mt-1">{{getTotalGames()}}</div>
      </div>

      <!-- Win Percentages -->
      <div class="mt-4 space-y-2">
        <div class="flex justify-between items-center text-xs">
          <span class="text-blue-300">Player Win %</span>
          <span class="text-white font-bold">{{getPercentage('player')}}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div 
            class="bg-blue-500 h-2 rounded-full transition-all duration-500"
            [style.width.%]="getPercentage('player')"
          ></div>
        </div>

        <div class="flex justify-between items-center text-xs">
          <span class="text-green-300">Tie %</span>
          <span class="text-white font-bold">{{getPercentage('tie')}}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div 
            class="bg-green-500 h-2 rounded-full transition-all duration-500"
            [style.width.%]="getPercentage('tie')"
          ></div>
        </div>

        <div class="flex justify-between items-center text-xs">
          <span class="text-red-300">Banker Win %</span>
          <span class="text-white font-bold">{{getPercentage('banker')}}%</span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div 
            class="bg-red-500 h-2 rounded-full transition-all duration-500"
            [style.width.%]="getPercentage('banker')"
          ></div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
    }
  `]
})
export class ScoreBoardComponent {
  @Input() stats: GameStats = { playerWins: 0, bankerWins: 0, ties: 0 };

  getTotalGames(): number {
    return this.stats.playerWins + this.stats.bankerWins + this.stats.ties;
  }

  getPercentage(type: 'player' | 'banker' | 'tie'): number {
    const total = this.getTotalGames();
    if (total === 0) return 0;

    let wins = 0;
    switch (type) {
      case 'player':
        wins = this.stats.playerWins;
        break;
      case 'banker':
        wins = this.stats.bankerWins;
        break;
      case 'tie':
        wins = this.stats.ties;
        break;
    }

    return Math.floor((wins / total) * 100);
  }
}
