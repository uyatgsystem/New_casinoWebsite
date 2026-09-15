import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreasureGameStatingComponent } from './treasure-game-stating.component';

describe('TreasureGameStatingComponent', () => {
  let component: TreasureGameStatingComponent;
  let fixture: ComponentFixture<TreasureGameStatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreasureGameStatingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreasureGameStatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
