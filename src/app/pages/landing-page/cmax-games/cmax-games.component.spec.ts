import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CmaxGamesComponent } from './cmax-games.component';

describe('CmaxGamesComponent', () => {
  let component: CmaxGamesComponent;
  let fixture: ComponentFixture<CmaxGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CmaxGamesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CmaxGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
