import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeContractDetailComponent } from './employee-contract-detail.component';

describe('EmployeeContractDetailComponent', () => {
  let component: EmployeeContractDetailComponent;
  let fixture: ComponentFixture<EmployeeContractDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EmployeeContractDetailComponent]
    });
    fixture = TestBed.createComponent(EmployeeContractDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
