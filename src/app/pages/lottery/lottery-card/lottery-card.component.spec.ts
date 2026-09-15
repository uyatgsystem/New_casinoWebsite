import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotteryCardComponent } from './lottery-card.component';

describe('LotteryCardComponent', () => {
  let component: LotteryCardComponent;
  let fixture: ComponentFixture<LotteryCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotteryCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotteryCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
