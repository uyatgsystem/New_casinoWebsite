import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  signal,
} from '@angular/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilsService } from '../../Services/utils.service';
import { GuideStep, UserManualState } from '../../Interfaces/interfaces';
import { Subscription } from 'rxjs';
import {
  animate,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'app-user-manual',
  imports: [CommonModule],
  templateUrl: './user-manual.component.html',
  styleUrl: './user-manual.component.scss',
  animations: [
    // Cross-fade + slight slide based on direction
    trigger('crossSlide', [
      transition(
        '* => *',
        [
          // animate the new element coming in
          group([
            query(
              ':enter',
              [
                style({
                  opacity: 0,
                  transform: 'translateX({{enterX}}) scale(0.98)',
                }),
                animate(
                  '240ms cubic-bezier(.2,.8,.2,1)',
                  style({ opacity: 1, transform: 'translateX(0) scale(1)' })
                ),
              ],
              { optional: true }
            ),

            // animate the old element leaving
            query(
              ':leave',
              [
                style({ opacity: 1, transform: 'translateX(0) scale(1)' }),
                animate(
                  '200ms cubic-bezier(.4,0,1,1)',
                  style({
                    opacity: 0,
                    transform: 'translateX({{leaveX}}) scale(0.98)',
                  })
                ),
              ],
              { optional: true }
            ),
          ]),
        ],
        {
          // default params (overridden at runtime by direction)
          params: { enterX: '16px', leaveX: '-16px' },
        }
      ),
    ]),
  ],
})
export class UserManualComponent {
  private sub?: Subscription;

  // reactive state (Angular signals)
  open = signal(false);
  steps = signal<GuideStep[]>([]);
  currentIndex = signal(0);
  options = {
    title: 'Quick Guide',
    closable: true,
    dismissOnBackdrop: true,
    showThumbnails: true,
  };
  imageLoaded = true;

  constructor(private manual: UtilsService) {}

  ngOnInit(): void {
    this.sub = this.manual.stateChanges().subscribe((s: UserManualState) => {
      this.open.set(s.open);
      this.steps.set(s.steps || []);
      this.currentIndex.set(
        Math.min(Math.max(0, s.startIndex || 0), (s.steps?.length || 1) - 1)
      );
      this.options = s.options;
      this.imageLoaded = false;
      // focus the dialog when opened
      if (s.open)
        setTimeout(() => (document.activeElement as HTMLElement)?.blur(), 0);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  progress() {
    const total = this.steps().length || 1;
    return ((this.currentIndex() + 1) / total) * 100;
  }

  // next() {
  //   if (this.currentIndex() < this.steps().length - 1) {
  //     this.currentIndex.update((v) => v + 1);
  //     this.imageLoaded = false;
  //   }
  // }

  // prev() {
  //   if (this.currentIndex() > 0) {
  //     this.currentIndex.update((v) => v - 1);
  //     this.imageLoaded = false;
  //   }
  // }

  // goTo(i: number) {
  //   if (i >= 0 && i < this.steps().length) {
  //     this.currentIndex.set(i);
  //     this.imageLoaded = false;
  //   }
  // }

  close() {
    if (this.options.closable) this.manual.close();
  }

  onBackdrop(evt: MouseEvent) {
    if (!this.options.dismissOnBackdrop) return;
    const target = evt.target as HTMLElement;
    // if the click is outside the card area (the root wraps both), close
    if (
      target.classList.contains('inset-0') ||
      target.classList.contains('backdrop-blur-sm')
    ) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.open()) return;
    if (e.key === 'Escape' && this.options.closable) {
      e.preventDefault();
      this.close();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    }
  }
  direction: 'forward' | 'backward' = 'forward'; // used for anim params

  next() {
    if (this.currentIndex() < this.steps().length - 1) {
      this.direction = 'forward';
      this.currentIndex.update((v) => v + 1);
      this.imageLoaded = false;
    }
  }

  prev() {
    if (this.currentIndex() > 0) {
      this.direction = 'backward';
      this.currentIndex.update((v) => v - 1);
      this.imageLoaded = false;
    }
  }

  goTo(i: number) {
    if (i >= 0 && i < this.steps().length) {
      this.direction = i > this.currentIndex() ? 'forward' : 'backward';
      this.currentIndex.set(i);
      this.imageLoaded = false;
    }
  }

  get animParams() {
    return this.direction === 'forward'
      ? { enterX: '16px', leaveX: '-16px' } // slide in from right
      : { enterX: '-16px', leaveX: '16px' }; // slide in from left
  }
}
