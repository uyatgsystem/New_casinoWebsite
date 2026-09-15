export interface WheelNumber {
  number: number;
  color: 'red' | 'black' | 'green';
  angle: number; // Position angle on the wheel (0-360)
}

// European roulette wheel order (single zero)
export const WHEEL_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

// Red numbers in roulette
export const RED_NUMBERS: number[] = [
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
];

// Black numbers in roulette
export const BLACK_NUMBERS: number[] = [
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
];

export function getNumberColor(num: number): 'red' | 'black' | 'green' {
  if (num === 0) return 'green';
  if (RED_NUMBERS.includes(num)) return 'red';
  return 'black';
}

export function createWheelNumbers(): WheelNumber[] {
  const angleStep = 360 / WHEEL_ORDER.length;
  return WHEEL_ORDER.map((number, index) => ({
    number,
    color: getNumberColor(number),
    angle: index * angleStep
  }));
}
