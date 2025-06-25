import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectFormComponent } from './object-form.component';

describe('ObjectFormComponent', () => {
  let component: ObjectFormComponent;
  let fixture: ComponentFixture<ObjectFormComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ObjectFormComponent]
    });
    fixture = TestBed.createComponent(ObjectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 