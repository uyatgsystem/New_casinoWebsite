import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignUpPopUpComponent } from './sign-up-pop-up.component';

describe('SignUpPopUpComponent', () => {
  let component: SignUpPopUpComponent;
  let fixture: ComponentFixture<SignUpPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignUpPopUpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignUpPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
