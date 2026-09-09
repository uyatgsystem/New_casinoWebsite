
import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameHeaderComponent } from './game-header/game-header.component';
import { ControlPanelComponent, GameState } from './control-panel/control-panel.component';
import { GameStatusComponent } from './game-status/game-status.component';
import { GameGridComponent, Tile } from './game-grid/game-grid.component';
import { MinesApiService } from '../../services/mines-api.service';
import { ToastrService } from 'ngx-toastr';
import { ApiCallService } from '../../../Services/api-call-service.service';
import { ErrorhandlingService } from '../../../Services/error-handling.service';
import { UtilsService } from '../../../Services/utils.service';
import { SafeHtml } from '@angular/platform-browser';


@Component({
  selector: 'app-mines',
  imports: [CommonModule, FormsModule, GameHeaderComponent, ControlPanelComponent, GameStatusComponent, GameGridComponent],
  templateUrl: './mines.component.html',
  styleUrl: './mines.component.scss'
})
export class MinesComponent {
 title = 'Mines';
  readonly MAX_BET = 50;
  grainBackdrop: SafeHtml = '';
  
  // Game settings
  balance = 0;
  betAmount = 2.00;
  numberOfMines = 3;
  gridSize = 5;
  selectionLimit = 0;
  requestId: string = '';
  customerId: number = 0;
  constructor(private minesApiService: MinesApiService, private apiCallService: ApiCallService, private errorHandling: ErrorhandlingService, private location: Location, private toastr: ToastrService, private utilsService: UtilsService) {

    this.customerId = Number(localStorage.getItem('customerId'));
  }

  goBack() {
    try {
      if (window.history && window.history.length > 1) {
        this.location.back();
      } else {
        window.location.href = '/dashboard/home';
      }
    } catch (e) {
      window.location.href = '/dashboard/home';
    }
  }
    getRoundedBalance(): number {
    return Math.floor(this.balance);
  }
  
  // Game state
  gameState: GameState = {
    isPlaying: false,
    gameOver: false,
    won: false,
    revealedTiles: 0,
    currentMultiplier: 0,
    potentialPayout: 0
    ,picksMade: 0
    ,selectionLimit: 0
  };
  
  tiles: Tile[] = [];
  minePositions: number[] = [];
  
  // UI state
  soundEnabled = true;
  musicEnabled = true;
  
  // Grid size options
  gridSizes = [3, 5, 7, 9];
  mineOptions = [1, 2, 3, 5,10];
  
  ngOnInit() {
    this.grainBackdrop = this.utilsService.getGrainBackdrop();
    this.getWalletBalance();
    this.initializeGrid();
  }
    WalletPayload() {
    return {
      customerId: localStorage.getItem('customerId') || '',
      pageNumber: 1,
      pageSize: 10,
      searchText: '',
      startDate: '',
      endDate: '',
    };
  }
  getWalletBalance(): void {
        const payload = this.WalletPayload(); 
    this.apiCallService.PostCallWithToken(payload,'Wallet/GetWalletBalance').subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.balance = response.data.totalBalance;
        } else {
          this.errorHandling.handleResponseError(response);
        }
      },
      error: (error) => {
        this.apiCallService.handleError(error);
      }
    });
  }
  
  initializeGrid() {
    this.tiles = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        this.tiles.push({
          id: row * this.gridSize + col,
          revealed: false,
          isMine: false,
          row,
          col
        });
      }
    }
  }
  
  placeMines() {
    this.minePositions = [];
    const totalTiles = this.gridSize * this.gridSize;
    
    while (this.minePositions.length < this.numberOfMines) {
      const position = Math.floor(Math.random() * totalTiles);
      if (!this.minePositions.includes(position)) {
        this.minePositions.push(position);
        this.tiles[position].isMine = true;
      }
    }
  }
  
  calculateMultiplier(revealedTiles: number): number {
    if (revealedTiles === 0) return 0;
    
    const totalTiles = this.gridSize * this.gridSize;
    const safeTiles = totalTiles - this.numberOfMines;
    
    // Calculate multiplier based on revealed safe tiles
    const multiplier = Math.pow(totalTiles / (totalTiles - this.numberOfMines), revealedTiles);
    return Math.floor(multiplier * 100) / 100;
  }
  
  startGame() {
    // ensure bet is integer and valid
    this.betAmount = Math.floor(this.betAmount);
    if (this.betAmount < 1) {
      this.toastr.warning('Bet must be at least 1');
      return;
    }
    if (this.betAmount > this.MAX_BET) {
      this.toastr.warning(`Maximum bet is $${this.MAX_BET}`);
      this.betAmount = this.MAX_BET;
      return;
    }
    if (this.betAmount > this.balance) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      return;
    }
    
    // Call payment request API
    const payload = {
      customerId: this.customerId,
      source: 'MINES',
      amount: this.betAmount
    };
    
    this.minesApiService.createPaymentRequest(payload).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          // Save the request ID for later use
          this.requestId = response.data;
          
          this.gameState = {
            isPlaying: true,
            gameOver: false,
            won: false,
            revealedTiles: 0,
            currentMultiplier: 0,
            potentialPayout: this.betAmount
            ,picksMade: 0
            ,selectionLimit: this.selectionLimit || 0
          };
          
          this.initializeGrid();
          this.getWalletBalance();
          // Don't place mines on client side, let API determine the result
        } else {
          alert(response.errorMessage || 'Failed to start game');
        }
      },
      error: (error) => {
        console.error('Error starting game:', error);
        alert('Failed to start game. Please try again.');
      }
    });
  }
  
  revealTile(tile: Tile) {
    if (!this.gameState.isPlaying || tile.revealed || this.gameState.gameOver) {
      return;
    }
    // Enforce selection limit (if set)
    if (this.gameState.selectionLimit && (this.gameState.picksMade ?? 0) >= this.gameState.selectionLimit) {
      return;
    }

    // Call bet API to determine if it's a bomb or diamond
    if (!this.requestId) {
      this.toastr.warning('Request ID missing. Start a game first.', 'Missing Request ID');
      return;
    }
    const betPayload = {
      customerId: this.customerId,
      requestId: this.requestId,
      totalMines: this.numberOfMines,
      cubeSize: String(this.gridSize)
    };

    this.minesApiService.placeBet(betPayload).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          tile.revealed = true;
          this.gameState.picksMade = (this.gameState.picksMade ?? 0) + 1;
          
          if (response.data.type === 'BOMB') {
            // Hit a mine
            tile.isMine = true;
            this.gameState.gameOver = true;
            this.gameState.isPlaying = false;
            // Reveal all mines
            this.tiles.forEach(t => {
              if (t.isMine) t.revealed = true;
            });
          } else {
            // Safe tile (DIAMOND)
            tile.isMine = false;
            this.gameState.revealedTiles++;
            this.gameState.currentMultiplier = this.calculateMultiplier(this.gameState.revealedTiles);
            this.gameState.potentialPayout = this.betAmount * this.gameState.currentMultiplier;
            
            // Check if all safe tiles are revealed
            const totalSafeTiles = (this.gridSize * this.gridSize) - this.numberOfMines;
            if (this.gameState.revealedTiles === totalSafeTiles) {
              this.cashOut();
            }
          }
        } else {
          alert(response.errorMessage || 'Bet failed');
        }
      },
      error: (error) => {
        console.error('Error placing bet:', error);
        alert('Failed to place bet. Please try again.');
      }
    });
  }
  
  cashOut() {
    if (!this.gameState.isPlaying) return;

    // Call checkout API
    const payload = {
      customerId: this.customerId,
      requestId: this.requestId,
      source: 'MINES',
      amount: this.gameState.potentialPayout
    };
    
    this.minesApiService.checkout(payload).subscribe({
      next: (response) => {
        if (response.responseCode === 200) {
          this.gameState.isPlaying = false;
          this.gameState.won = true;
          this.getWalletBalance();
        } else {
          alert(response.errorMessage || 'Checkout failed');
        }
      },
      error: (error) => {
        console.error('Error cashing out:', error);
        alert('Failed to cash out. Please try again.');
      }
    });
  }
  
  resetGame() {
    this.gameState = {
      isPlaying: false,
      gameOver: false,
      won: false,
      revealedTiles: 0,
      currentMultiplier: 0,
      potentialPayout: 0
      ,picksMade: 0
      ,selectionLimit: 0
    };
    this.initializeGrid();
  }
  
  adjustBet(amount: number) {
    // enforce integer bet amounts (no decimals)
    const newBet = Math.floor(this.betAmount) + Math.floor(amount);
    const clamped = Math.max(1, Math.min(this.MAX_BET, Math.floor(newBet)));
    if (clamped > this.balance) {
      this.toastr.error('Insufficient balance!');
      this.errorHandling.showModalSubject.next(true);
      return;
    }
    this.betAmount = clamped;
  }
  
  setGridSize(size: number) {
    if (!this.gameState.isPlaying) {
      this.gridSize = Math.floor(size);
      // ensure grid size is integer; if current mines exceed allowed, prompt user to reselect
      const maxMines = this.gridSize * this.gridSize - 1;
      if (this.numberOfMines > maxMines) {
        this.toastr.warning(`Selected grid ${this.gridSize}x${this.gridSize} allows a maximum of ${maxMines} mines. Please re-select mine count.`, 'Invalid mine count');
      }
      this.initializeGrid();
    }
  }
  
  setMineCount(count: number) {
    if (!this.gameState.isPlaying) {
      // enforce integer and valid range based on grid size
      const intCount = Math.floor(count);
      const totalTiles = this.gridSize * this.gridSize;
      const maxMines = Math.max(1, totalTiles - 1);
      if (intCount < 1) {
        this.toastr.warning('Mines must be at least 1', 'Invalid mine count');
        return;
      }
      if (intCount > maxMines) {
        this.toastr.warning(`Too many mines for the current grid (${this.gridSize}x${this.gridSize}). Max is ${maxMines}. Please choose a lower value.`, 'Invalid mine count');
        return;
      }
      this.numberOfMines = intCount;
    }
  }

  setSelectionLimit(count: number) {
    if (!this.gameState.isPlaying) {
      // enforce integer selection limit
      const intCount = Math.floor(count);
      this.selectionLimit = intCount;
      this.gameState.selectionLimit = intCount;
    }
  }
  
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
  }
  
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
  }
  
  getMultiplierDisplay(): string[] {
    return [
      this.calculateMultiplier(1).toFixed(2) + 'x',
      this.calculateMultiplier(2).toFixed(2) + 'x',
      this.calculateMultiplier(3).toFixed(2) + 'x',
      this.calculateMultiplier(4).toFixed(2) + 'x',
      this.calculateMultiplier(5).toFixed(2) + 'x'
    ];
  }
}
