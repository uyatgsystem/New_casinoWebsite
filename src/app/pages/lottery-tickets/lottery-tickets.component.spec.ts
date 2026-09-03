import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotteryTicketsComponent } from './lottery-tickets.component';

describe('LotteryTicketsComponent', () => {
  let component: LotteryTicketsComponent;
  let fixture: ComponentFixture<LotteryTicketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotteryTicketsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LotteryTicketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
