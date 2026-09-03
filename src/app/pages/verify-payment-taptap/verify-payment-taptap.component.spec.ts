import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyPaymentTaptapComponent } from './verify-payment-taptap.component';

describe('VerifyPaymentTaptapComponent', () => {
  let component: VerifyPaymentTaptapComponent;
  let fixture: ComponentFixture<VerifyPaymentTaptapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyPaymentTaptapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyPaymentTaptapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
