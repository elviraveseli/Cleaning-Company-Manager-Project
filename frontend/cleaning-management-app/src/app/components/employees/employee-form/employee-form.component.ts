import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, AbstractControl, ValidationErrors } from '@angular/forms';
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
  employeeForm!: FormGroup;
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
  filteredSkills!: Observable<string[]>;
  filteredCertifications!: Observable<string[]>;
  filteredLanguages!: Observable<string[]>;

  constructor(
    private fb: FormBuilder,
    public employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    // Form and observables will be initialized in ngOnInit
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
      address: ['', [Validators.required]],
      city: ['', [Validators.required]],
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
        bankName: ['ProCredit Bank', [Validators.required]],
        accountNumber: ['', [Validators.required]],
        iban: ['', [Validators.required]],
        accountType: ['Checking', [Validators.required]],
      }),
      healthInsurance: this.fb.group({
        provider: ['Kosovo Health Insurance Fund', [Validators.required]],
        policyNumber: ['', [Validators.required]],
        validUntil: [new Date(new Date().getFullYear() + 1, 11, 31), [Validators.required]],
      }),
      notes: [''],
      workingDays: this.fb.array([]),
    });
  }

  // Removed complex validation - keeping it simple

  // Working Days Management
  get workingDaysFormArray() {
    return this.employeeForm.get('workingDays') as FormArray;
  }

  addWorkingDay() {
    const workingDay = this.fb.group({
      day: ['', Validators.required],
      from: ['', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      to: ['', [Validators.required, Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      duration: [0]
    });

    this.workingDaysFormArray.push(workingDay);
  }

  removeWorkingDay(index: number) {
    this.workingDaysFormArray.removeAt(index);
  }

  calculateDuration(workingDay: AbstractControl) {
    if (!workingDay || !(workingDay instanceof FormGroup)) return;

    const fromValue = workingDay.get('from')?.value;
    const toValue = workingDay.get('to')?.value;

    if (!fromValue || !toValue) {
      workingDay.patchValue({ duration: 0 }, { emitEvent: false });
      return;
    }

    // Parse the time values
    const fromParts = fromValue.split(':');
    const toParts = toValue.split(':');

    if (fromParts.length !== 2 || toParts.length !== 2) {
      workingDay.patchValue({ duration: 0 }, { emitEvent: false });
      return;
    }

    const fromHours = parseInt(fromParts[0], 10);
    const fromMinutes = parseInt(fromParts[1], 10);
    const toHours = parseInt(toParts[0], 10);
    const toMinutes = parseInt(toParts[1], 10);

    if (
      isNaN(fromHours) || isNaN(fromMinutes) || 
      isNaN(toHours) || isNaN(toMinutes) ||
      fromHours < 0 || fromHours > 23 || 
      toHours < 0 || toHours > 23 ||
      fromMinutes < 0 || fromMinutes > 59 ||
      toMinutes < 0 || toMinutes > 59
    ) {
      workingDay.patchValue({ duration: 0 }, { emitEvent: false });
      return;
    }

    // Convert to minutes since midnight
    const fromTotalMinutes = (fromHours * 60) + fromMinutes;
    const toTotalMinutes = (toHours * 60) + toMinutes;

    // Calculate duration
    let durationMinutes;
    if (toTotalMinutes < fromTotalMinutes) {
      // Overnight shift
      durationMinutes = (24 * 60) - fromTotalMinutes + toTotalMinutes;
    } else {
      durationMinutes = toTotalMinutes - fromTotalMinutes;
    }

    // Convert to hours
    const duration = Math.round(durationMinutes / 60);
    workingDay.patchValue({ duration }, { emitEvent: false });
  }

  // Helper to format time for display
  formatTime(value: string): string {
    if (!value) return '';
    const parts = value.split(':');
    if (parts.length !== 2) return value;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (isNaN(hours) || isNaN(minutes)) return value;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
                duration: [{ value: '', disabled: true }]
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

    if ('chipInput' in event) {
      value = (event.value || '').trim();
      // Clear the input value
      event.chipInput!.clear();
    } else {
      value = event.option.value;
      this.employeeForm.get('skillInput')!.setValue('');
    }

    // Only add the skill if it's in the predefined list
    if (value && this.employeeService.availableSkills.includes(value)) {
      if (!this.skills.includes(value)) {
      this.skills.push(value);
      }
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
    console.log('🚀 Form submission started');
    console.log('📋 Form valid:', this.employeeForm.valid);
    console.log('📝 Form value:', this.employeeForm.value);
    
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
        address: formValue.address || 'N/A',
        city: formValue.city || 'N/A',
        municipality: formValue.municipality,
        nationality: formValue.nationality || 'Kosovo Citizen',
        personalNumber: formValue.personalNumber || (
          (formValue.nationality || 'Kosovo Citizen') === 'Kosovo Citizen' 
            ? '1234567890' // Default 10-digit number for Kosovo citizens
            : ''
        ),
        emergencyContact: {
          name: formValue.emergencyContact.name,
          relationship: formValue.emergencyContact.relationship,
          phone: formValue.emergencyContact.phone,
        },
        documents: [], // Default empty array
        skills: this.skills || [],
        certifications: this.certifications || [],
        languages: this.languages || [],
        department: formValue.department,
        employmentType: formValue.employmentType,
        availability: formValue.availability,
        workingDays: this.workingDaysFormArray.value || [],
        paymentInfo: {
          bankName: formValue.paymentInfo.bankName || 'ProCredit Bank',
          accountNumber: formValue.paymentInfo.accountNumber,
          iban: formValue.paymentInfo.iban || 'XK21 1234 5678 9012 3456',
          accountType: formValue.paymentInfo.accountType || 'Checking',
        },
        healthInsurance: {
          provider:
            formValue.healthInsurance.provider ||
            'Kosovo Health Insurance Fund',
          policyNumber: formValue.healthInsurance.policyNumber || 'DEFAULT001',
          validUntil: formValue.healthInsurance.validUntil || new Date(new Date().getFullYear() + 1, 11, 31),
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

      console.log('📤 Final employee data being sent:', employeeData);

      const operation = this.isEditMode
        ? this.employeeService.updateEmployee(this.employeeId!, employeeData)
        : this.employeeService.createEmployee(employeeData);

      operation.subscribe({
        next: (response) => {
          console.log('✅ Employee save successful:', response);
          this.isSubmitting = false;
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
          console.error('❌ Error saving employee:', error);
          console.error('🔍 Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
          
          let errorMessage = `Error ${this.isEditMode ? 'updating' : 'creating'} employee`;
          
          // Handle specific error types
          if (error.error?.code === 11000) {
            if (error.error.keyValue?.email) {
              errorMessage = `Email "${error.error.keyValue.email}" is already in use. Please use a different email address.`;
            } else {
              errorMessage = 'Duplicate data detected. Please check your input.';
            }
          } else if (error.error?.message?.includes('Personal number')) {
            errorMessage = 'Personal number must be exactly 10 digits for Kosovo citizens.';
          } else if (error.error?.message?.includes('validation failed')) {
            errorMessage = 'Please check all required fields and try again.';
          } else {
            errorMessage += `: ${error.error?.message || error.message}`;
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 7000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
    } else {
      console.log('❌ Form is invalid');
      console.log('🔍 Form errors:', this.getFormErrors());
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  // Helper method to get form errors for debugging
  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.employeeForm.controls).forEach(key => {
      const control = this.employeeForm.get(key);
      if (control && !control.valid) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }
}
