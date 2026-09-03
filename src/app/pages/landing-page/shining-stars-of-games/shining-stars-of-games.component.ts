import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Star {
  id: number;
  name: string;
  location: string;
  score: number;
  avatar: string;
}

interface GameTab {
  id: string;
  name: string;
  active: boolean;
}
@Component({
  selector: 'app-shining-stars-of-games',
  imports: [CommonModule],
  templateUrl: './shining-stars-of-games.component.html',
  styleUrl: './shining-stars-of-games.component.scss'
})
export class ShiningStarsOfGamesComponent {

  gameTabs: GameTab[] = [
    { id: 'game1', name: 'Lottery', active: true },
    { id: 'game2', name: 'Scratch Cards', active: false },
    { id: 'game3', name: 'Spin', active: false },
    // { id: 'game4', name: 'Magic Dice', active: false },
  ];

  gameStarsMap: Record<string, Star[]> = {
    'game1': [
      { id: 1, name: 'Ayan M.', location: 'Dallas', score: 9800, avatar: 'client.png' },
      { id: 2, name: 'Hira L.', location: 'Boston', score: 8700, avatar: 'images.jpeg' },
      { id: 3, name: 'Rehan T.', location: 'Chicago', score: 9200, avatar: 'client.png' },
    ],
    'game2': [
      { id: 4, name: 'Zoya B.', location: 'New York', score: 10200, avatar: 'images.jpeg' },
      { id: 5, name: 'Ali R.', location: 'London', score: 8900, avatar: 'client.png' },
    ],
    'game3': [
      { id: 6, name: 'Hamza K.', location: 'Berlin', score: 9500, avatar: 'client.png' },
      { id: 7, name: 'Nimra Q.', location: 'Oslo', score: 9000, avatar: 'images.jpeg' },
    ],
    'game4': [
      { id: 8, name: 'Usman P.', location: 'Chicago', score: 9400, avatar: 'client.png' },
      { id: 9, name: 'Sara T.', location: 'Berlin', score: 9900, avatar: 'images.jpeg' },
      { id: 10, name: 'Bilal M.', location: 'Oslo', score: 9300, avatar: 'client.png' },
    ],
  };

  selectedStars: Star[] = this.gameStarsMap['game1'];

  selectTab(tabId: string): void {
    this.gameTabs.forEach(tab => tab.active = tab.id === tabId);
    this.selectedStars = this.gameStarsMap[tabId] || [];
  }
}
