import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotteryMainComponent } from './lottery-main.component';

describe('LotteryMainComponent', () => {
  let component: LotteryMainComponent;
  let fixture: ComponentFixture<LotteryMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotteryMainComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LotteryMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
