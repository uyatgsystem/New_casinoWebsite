import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreasurepickComponent } from './treasurepick.component';

describe('TreasurepickComponent', () => {
  let component: TreasurepickComponent;
  let fixture: ComponentFixture<TreasurepickComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreasurepickComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreasurepickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
