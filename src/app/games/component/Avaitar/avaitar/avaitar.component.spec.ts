import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvaitarComponent } from './avaitar.component';

describe('AvaitarComponent', () => {
  let component: AvaitarComponent;
  let fixture: ComponentFixture<AvaitarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvaitarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AvaitarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
