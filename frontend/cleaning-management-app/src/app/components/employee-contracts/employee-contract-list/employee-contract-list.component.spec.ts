import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContractListComponent } from './employee-contract-list.component';

describe('EmployeeContractListComponent', () => {
  let component: EmployeeContractListComponent;
  let fixture: ComponentFixture<EmployeeContractListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeContractListComponent]
    });
    fixture = TestBed.createComponent(EmployeeContractListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
