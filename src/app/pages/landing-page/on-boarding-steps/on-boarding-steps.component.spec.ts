import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnBoardingStepsComponent } from './on-boarding-steps.component';

describe('OnBoardingStepsComponent', () => {
  let component: OnBoardingStepsComponent;
  let fixture: ComponentFixture<OnBoardingStepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnBoardingStepsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnBoardingStepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
