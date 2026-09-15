import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { dashBoardGuard } from './dash-board.guard';

describe('dashBoardGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => dashBoardGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
