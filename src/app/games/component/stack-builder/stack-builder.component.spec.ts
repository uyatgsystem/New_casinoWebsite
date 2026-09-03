import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackBuilderComponent } from './stack-builder.component';

describe('StackBuilderComponent', () => {
  let component: StackBuilderComponent;
  let fixture: ComponentFixture<StackBuilderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StackBuilderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StackBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
