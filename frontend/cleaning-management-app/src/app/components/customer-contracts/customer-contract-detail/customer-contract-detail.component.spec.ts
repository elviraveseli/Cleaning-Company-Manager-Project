import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerContractDetailComponent } from './customer-contract-detail.component';

describe('CustomerContractDetailComponent', () => {
  let component: CustomerContractDetailComponent;
  let fixture: ComponentFixture<CustomerContractDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CustomerContractDetailComponent]
    });
    fixture = TestBed.createComponent(CustomerContractDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
