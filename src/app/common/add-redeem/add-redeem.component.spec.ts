import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRedeemComponent } from './add-redeem.component';

describe('AddRedeemComponent', () => {
  let component: AddRedeemComponent;
  let fixture: ComponentFixture<AddRedeemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRedeemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddRedeemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
