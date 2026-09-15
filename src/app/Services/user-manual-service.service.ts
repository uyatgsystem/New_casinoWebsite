import { Injectable } from '@angular/core';
import {
  GuideStep,
  UserManualOptions,
  UserManualState,
} from '../Interfaces/interfaces';
import { BehaviorSubject, Observable } from 'rxjs';

const defaultOptions: UserManualOptions = {
  title: 'Quick Guide',
  closable: true,
  dismissOnBackdrop: true,
  showThumbnails: true,
};
@Injectable({
  providedIn: 'root',
})
export class UserManualService {
  // service code for user manual

  private readonly state$ = new BehaviorSubject<UserManualState>({
    open: false,
    steps: [],
    startIndex: 0,
    options: defaultOptions,
  });

  open(
    steps: GuideStep[],
    startIndex = 0,
    options?: Partial<UserManualOptions>
  ) {
    const merged: UserManualOptions = { ...defaultOptions, ...(options || {}) };
    this.state$.next({ open: true, steps, startIndex, options: merged });
  }

  close() {
    const v = this.state$.value;
    this.state$.next({ ...v, open: false });
  }

  stateChanges(): Observable<UserManualState> {
    return this.state$.asObservable();
  }
}
