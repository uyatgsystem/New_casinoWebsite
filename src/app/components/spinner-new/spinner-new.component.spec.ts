import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpinnerNewComponent } from './spinner-new.component';

describe('SpinnerNewComponent', () => {
  let component: SpinnerNewComponent;
  let fixture: ComponentFixture<SpinnerNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpinnerNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpinnerNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
