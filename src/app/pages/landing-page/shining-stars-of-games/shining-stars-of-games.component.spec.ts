import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiningStarsOfGamesComponent } from './shining-stars-of-games.component';

describe('ShiningStarsOfGamesComponent', () => {
  let component: ShiningStarsOfGamesComponent;
  let fixture: ComponentFixture<ShiningStarsOfGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShiningStarsOfGamesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiningStarsOfGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
