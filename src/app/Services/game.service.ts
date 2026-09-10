import { EventEmitter, Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private gameData: any;
  
  getGames(): any[] {
    return this.games;
  }

  getDashboardInstantGames(): any[] {
    // Same image links used by the dashboard "Quick Win Casino" cards (games-landing.component.ts quickGames)
    return [
      {
        id: 1,
        name: 'Spin',
        image: 'https://spinhub-6rb.pages.dev/assets/Spin.png',
        redirectLink: '/dashboard/spinner',
      },
      {
        id: 2,
        name: 'Lottery',
        image: '/lottery.png',
        redirectLink: '/dashboard/lottery',
      },
      {
        id: 3,
        name: 'Scratch',
        image: 'https://spinhub-6rb.pages.dev/assets/scratch.png',
        redirectLink: '/dashboard/SectrechCards',
      },
      {
        id: 4,
        name: 'Treasure',
        image: 'https://spinhub-6rb.pages.dev/assets/Treasure.png',
        redirectLink: '/dashboard/TreasurePick',
      },
      {
        id: 5,
        name: 'Aviator',
        image: 'https://spinhub-6rb.pages.dev/assets/Aviator.png',
        redirectLink: '/dashboard/Avaitar',
      },
      {
        id: 6,
        name: 'Baccarat',
        image: 'https://spinhub-6rb.pages.dev/assets/baccarat.png',
        redirectLink: '/dashboard/Baccaret',
      },
    ];
  }

  getGameById(id: number): any | undefined {
    return this.games.find((game) => game.id === id);
  }

  games: any[] = [
    {
      id: 1,
      name: 'EGame',
      image: 'https://cmax-2.pages.dev/assets/game/Egame.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/Egame.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.egame99.club/',
      provider: 'Dragon Gaming',
      isHot: false,
      bgclr: '#fce147',
      color2: '#3333ff',
    },
    {
      id: 2,
      name: 'GameVault',
      image: 'https://cmax-2.pages.dev/assets/game/GameVault-game.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/GameVault-game-old.png',
      provider: 'Game Vault',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://download.gamevault999.com/',
      isHot: false,
      bgclr: '#00f2fe',
      color2: '#4facfe',
    },
    {
      id: 3,
      name: 'GoldenTreasure',
      image: 'https://cmax-2.pages.dev/assets/game/GoldenTreasure-game.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/GoldenTreasure-game-old.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.goldentreasure.mobi/',
      provider: 'Golden',
      isHot: false,
      bgclr: '#f1ff78',
      color2: '#ffcc00',
    },
    {
      id: 4,
      name: 'Juwa',
      image: 'https://cmax-2.pages.dev/assets/game/Juwa-game.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/Juwa-game-old.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://dl.juwa777.com/',
      provider: 'Juwa',
      isHot: false,
      bgclr: '#FFB200',
      color2: '#00c853',
    },
    {
      id: 5,
      name: 'UltraPanda',
      image: 'https://cmax-2.pages.dev/assets/game/UltraPanda-game.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/UltraPanda-game-old.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.ultrapanda.mobi/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#25f71e',
      color2: '#ffd200',
    },
    {
      id: 6,
      name: 'VBLink',
      image: 'https://cmax-2.pages.dev/assets/game/Vblink.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/VbLink-old2.jpg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.vblink777.club/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#968fec',
      color2: '#00d2ff',
    },
    {
      id: 7,
      name: 'Vegas',
      image: 'https://cmax-2.pages.dev/assets/game/Sweeps.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/Sweeps-old2.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://m.lasvegassweeps.com/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#eb5b7d',
      color2: '#ff4b2b',
    },
    {
      id: 8,
      name: 'GameRoom',
      image: 'https://cmax-2.pages.dev/assets/game/GamerRoom-game.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/GamerRoom-game-old.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.gameroom777.com/',
      provider: 'Game Vault',
      isHot: false,
      bgclr: '#00dbde',
      color2: '#fc00ff',
    },
    {
      id: 9,
      name: 'MilkyWay',
      image: 'https://cmax-2.pages.dev/assets/game/MilkyWays.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/MilkyWays-old2.jpg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://milkywayapp.xyz/',
      provider: 'Milky',
      isHot: false,
      bgclr: '#fd88ff',
      color2: '#ffd200',
    },
    {
      id: 10,
      name: 'FireKirin',
      image: 'https://cmax-2.pages.dev/assets/game/Fire.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/Fire-old2.webp',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://start.firekirin.xyz:8580/',
      provider: 'Fire Kirin',
      isHot: false,
      bgclr: '#9de0ff',
      color2: '#e100ff',
    },
    {
      id: 11,
      name: 'OrionStar',
      image: 'https://cmax-2.pages.dev/assets/game/OrionStars.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/OrionStars-old2.jpg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://start.orionstars.vip:8580/',
      provider: 'Orion',
      isHot: false,
      bgclr: '#e374ff',
      color2: '#afa16a',
    },
    {
      id: 12,
      name: 'Yolo',
      image: 'https://cmax-2.pages.dev/assets/game/yolo.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/yolo-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://yolo777.game/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#00f260',
      color2: '#0575e6',
    },
    {
      id: 13,
      name: 'CashMachine',
      image: 'https://cmax-2.pages.dev/assets/game/cash-machine-jackpots.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/cash-machine-jackpots-old.jpg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.cashmachine777.com/m',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#36d1dc',
      color2: '#5b86e5',
    },
    {
      id: 14,
      name: 'BlueDragon',
      image: 'https://cmax-2.pages.dev/assets/game/blue-dragon.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/blue-dragon-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://app.bluedragon777.com/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#c471f5',
      color2: '#fa71cd',
    },
    {
      id: 16,
      name: 'CashVault',
      image: 'https://cmax-2.pages.dev/assets/game/cash-vault.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/cash-vault-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://download.cashvault777.com',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#31CCD9',
      color2: '#EF7C5F',
    },
    {
      id: 17,
      name: 'MrAll',
      image: 'https://cmax-2.pages.dev/assets/game/mr-all.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/mr-all-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://www.mrallinone777.com',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#40e9ff',
      color2: '#5fe3fa',
    },
    {
      id: 18,
      name: 'CashFrenzy',
      image: 'https://cmax-2.pages.dev/assets/game/cash-frenzy.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/cash-frenzy-old.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://www.cashfrenzy777.com/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#E9ADCF',
      color2: '#4a00e0',
    },
    {
      id: 19,
      name: 'Mafia',
      image: 'https://cmax-2.pages.dev/assets/game/mafia.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/mafia-old.jpg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://www.mafia77777.com',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#b7ebfa',
      color2: '#1E1CB0',
    },
    {
      id: 20,
      name: 'VegasLuck',
      image: 'https://cmax-2.pages.dev/assets/game/vegas-luck.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/vegas-luck-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://start.vegasluck777.com',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#3bdaafff',
      color2: '#99f2c8',
    },
    {
      id: 22,
      name: 'WinStar',
      image: 'https://cmax-2.pages.dev/assets/game/win-star.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/win-star-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'http://www.winstar99999.com',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#FDD74E',
      color2: '#ff1e56',
    },
    {
      id: 23,
      name: 'AceClub',
      image: 'https://cmax-2.pages.dev/assets/game/ace-club.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/ace-club-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.ace777.club',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#07A3B2',
      color2: '#D9ECC7',
    },
    {
      id: 24,
      name: 'LuckyStar',
      image: 'https://cmax-2.pages.dev/assets/game/lucky-star.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/lucky-star-old.jpeg',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://www.luckystars.games/',
      provider: 'Master Gaming',
      isHot: false,
      bgclr: '#59dddd',
      color2: '#00ffe0',
    },
    {
      id: 10014,
      name: 'Juwa2',
      image: 'https://cmax-2.pages.dev/assets/game/juwa2.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/Juwa-game-old.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://m.juwa2.com/',
      provider: 'Juwa',
      isHot: false,
      bgclr: '#00dbde',
      color2: '#00c853',
    },
    {
      id: 10016,
      name: 'PandaMaster',
      image: 'https://cmax-2.pages.dev/assets/game/PandaMaster.png',
      coverImage: 'https://cmax-2.pages.dev/assets/game/PandaMaster.png',
      offer: 0,
      buttonText: 'Add Player',
      downloadLink: 'https://pandamaster.vip:8888/index.html',
      provider: 'PandaMaster',
      isHot: false,
      bgclr: '#00dbde',
      color2: '#00c853',
    },
  ];

  constructor() {}

  showChat: boolean = false;

  setGameData(data: any): void {
    this.gameData = data;
  }

  getGameData(): any {
    return this.gameData;
  }

  private triggerSubject = new EventEmitter<void>();

  triggerFunction() {
    this.triggerSubject.emit();
  }

  getTriggerObservable() {
    return this.triggerSubject.asObservable();
  }

  private triggerChatSubject = new EventEmitter<void>();

  triggerShowChatFunction() {
    this.triggerChatSubject.emit();
  }

  getTriggerShowChatObservable() {
    return this.triggerChatSubject.asObservable();
  }

  getCustomerID(): number {
    return Number(localStorage.getItem('customerId')?.length);
  }

  setArrayInLocalStorage(data: any[]) {
    localStorage.setItem('bis_data', JSON.stringify(data));
  }

  getArrayInLocalStorage(locale: string): any[] {
    return JSON.parse(localStorage.getItem(locale) || '[]');
  }

  private _balance!: number;

  get balance(): number {
    return this._balance;
  }

  set balance(value: number) {
    this._balance = value;
  }

  saveTotalBalance(totalBalance: number) {
    localStorage.setItem('totalBalance', totalBalance.toString());
  }

  getTotalBalance(): number {
    const totalBalance = localStorage.getItem('totalBalance');
    return totalBalance ? parseFloat(totalBalance) : 0;
  }
}