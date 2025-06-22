import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { EmployeeContractService } from '../../../services/employee-contract.service';
import { EmployeeService, Employee } from '../../../services/employee.service';
import { EmployeeContract } from '../../../models/employee-contract.model';

@Component({
  selector: 'app-employee-contract-form',
  templateUrl: './employee-contract-form.component.html',
  styleUrls: ['./employee-contract-form.component.scss'],
})
export class EmployeeContractFormComponent implements OnInit, OnDestroy {
  contractForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  contractId: string | null = null;
  employees: Employee[] = [];
  private subscription?: Subscription;

  // Form options
  contractTypes = ['Full-time', 'Part-time', 'Temporary', 'Contract'];
  paymentFrequencies = ['Weekly', 'Bi-weekly', 'Monthly'];
  scheduleTypes = ['Fixed', 'Flexible'];
  statusTypes = ['Active', 'Expired', 'Terminated'];
  availableBenefits = [
    'Health Insurance',
    'Dental Coverage',
    'Vision Insurance',
    'Life Insurance',
    'Disability Insurance',
    'Paid Time Off',
    'Sick Leave',
    '401k Matching',
    'Retirement Plan',
    'Flexible Schedule',
    'Remote Work',
    'Professional Development',
    'Tuition Reimbursement',
    'Gym Membership',
    'Company Car',
    'Phone Allowance',
    'Meal Allowance',
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contractService: EmployeeContractService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.contractId;

    this.loadEmployees();

    if (this.isEditMode) {
      this.loadContract();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.contractForm = this.fb.group({
      employeeId: ['', Validators.required],
      contractType: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      salary: ['', [Validators.required, Validators.min(0)]],
      paymentFrequency: ['', Validators.required],
      benefits: this.fb.array([]),
      workingHours: this.fb.group({
        weeklyHours: [
          '',
          [Validators.required, Validators.min(1), Validators.max(168)],
        ],
        scheduleType: ['', Validators.required],
      }),
      leaveEntitlement: this.fb.group({
        annualLeave: ['', [Validators.required, Validators.min(0)]],
        sickLeave: ['', [Validators.required, Validators.min(0)]],
        paidHolidays: ['', [Validators.required, Validators.min(0)]],
      }),
      probationPeriod: this.fb.group({
        duration: [''],
        endDate: [''],
      }),
      terms: this.fb.array([]),
      status: ['Active', Validators.required],
    });
  }

  private loadEmployees(): void {
    this.subscription = this.employeeService.employees$.subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Error loading employees', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  private loadContract(): void {
    if (!this.contractId) return;

    this.isLoading = true;
    this.contractService.getContract(this.contractId).subscribe({
      next: (contract) => {
        this.populateForm(contract);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading contract:', error);
        this.snackBar.open('Error loading contract', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  private populateForm(contract: EmployeeContract): void {
    this.contractForm.patchValue({
      employeeId: contract.employeeId,
      contractType: contract.contractType,
      startDate: contract.startDate,
      endDate: contract.endDate,
      salary: contract.salary,
      paymentFrequency: contract.paymentFrequency,
      workingHours: contract.workingHours,
      leaveEntitlement: contract.leaveEntitlement,
      probationPeriod: contract.probationPeriod,
      status: contract.status,
    });

    // Populate benefits
    this.setBenefits(contract.benefits);

    // Populate terms
    this.setTerms(contract.terms);
  }

  private setBenefits(benefits: string[]): void {
    const benefitFormArray = this.contractForm.get('benefits') as FormArray;
    benefitFormArray.clear();
    benefits.forEach((benefit) => {
      benefitFormArray.push(this.fb.control(benefit));
    });
  }

  private setTerms(terms: string[]): void {
    const termsFormArray = this.contractForm.get('terms') as FormArray;
    termsFormArray.clear();
    terms.forEach((term) => {
      termsFormArray.push(this.fb.control(term, Validators.required));
    });
  }

  get benefitsFormArray(): FormArray {
    return this.contractForm.get('benefits') as FormArray;
  }

  get termsFormArray(): FormArray {
    return this.contractForm.get('terms') as FormArray;
  }

  addBenefit(benefit: string): void {
    if (benefit && !this.benefitsFormArray.value.includes(benefit)) {
      this.benefitsFormArray.push(this.fb.control(benefit));
    }
  }

  removeBenefit(index: number): void {
    this.benefitsFormArray.removeAt(index);
  }

  addTerm(): void {
    this.termsFormArray.push(this.fb.control('', Validators.required));
  }

  removeTerm(index: number): void {
    this.termsFormArray.removeAt(index);
  }

  onProbationDurationChange(): void {
    const duration = this.contractForm.get('probationPeriod.duration')?.value;
    const startDate = this.contractForm.get('startDate')?.value;

    if (duration && startDate) {
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + duration);
      this.contractForm.get('probationPeriod.endDate')?.setValue(endDate);
    }
  }

  onSubmit(): void {
    if (this.contractForm.valid) {
      this.isLoading = true;
      const formData = this.prepareFormData();

      if (this.isEditMode) {
        this.updateContract(formData);
      } else {
        this.createContract(formData);
      }
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  private prepareFormData(): any {
    const formValue = this.contractForm.value;

    // Clean up probation period
    if (!formValue.probationPeriod.duration) {
      formValue.probationPeriod = undefined;
    }

    // Ensure benefits is an array
    if (!Array.isArray(formValue.benefits)) {
      formValue.benefits = [];
    }

    // Ensure terms is an array and filter out empty ones
    if (Array.isArray(formValue.terms)) {
      formValue.terms = formValue.terms.filter((term: string) => term.trim());
    } else {
      formValue.terms = [];
    }

    return formValue;
  }

  private createContract(contractData: any): void {
    this.contractService.createContract(contractData).subscribe({
      next: (contract) => {
        this.snackBar.open('Contract created successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.router.navigate(['/employee-contracts']);
      },
      error: (error) => {
        console.error('Error creating contract:', error);
        this.snackBar.open('Error creating contract', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  private updateContract(contractData: any): void {
    if (!this.contractId) return;

    this.contractService
      .updateContract(this.contractId, contractData)
      .subscribe({
        next: (contract) => {
          this.snackBar.open('Contract updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.router.navigate(['/employee-contracts']);
        },
        error: (error) => {
          console.error('Error updating contract:', error);
          this.snackBar.open('Error updating contract', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.isLoading = false;
        },
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contractForm.controls).forEach((key) => {
      const control = this.contractForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/employee-contracts']);
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find((emp) => emp._id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : '';
  }

  getTermControl(index: number): FormControl {
    return this.termsFormArray.at(index) as FormControl;
  }
}
