import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotteryCardsComponent } from './lottery-cards.component';

describe('LotteryCardsComponent', () => {
  let component: LotteryCardsComponent;
  let fixture: ComponentFixture<LotteryCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotteryCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotteryCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
