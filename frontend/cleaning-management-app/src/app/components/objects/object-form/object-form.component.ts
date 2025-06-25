import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ObjectService } from '../../../services/object.service';
import { CustomerService } from '../../../services/customer.service';
import { ObjectLocation } from '../../../models/object.model';
import { Customer } from '../../../models/customer.model';

@Component({
  selector: 'app-object-form',
  templateUrl: './object-form.component.html',
  styleUrls: ['./object-form.component.scss'],
})
export class ObjectFormComponent implements OnInit, OnDestroy {
  objectForm: FormGroup;
  isEditMode = false;
  objectId: string | null = null;
  loading = false;
  saving = false;
  error: string | null = null;

  // Customer data
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;

  // Form options
  objectTypes: string[] = [];
  statusTypes: string[] = [];
  cleaningFrequencies: string[] = [];
  specialRequirements: (
    | 'Eco-friendly Products'
    | '24/7 Access'
    | 'Security Clearance'
    | 'Special Equipment'
    | 'Hazardous Materials'
    | 'EU Standards Compliance'
  )[] = [];
  sizeUnits: string[] = [];

  // Kosovo-specific data (matching backend)
  kosovoMunicipalities: string[] = [
    'Pristina',
    'Mitrovica',
    'Peja',
    'Prizren',
    'Gjilan',
    'Ferizaj',
    'Gjakova',
    'Podujeva',
    'Suhareka',
    'Malisheva',
    'Vushtrri',
    'Drenas',
    'Rahovec',
    'Lipjan',
    'Kamenica',
    'Viti',
    'Obiliq',
    'Fushe Kosova',
    'Kllokot',
    'Novoberde',
    'Kacanik',
    'Hani i Elezit',
    'Mamusa',
    'Junik',
    'Decan',
    'Istog',
    'Klina',
    'Skenderaj',
    'Leposavic',
    'Zubin Potok',
    'Zvecan',
    'Mitrovica North',
    'Dragash',
    'Shtime',
    'Shterpce',
    'Ranillug',
    'Gracanica',
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private objectService: ObjectService,
    private customerService: CustomerService
  ) {
    this.objectTypes = this.objectService.objectTypes;
    this.statusTypes = this.objectService.statusTypes;
    this.cleaningFrequencies = this.objectService.cleaningFrequencies;
    this.specialRequirements = this.objectService.specialRequirements;
    this.sizeUnits = this.objectService.sizeUnits;

    this.objectForm = this.createForm();
  }

  ngOnInit(): void {
    this.checkMode();
    this.initializeSpecialRequirements();
    this.loadCustomers();
    if (this.isEditMode) {
      this.loadObject();
    }

    // Debug form validation
    this.objectForm.statusChanges.subscribe((status) => {
      console.log('Form status:', status);
      if (status === 'INVALID') {
        this.logFormErrors();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Customer Selection
      customerId: ['', Validators.required],

      // Basic Information
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(100),
        ],
      ],
      type: ['', Validators.required],
      status: ['Active', Validators.required],

      // Address Information
      address: this.fb.group({
        street: ['', [Validators.required, Validators.maxLength(200)]],
        city: ['', [Validators.required, Validators.maxLength(100)]],
        municipality: ['', [Validators.required, Validators.maxLength(50)]],
        country: ['Kosovo', [Validators.required, Validators.maxLength(50)]],
      }),

      // Contact Person
      contactPerson: this.fb.group({
        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(100),
          ],
        ],
        phone: [
          '',
          [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)],
        ],
        email: ['', [Validators.email, Validators.maxLength(100)]],
      }),

      // Size Information (nested object to match model)
      size: this.fb.group({
        area: ['', [Validators.min(1), Validators.max(1000000)]],
        unit: ['sqm'],
      }),

      // Building Details
      floors: [
        1,
        [Validators.required, Validators.min(1), Validators.max(200)],
      ],
      rooms: [
        1,
        [Validators.required, Validators.min(1), Validators.max(1000)],
      ],

      // Cleaning Information
      cleaningFrequency: ['', Validators.required],
      estimatedCleaningTime: [
        '',
        [Validators.required, Validators.min(0.5), Validators.max(24)],
      ],
      specialRequirements: this.fb.array([]),

      // Additional Information
      notes: ['', Validators.maxLength(1000)],
    });
  }

  private checkMode(): void {
    this.objectId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.objectId && this.objectId !== 'new';
  }

  private loadObject(): void {
    if (!this.objectId) return;

    this.loading = true;
    this.objectService
      .getObject(this.objectId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (object) => {
          this.populateForm(object);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading object:', error);
          this.error = 'Failed to load object details';
          this.loading = false;
        },
      });
  }

  private populateForm(object: ObjectLocation): void {
    // Set basic form values
    this.objectForm.patchValue({
      customerId: object.customerId,
      name: object.name,
      type: object.type,
      status: object.status,
      address: {
        street: object.address.street,
        city: object.address.city,
        municipality: object.address.municipality || '',
        country: object.address.country,
      },
      contactPerson: {
        name: object.contactPerson.name,
        phone: object.contactPerson.phone,
        email: object.contactPerson.email || '',
      },
      size: {
        area: object.size?.area || '',
        unit: object.size?.unit || 'sqm',
      },
      floors: object.floors,
      rooms: object.rooms,
      cleaningFrequency: object.cleaningFrequency,
      estimatedCleaningTime: object.estimatedCleaningTime,
      notes: object.notes || '',
    });

    // Set the selected customer
    this.selectedCustomer =
      this.customers.find((c) => c._id === object.customerId) || null;

    // Set special requirements
    this.setSpecialRequirements(object.specialRequirements || []);
  }

  // Special Requirements Management
  get specialRequirementsArray(): FormArray {
    return this.objectForm.get('specialRequirements') as FormArray;
  }

  private setSpecialRequirements(
    requirements: (
      | 'Eco-friendly Products'
      | '24/7 Access'
      | 'Security Clearance'
      | 'Special Equipment'
      | 'Hazardous Materials'
      | 'EU Standards Compliance'
    )[]
  ): void {
    const formArray = this.specialRequirementsArray;
    formArray.clear();

    this.specialRequirements.forEach((requirement) => {
      const isSelected = requirements.includes(requirement);
      formArray.push(this.fb.control(isSelected));
    });
  }

  getSelectedSpecialRequirements(): (
    | 'Eco-friendly Products'
    | '24/7 Access'
    | 'Security Clearance'
    | 'Special Equipment'
    | 'Hazardous Materials'
    | 'EU Standards Compliance'
  )[] {
    return this.specialRequirements.filter(
      (_, index) => this.specialRequirementsArray.at(index).value
    );
  }

  initializeSpecialRequirements(): void {
    const formArray = this.specialRequirementsArray;
    if (formArray.length === 0) {
      this.specialRequirements.forEach(() => {
        formArray.push(this.fb.control(false));
      });
    }
  }

  // Methods for Material Design checkboxes
  isRequirementSelected(requirement: string): boolean {
    const index = this.specialRequirements.indexOf(requirement as any);
    return index >= 0 ? this.specialRequirementsArray.at(index).value : false;
  }

  toggleRequirement(requirement: string): void {
    const index = this.specialRequirements.indexOf(requirement as any);
    if (index >= 0) {
      const control = this.specialRequirementsArray.at(index);
      control.setValue(!control.value);
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.objectForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.saving = true;
    this.error = null;

    const formData = this.prepareFormData();

    const operation = this.isEditMode
      ? this.objectService.updateObject(this.objectId!, formData)
      : this.objectService.createObject(formData);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (object) => {
        this.saving = false;
        this.router.navigate(['/objects']);
      },
      error: (error) => {
        console.error('Error saving object:', error);
        this.error = 'Failed to save object. Please try again.';
        this.saving = false;
      },
    });
  }

  private prepareFormData(): Omit<
    ObjectLocation,
    '_id' | 'createdAt' | 'updatedAt' | 'fullAddress'
  > {
    const formValue = this.objectForm.value;

    return {
      customerId: formValue.customerId,
      name: formValue.name.trim(),
      type: formValue.type,
      status: formValue.status,
      address: {
        street: formValue.address.street.trim(),
        city: formValue.address.city.trim(),
        municipality: formValue.address.municipality.trim(),
        country: formValue.address.country.trim(),
      },
      contactPerson: {
        name: formValue.contactPerson.name.trim(),
        phone: formValue.contactPerson.phone.trim(),
        email: formValue.contactPerson.email?.trim() || undefined,
      },
      size: formValue.size.area
        ? {
            area: Number(formValue.size.area),
            unit: formValue.size.unit,
          }
        : undefined,
      floors: Number(formValue.floors),
      rooms: Number(formValue.rooms),
      specialRequirements: this.getSelectedSpecialRequirements(),
      cleaningFrequency: formValue.cleaningFrequency,
      estimatedCleaningTime: Number(formValue.estimatedCleaningTime),
      notes: formValue.notes?.trim() || undefined,
      photos: [], // Initialize empty photos array
    };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.objectForm.controls).forEach((key) => {
      const control = this.objectForm.get(key);
      if (control) {
        control.markAsTouched();
        if (control instanceof FormGroup) {
          this.markFormGroupTouched();
        }
      }
    });
  }

  // Navigation
  goBack(): void {
    if (this.isEditMode && this.objectId) {
      this.router.navigate(['/objects', this.objectId]);
    } else {
      this.router.navigate(['/objects']);
    }
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.objectForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.objectForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      const errors = field.errors;

      if (errors['required'])
        return `${this.getFieldLabel(fieldName)} is required`;
      if (errors['minlength'])
        return `${this.getFieldLabel(fieldName)} must be at least ${
          errors['minlength'].requiredLength
        } characters`;
      if (errors['maxlength'])
        return `${this.getFieldLabel(fieldName)} must not exceed ${
          errors['maxlength'].requiredLength
        } characters`;
      if (errors['email']) return 'Please enter a valid email address';
      if (errors['pattern']) return 'Please enter a valid phone number';
      if (errors['min']) return `Value must be at least ${errors['min'].min}`;
      if (errors['max']) return `Value must not exceed ${errors['max'].max}`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Object name',
      type: 'Object type',
      status: 'Status',
      'address.street': 'Street address',
      'address.city': 'City',
      'address.municipality': 'Municipality',
      'address.country': 'Country',
      'contactPerson.name': 'Contact name',
      'contactPerson.phone': 'Phone number',
      'contactPerson.email': 'Email address',
      'size.area': 'Area',
      floors: 'Number of floors',
      rooms: 'Number of rooms',
      cleaningFrequency: 'Cleaning frequency',
      estimatedCleaningTime: 'Estimated cleaning time',
      notes: 'Notes',
    };
    return labels[fieldName] || fieldName;
  }

  // Utility methods
  get pageTitle(): string {
    return this.isEditMode ? 'Edit Object' : 'Create New Object';
  }

  get submitButtonText(): string {
    if (this.saving) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Object' : 'Create Object';
  }

  // Debug method to log form errors
  private logFormErrors(): void {
    console.log('Form validation errors:');
    Object.keys(this.objectForm.controls).forEach((key) => {
      const control = this.objectForm.get(key);
      if (control && control.invalid) {
        console.log(`${key}:`, control.errors);

        // Check nested form groups
        if (control instanceof FormGroup) {
          Object.keys(control.controls).forEach((nestedKey) => {
            const nestedControl = control.get(nestedKey);
            if (nestedControl && nestedControl.invalid) {
              console.log(`${key}.${nestedKey}:`, nestedControl.errors);
            }
          });
        }
      }
    });
  }

  private loadCustomers(): void {
    this.customerService
      .getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers.filter((c) => c.status === 'Active');
          console.log('✅ Active customers loaded:', this.customers.length);
        },
        error: (error) => {
          console.error('❌ Error loading customers:', error);
          this.error = 'Failed to load customers';
        },
      });
  }

  onCustomerChange(customerId: string): void {
    this.selectedCustomer =
      this.customers.find((c) => c._id === customerId) || null;

    if (this.selectedCustomer) {
      // Prefill contact person information
      const contactPersonGroup = this.objectForm.get('contactPerson');
      if (contactPersonGroup) {
        contactPersonGroup.patchValue({
          name:
            this.selectedCustomer.fullName ||
            `${this.selectedCustomer.firstName} ${this.selectedCustomer.lastName}`,
          phone: this.selectedCustomer.phone || '',
          email: this.selectedCustomer.email || '',
        });
      }

      console.log(
        '✅ Contact person prefilled for customer:',
        this.selectedCustomer.fullName
      );
    }
  }

  getCustomerDisplayName(customer: Customer): string {
    return customer.fullName || `${customer.firstName} ${customer.lastName}`;
  }
}
