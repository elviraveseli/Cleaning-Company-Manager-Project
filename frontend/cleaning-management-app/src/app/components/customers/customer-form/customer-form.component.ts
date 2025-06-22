import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-customer-form',
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.scss'],
})
export class CustomerFormComponent implements OnInit, OnDestroy {
  customerForm: FormGroup;
  isEditMode = false;
  customerId: string | null = null;
  isLoading = false;
  isSaving = false;
  private subscription?: Subscription;

  customerTypes = [
    'Residential',
    'Individual Business',
    'General Partnership',
    'Limited Partnership',
    'Limited Liability Company',
    'Joint Stock Company',
  ];
  statusTypes = ['Active', 'Inactive', 'Pending'];
  contactMethods = ['Email', 'Phone', 'Text', 'WhatsApp'];

  paymentMethods = [
    'Bank Transfer',
    'Cash',
    'ProCredit Bank',
    'TEB Bank',
    'NLB Bank',
    'BKT Bank',
    'Raiffeisen Bank',
  ];
  billingCycles = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'];
  municipalities = [
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
  dayOptions = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private snackBar: MatSnackBar
  ) {
    this.customerForm = this.createForm();
  }

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.customerId;

    if (this.isEditMode && this.customerId) {
      this.loadCustomer();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Basic Information
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9-+()\\s]+$')]],
      company: [''],
      customerType: ['Residential', Validators.required],
      status: ['Active', Validators.required],
      preferredContactMethod: ['Email', Validators.required],

      // Address Information
      address: ['', Validators.required],
      city: ['', Validators.required],
      municipality: ['', Validators.required],

      // Emergency Contact (optional)
      emergencyContactName: [''],
      emergencyContactRelationship: [''],
      emergencyContactPhone: [''],

      // Billing Address (optional)
      hasSeparateBillingAddress: [false],
      billingAddress: [''],
      billingCity: [''],
      billingMunicipality: [''],

      // Payment Information (optional)
      paymentMethod: [''],
      billingCycle: [''],
      autoPayEnabled: [false],

      // Additional Information
      referralSource: [''],
      tags: [''],
      notes: [''],
    });
  }

  private loadCustomer(): void {
    if (!this.customerId) return;

    this.isLoading = true;
    this.subscription = this.customerService
      .getCustomer(this.customerId)
      .subscribe({
        next: (customer) => {
          this.populateForm(customer);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading customer:', error);
          this.snackBar.open('Error loading customer details', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.isLoading = false;
          this.router.navigate(['/customers']);
        },
      });
  }

  private populateForm(customer: Customer): void {
    this.customerForm.patchValue({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || '',
      customerType: customer.customerType,
      status: customer.status,
      preferredContactMethod: customer.preferredContactMethod,
      address: customer.address,
      city: customer.city,
      municipality: customer.municipality,
      emergencyContactName: customer.emergencyContact?.name || '',
      emergencyContactRelationship:
        customer.emergencyContact?.relationship || '',
      emergencyContactPhone: customer.emergencyContact?.phone || '',
      hasSeparateBillingAddress:
        !!customer.billingAddress && !customer.billingAddress.sameAsService,
      billingAddress: customer.billingAddress?.address || '',
      billingCity: customer.billingAddress?.city || '',
      billingMunicipality: customer.billingAddress?.municipality || '',
      paymentMethod: customer.paymentInfo?.preferredMethod || '',
      billingCycle: customer.paymentInfo?.billingCycle || '',
      autoPayEnabled: customer.paymentInfo?.autoPayEnabled || false,
      timePreference: customer.servicePreferences?.timePreference || '',
      dayPreference: customer.servicePreferences?.dayPreference || [],
      specialInstructions:
        customer.servicePreferences?.specialInstructions || '',
      keyAccess: customer.servicePreferences?.keyAccess || false,
      petInstructions: customer.servicePreferences?.petInstructions || '',
      referralSource: customer.referralSource || '',
      tags: customer.tags.join(', '),
      notes: customer.notes,
    });
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.isSaving = true;

      let operation: Observable<Customer>;

      if (this.isEditMode && this.customerId) {
        // For update, we can use Partial<Customer>
        const updateData = this.prepareUpdateData();
        operation = this.customerService.updateCustomer(
          this.customerId,
          updateData
        );
      } else {
        // For create, we need all required fields
        const createData = this.prepareCreateData();
        operation = this.customerService.createCustomer(createData);
      }

      operation.subscribe({
        next: (customer) => {
          const message = this.isEditMode
            ? 'Customer updated successfully'
            : 'Customer created successfully';
          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error saving customer:', error);
          const message = this.isEditMode
            ? 'Error updating customer'
            : 'Error creating customer';
          this.snackBar.open(message, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.isSaving = false;
        },
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open(
        'Please fill in all required fields correctly',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        }
      );
    }
  }

  private prepareCreateData(): Omit<Customer, '_id'> {
    const formValue = this.customerForm.value;
    const tags = formValue.tags
      ? formValue.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag)
      : [];

    const customerData: Omit<Customer, '_id'> = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      company: formValue.company || undefined,
      customerType: formValue.customerType,
      status: formValue.status,
      preferredContactMethod: formValue.preferredContactMethod,
      address: formValue.address,
      city: formValue.city,
      municipality: formValue.municipality,
      referralSource: formValue.referralSource || undefined,
      tags: tags,
      notes: formValue.notes || '',
      registrationDate: new Date(),
      totalContracts: 0,
      totalRevenue: 0,
    };

    // Emergency Contact
    if (formValue.emergencyContactName) {
      customerData.emergencyContact = {
        name: formValue.emergencyContactName,
        relationship: formValue.emergencyContactRelationship,
        phone: formValue.emergencyContactPhone,
      };
    }

    // Billing Address
    if (formValue.hasSeparateBillingAddress && formValue.billingAddress) {
      customerData.billingAddress = {
        address: formValue.billingAddress,
        city: formValue.billingCity,
        municipality: formValue.billingMunicipality,
        sameAsService: false,
      };
    }

    // Payment Information
    if (formValue.paymentMethod) {
      customerData.paymentInfo = {
        preferredMethod: formValue.paymentMethod,
        billingCycle: formValue.billingCycle,
        autoPayEnabled: formValue.autoPayEnabled,
      };
    }

    return customerData;
  }

  private prepareUpdateData(): Partial<Customer> {
    const formValue = this.customerForm.value;
    const tags = formValue.tags
      ? formValue.tags
          .split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag)
      : [];

    const customerData: Partial<Customer> = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      phone: formValue.phone,
      company: formValue.company || undefined,
      customerType: formValue.customerType,
      status: formValue.status,
      preferredContactMethod: formValue.preferredContactMethod,
      address: formValue.address,
      city: formValue.city,
      municipality: formValue.municipality,
      referralSource: formValue.referralSource || undefined,
      tags: tags,
      notes: formValue.notes || '',
    };

    // Emergency Contact
    if (formValue.emergencyContactName) {
      customerData.emergencyContact = {
        name: formValue.emergencyContactName,
        relationship: formValue.emergencyContactRelationship,
        phone: formValue.emergencyContactPhone,
      };
    }

    // Billing Address
    if (formValue.hasSeparateBillingAddress && formValue.billingAddress) {
      customerData.billingAddress = {
        address: formValue.billingAddress,
        city: formValue.billingCity,
        municipality: formValue.billingMunicipality,
        sameAsService: false,
      };
    }

    // Payment Information
    if (formValue.paymentMethod) {
      customerData.paymentInfo = {
        preferredMethod: formValue.paymentMethod,
        billingCycle: formValue.billingCycle,
        autoPayEnabled: formValue.autoPayEnabled,
      };
    }

    return customerData;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach((key) => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.customerId) {
      this.router.navigate(['/customers', this.customerId]);
    } else {
      this.router.navigate(['/customers']);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.customerForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(controlName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(controlName)} must be at least ${
          control.errors['minlength'].requiredLength
        } characters`;
      }
      if (control.errors['pattern']) {
        if (controlName === 'phone') {
          return 'Please enter a valid phone number';
        }
        if (controlName === 'zipCode' || controlName === 'billingZipCode') {
          return 'Please enter a valid ZIP code';
        }
      }
    }
    return '';
  }

  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      billingZipCode: 'Billing ZIP Code',
    };
    return labels[controlName] || controlName;
  }
}
