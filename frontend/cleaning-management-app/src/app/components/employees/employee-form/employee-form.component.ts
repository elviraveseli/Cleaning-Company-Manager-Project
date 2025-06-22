import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { EmployeeService } from '../../../services/employee.service';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

interface WorkingDay {
  day: string;
  from: string;
  to: string;
  duration: number;
}

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss'],
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode = false;
  isSubmitting = false;
  employeeId: string | null = null;
  skills: string[] = [];
  certifications: string[] = [];
  languages: string[] = [];
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  // Working days configuration
  availableDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  workingDays: WorkingDay[] = [];

  // Filtered options for autocomplete
  filteredSkills: Observable<string[]>;
  filteredCertifications: Observable<string[]>;
  filteredLanguages: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    public employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.employeeForm = this.createForm();

    // Initialize filtered options
    this.filteredSkills = this.employeeForm
      .get('skillInput')!
      .valueChanges.pipe(
        startWith(''),
        map((value) =>
          this._filter(value || '', this.employeeService.availableSkills)
        )
      );

    this.filteredCertifications = this.employeeForm
      .get('certificationInput')!
      .valueChanges.pipe(
        startWith(''),
        map((value) =>
          this._filter(value || '', this.employeeService.certifications)
        )
      );

    this.filteredLanguages = this.employeeForm
      .get('languageInput')!
      .valueChanges.pipe(
        startWith(''),
        map((value) =>
          this._filter(value || '', this.employeeService.languages)
        )
      );
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase();
    return options.filter(
      (option) =>
        option.toLowerCase().includes(filterValue) &&
        !this.skills.includes(option)
    );
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEditMode = true;
      this.loadEmployee();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      position: ['', [Validators.required]],
      status: ['Active', [Validators.required]],
      hourlyRate: [15, [Validators.required, Validators.min(0)]],
      hireDate: [new Date(), [Validators.required]],
      address: [''],
      city: [''],
      municipality: ['', [Validators.required]],
      nationality: ['Kosovo Citizen', [Validators.required]],
      personalNumber: [''],
      department: ['', [Validators.required]],
      employmentType: ['', [Validators.required]],
      availability: ['', [Validators.required]],
      skillInput: [''],
      certificationInput: [''],
      languageInput: [''],
      emergencyContact: this.fb.group({
        name: ['', [Validators.required]],
        relationship: ['', [Validators.required]],
        phone: ['', [Validators.required]],
      }),
      paymentInfo: this.fb.group({
        bankName: ['ProCredit Bank'],
        accountNumber: ['', [Validators.required]],
        iban: [''],
        accountType: ['Checking'],
      }),
      healthInsurance: this.fb.group({
        provider: ['Kosovo Health Insurance Fund'],
        policyNumber: [''],
        validUntil: [new Date(new Date().getFullYear() + 1, 11, 31)],
      }),
      notes: [''],
      workingDays: this.fb.array([]),
    });
  }

  // Working Days Management
  get workingDaysFormArray() {
    return this.employeeForm.get('workingDays') as FormArray;
  }

  addWorkingDay() {
    const workingDay = this.fb.group({
      day: ['', Validators.required],
      from: ['', Validators.required],
      to: ['', Validators.required],
      duration: [{ value: '', disabled: true }],
    });

    const fromControl = workingDay.get('from');
    const toControl = workingDay.get('to');

    if (fromControl && toControl) {
      fromControl.valueChanges.subscribe(() =>
        this.calculateDuration(workingDay)
      );
      toControl.valueChanges.subscribe(() =>
        this.calculateDuration(workingDay)
      );
    }

    const workingDays = this.employeeForm.get('workingDays');
    if (workingDays instanceof FormArray) {
      workingDays.push(workingDay);
    }
  }

  removeWorkingDay(index: number) {
    this.workingDaysFormArray.removeAt(index);
  }

  calculateDuration(workingDay: FormGroup) {
    const fromControl = workingDay.get('from');
    const toControl = workingDay.get('to');

    if (fromControl && toControl) {
      const from = fromControl.value;
      const to = toControl.value;

      if (from && to) {
        const fromTime = this.parseTime(from);
        const toTime = this.parseTime(to);

        let duration: number;
        if (toTime < fromTime) {
          // Handle overnight shift
          duration = 24 - fromTime + toTime;
        } else {
          duration = toTime - fromTime;
        }

        workingDay.patchValue(
          { duration: duration.toFixed(2) },
          { emitEvent: false }
        );
      }
    }
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  }

  getAvailableDays(currentIndex: number): string[] {
    const selectedDays = this.workingDaysFormArray.controls
      .map((control, index) =>
        index !== currentIndex ? control.get('day')?.value : null
      )
      .filter((day) => day !== null);

    return this.availableDays.filter((day) => !selectedDays.includes(day));
  }

  private loadEmployee(): void {
    if (this.employeeId) {
      this.employeeService.getEmployee(this.employeeId).subscribe({
        next: (employee) => {
          this.employeeForm.patchValue({
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            position: employee.position,
            status: employee.status,
            hourlyRate: employee.hourlyRate,
            hireDate: employee.hireDate,
            address: employee.address,
            city: employee.city,
            municipality: employee.municipality,
            nationality: employee.nationality,
            personalNumber: employee.personalNumber,
            department: employee.department,
            employmentType: employee.employmentType,
            availability: employee.availability,
            emergencyContact: employee.emergencyContact,
            paymentInfo: employee.paymentInfo,
            healthInsurance: employee.healthInsurance,
            notes: employee.notes,
          });
          this.skills = [...employee.skills];
          this.certifications = [...employee.certifications];
          this.languages = [...employee.languages];

          // Load working days
          if (employee.workingDays && Array.isArray(employee.workingDays)) {
            employee.workingDays.forEach((day) => {
              const workingDayGroup = this.fb.group({
                day: [day.day, Validators.required],
                from: [day.from, Validators.required],
                to: [day.to, Validators.required],
                duration: [{ value: day.duration, disabled: true }],
              });
              this.workingDaysFormArray.push(workingDayGroup);
            });
          }
        },
        error: (error) => {
          this.snackBar.open('Error loading employee data', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          console.error('Error loading employee:', error);
        },
      });
    }
  }

  // Skills handling
  addSkill(event: MatChipInputEvent | MatAutocompleteSelectedEvent): void {
    let value: string;

    if ('option' in event) {
      value = event.option.viewValue;
      this.employeeForm.get('skillInput')!.setValue('');
    } else {
      value = (event.value || '').trim();
      event.chipInput!.clear();
    }

    if (value && !this.skills.includes(value)) {
      this.skills.push(value);
    }
  }

  removeSkill(skill: string): void {
    const index = this.skills.indexOf(skill);
    if (index >= 0) {
      this.skills.splice(index, 1);
    }
  }

  // Certifications handling
  addCertification(
    event: MatChipInputEvent | MatAutocompleteSelectedEvent
  ): void {
    let value: string;

    if ('option' in event) {
      value = event.option.viewValue;
      this.employeeForm.get('certificationInput')!.setValue('');
    } else {
      value = (event.value || '').trim();
      event.chipInput!.clear();
    }

    if (value && !this.certifications.includes(value)) {
      this.certifications.push(value);
    }
  }

  removeCertification(cert: string): void {
    const index = this.certifications.indexOf(cert);
    if (index >= 0) {
      this.certifications.splice(index, 1);
    }
  }

  // Languages handling
  addLanguage(event: MatChipInputEvent | MatAutocompleteSelectedEvent): void {
    let value: string;

    if ('option' in event) {
      value = event.option.viewValue;
      this.employeeForm.get('languageInput')!.setValue('');
    } else {
      value = (event.value || '').trim();
      event.chipInput!.clear();
    }

    if (value && !this.languages.includes(value)) {
      this.languages.push(value);
    }
  }

  removeLanguage(lang: string): void {
    const index = this.languages.indexOf(lang);
    if (index >= 0) {
      this.languages.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.employeeForm.valid) {
      this.isSubmitting = true;
      const formValue = this.employeeForm.value;

      const employeeData: any = {
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        email: formValue.email,
        phone: formValue.phone,
        position: formValue.position,
        status: formValue.status,
        hourlyRate: formValue.hourlyRate,
        hireDate: formValue.hireDate,
        address: formValue.address,
        city: formValue.city,
        municipality: formValue.municipality,
        nationality: formValue.nationality || 'Kosovo Citizen',
        personalNumber: formValue.personalNumber,
        emergencyContact: formValue.emergencyContact,
        documents: [], // Default empty array
        skills: this.skills,
        certifications: this.certifications,
        languages: this.languages,
        department: formValue.department,
        employmentType: formValue.employmentType,
        availability: formValue.availability,
        workingDays: this.workingDaysFormArray.value,
        paymentInfo: {
          bankName: formValue.paymentInfo.bankName || 'ProCredit Bank',
          accountNumber: formValue.paymentInfo.accountNumber,
          iban: formValue.paymentInfo.iban,
          accountType: formValue.paymentInfo.accountType || 'Checking',
        },
        healthInsurance: {
          provider:
            formValue.healthInsurance.provider ||
            'Kosovo Health Insurance Fund',
          policyNumber: formValue.healthInsurance.policyNumber,
          validUntil: formValue.healthInsurance.validUntil,
        },
        notes: formValue.notes || '',
      };

      // Add work permit for non-Kosovo citizens
      if (employeeData.nationality !== 'Kosovo Citizen') {
        employeeData.workPermit = {
          type: 'A', // Default type
          number: '',
          issueDate: new Date(),
          expiryDate: new Date(new Date().getFullYear() + 1, 11, 31),
          issuingAuthority: 'Ministry of Internal Affairs - Kosovo',
        };
        employeeData.residencePermit = {
          type: 'Temporary',
          number: '',
          expiryDate: new Date(new Date().getFullYear() + 1, 11, 31),
        };
      }

      const operation = this.isEditMode
        ? this.employeeService.updateEmployee(this.employeeId!, employeeData)
        : this.employeeService.createEmployee(employeeData);

      operation.subscribe({
        next: () => {
          this.snackBar.open(
            `Employee successfully ${this.isEditMode ? 'updated' : 'created'}`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
          this.router.navigate(['/employees']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.snackBar.open(
            `Error ${this.isEditMode ? 'updating' : 'creating'} employee: ${
              error.error?.message || error.message
            }`,
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
          console.error('Error saving employee:', error);
        },
      });
    } else {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }
}
