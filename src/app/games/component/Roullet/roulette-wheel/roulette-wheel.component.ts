import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WHEEL_ORDER, getNumberColor } from '../../Baccaret/models/wheel-number.model';

// Mapping of each number to its exact angle on the wheel
const NUMBER_ANGLES: { [key: number]: number } = {
  0: 49, 32: 58, 15: 67, 19: 77, 4: 87, 21: 96, 2: 106, 25: 116, 17: 125, 34: 135,
  6: 146, 27: 156, 13: 166, 36: 177, 11: 187, 30: 196, 8: 207, 23: 218, 10: 228,
  5: 238, 24: 248, 16: 258, 33: 268, 1: 278, 20: 288, 14: 298, 31: 307, 9: 316,
  22: 326, 18: 335, 29: 345, 7: 354, 28: 3, 12: 12, 35: 21, 3: 30, 26: 40
};

@Component({
  selector: 'app-roulette-wheel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './roulette-wheel.component.html',
  styleUrls: ['./roulette-wheel.component.scss']
})
export class RouletteWheelComponent implements OnInit, OnChanges {
  @Input() winningNumber: number | null = null;
  @Input() isSpinning: boolean = false;

  @Output() spinComplete = new EventEmitter<number | null>();

  rotation: number = 0;
  ballRotation: number = 0;
  wheelNumbers = WHEEL_ORDER;
  private currentRotation: number = 0;

  // Spin configuration (ms)
  spinDurationMs: number = 8000;
  // CSS transition timing string for wheel and ball (bound in template)
  get wheelTransitionStyle(): string {
    return `transform ${this.spinDurationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
  }
  get ballTransitionStyle(): string {
    return `transform ${this.spinDurationMs}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
  }

  ngOnInit(): void {
    if (this.winningNumber !== null && this.isSpinning) {
      this.startSpin(this.winningNumber);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isSpinning'] || changes['winningNumber']) {
      if (this.winningNumber !== null && this.isSpinning) {
        this.startSpin(this.winningNumber);
      }
    }
  }

  startSpin(targetNumber: number): void {
    // Determine the pocket angle using WHEEL_ORDER (robust mapping)
    const index = this.wheelNumbers.indexOf(targetNumber);
    const anglePerSlot = 360 / this.wheelNumbers.length;
    const pocketAngle = index >= 0 ? index * anglePerSlot : 0;

    // Number of full rotations for dramatic spin
    const fullRotations = 8;

    // Final rotation: full spins + pocket angle. Wheel spins anticlockwise
    // so we use a negative value. Align pocket to the top (0deg).
    const targetRotation = (fullRotations * 360) + pocketAngle;
    const wheelTarget = -targetRotation;

    // Ball will spin around and end fixed (we keep it at the top),
    // so set its final rotation to a multiple of 360 so it appears stopped.
    const ballSpinRotations = fullRotations * 360;

    // Set spin duration proportionally to fullRotations (ms)
    this.spinDurationMs = Math.max(3500, fullRotations * 900);

    // Reset to starting positions to ensure CSS transition triggers.
    this.rotation = 0;
    this.ballRotation = 0;

    // Apply rotation on next frame so CSS transitions animate.
    if (typeof window !== 'undefined' && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.rotation = wheelTarget;
        this.ballRotation = ballSpinRotations;
        this.currentRotation = wheelTarget;
      }));
    } else {
      setTimeout(() => {
        this.rotation = wheelTarget;
        this.ballRotation = ballSpinRotations;
        this.currentRotation = wheelTarget;
      }, 40);
    }

    // Notify when spin visually completes. Use timeout based on duration.
    const finishMs = this.spinDurationMs + 60;
    setTimeout(() => {
      // Normalize to the final landing number and emit
      this.spinComplete.emit(targetNumber);
    }, finishMs);
  }

  getNumberColor(num: number): string {
    return getNumberColor(num);
  }

  getNumberAngle(index: number): number {
    const anglePerSlot = 360 / WHEEL_ORDER.length;
    return index * anglePerSlot;
  }
}
