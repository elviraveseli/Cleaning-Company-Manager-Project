import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerContractListComponent } from './customer-contract-list.component';

describe('CustomerContractListComponent', () => {
  let component: CustomerContractListComponent;
  let fixture: ComponentFixture<CustomerContractListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerContractListComponent]
    });
    fixture = TestBed.createComponent(CustomerContractListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
