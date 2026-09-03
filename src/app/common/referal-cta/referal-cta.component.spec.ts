import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReferalCtaComponent } from './referal-cta.component';

describe('ReferalCtaComponent', () => {
  let component: ReferalCtaComponent;
  let fixture: ComponentFixture<ReferalCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReferalCtaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReferalCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
