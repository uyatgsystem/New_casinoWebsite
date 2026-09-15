import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscribeNewslettergeComponent } from './subscribe-newsletterge.component';

describe('SubscribeNewslettergeComponent', () => {
  let component: SubscribeNewslettergeComponent;
  let fixture: ComponentFixture<SubscribeNewslettergeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscribeNewslettergeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubscribeNewslettergeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
