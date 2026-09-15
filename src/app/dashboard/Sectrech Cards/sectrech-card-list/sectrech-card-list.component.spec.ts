import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SectrechCardListComponent } from './sectrech-card-list.component';

describe('SectrechCardListComponent', () => {
  let component: SectrechCardListComponent;
  let fixture: ComponentFixture<SectrechCardListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SectrechCardListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SectrechCardListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
