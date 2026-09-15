import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotteryNumbersComponent } from './lottery-numbers.component';

describe('LotteryNumbersComponent', () => {
  let component: LotteryNumbersComponent;
  let fixture: ComponentFixture<LotteryNumbersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotteryNumbersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotteryNumbersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
