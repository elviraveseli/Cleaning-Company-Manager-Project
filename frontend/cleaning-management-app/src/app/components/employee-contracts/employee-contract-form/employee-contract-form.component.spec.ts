import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContractFormComponent } from './employee-contract-form.component';

describe('EmployeeContractFormComponent', () => {
  let component: EmployeeContractFormComponent;
  let fixture: ComponentFixture<EmployeeContractFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeeContractFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeContractFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
}); 