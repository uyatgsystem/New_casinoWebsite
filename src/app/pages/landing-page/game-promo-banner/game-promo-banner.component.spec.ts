import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamePromoBannerComponent } from './game-promo-banner.component';

describe('GamePromoBannerComponent', () => {
  let component: GamePromoBannerComponent;
  let fixture: ComponentFixture<GamePromoBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamePromoBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GamePromoBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
