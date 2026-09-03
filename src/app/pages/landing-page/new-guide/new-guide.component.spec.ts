import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewGuideComponent } from './new-guide.component';

describe('NewGuideComponent', () => {
  let component: NewGuideComponent;
  let fixture: ComponentFixture<NewGuideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewGuideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewGuideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
