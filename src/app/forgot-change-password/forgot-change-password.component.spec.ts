import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForgotChangePasswordComponent } from './forgot-change-password.component';

describe('ForgotChangePasswordComponent', () => {
  let component: ForgotChangePasswordComponent;
  let fixture: ComponentFixture<ForgotChangePasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotChangePasswordComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ForgotChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
