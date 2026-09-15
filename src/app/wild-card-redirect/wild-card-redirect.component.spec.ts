import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WildCardRedirectComponent } from './wild-card-redirect.component';

describe('WildCardRedirectComponent', () => {
  let component: WildCardRedirectComponent;
  let fixture: ComponentFixture<WildCardRedirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WildCardRedirectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WildCardRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
