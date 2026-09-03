import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';

export interface PlaneState {
  planeX: number;
  planeY: number;
  movingState: number;
  multiplier: number;
  crashPoint: number;
  gameState: string; // "waiting" | "flying" | "crashed"
  countdown: number;
  verticalDots?: any[];   
  horizontalDots?: any[];  
}
@Injectable({ providedIn: 'root' })
export class SignalRService {
  private socket!: Socket;
  private planeStateSubject = new BehaviorSubject<PlaneState | null>(null);
  planeState$ = this.planeStateSubject.asObservable();

  connect() {
    this.socket = io('http://localhost:54608'); // Use http for local dev
    this.socket.on('PlaneState', (state: PlaneState) => {
      this.planeStateSubject.next(state);
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }
}