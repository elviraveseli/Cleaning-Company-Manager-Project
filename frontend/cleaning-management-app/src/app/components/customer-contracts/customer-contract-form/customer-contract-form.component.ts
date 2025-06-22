import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, forkJoin } from 'rxjs';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { CustomerContract } from '../../../models/customer-contract.model';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { ObjectService } from '../../../services/object.service';
import { ObjectLocation } from '../../../models/object.model';
import { ServiceType } from '../../../models/service-type.model';

@Component({
  selector: 'app-customer-contract-form',
  templateUrl: './customer-contract-form.component.html',
  styleUrls: ['./customer-contract-form.component.scss'],
})
export class CustomerContractFormComponent implements OnInit, OnDestroy {
  contractForm: FormGroup;
  isEditMode = false;
  contractId: string | null = null;
  isLoading = false;
  isSaving = false;
  private subscription?: Subscription;

  // Collapsible sections state
  expandedSections = {
    basic: true,
    customer: true,
    services: true,
    financial: true,
    preferences: false,
    additional: false,
  };

  contractTypes = ['One-time', 'Recurring', 'Long-term', 'Emergency'];
  billingFrequencies = [
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'Quarterly',
    'Annually',
  ];
  paymentTerms = ['Net 15', 'Net 30', 'Net 60', 'Due on Receipt'];
  serviceFrequencies = ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'As Needed'];
  statusTypes = ['Active', 'Expired', 'Terminated', 'Suspended', 'Pending'];

  daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

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

  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  customerFilterCtrl = new FormControl();

  // Object-related properties
  objects: ObjectLocation[] = [];
  customerObjects: ObjectLocation[] = [];
  selectedCustomer: Customer | null = null;

  serviceTypes: ServiceType[] = [
    { name: 'General House Cleaning', pricePerHour: 10 },
    { name: 'Deep Cleaning', pricePerHour: 15 },
    { name: 'Office Cleaning', pricePerHour: 12 },
    { name: 'Carpet Cleaning', pricePerHour: 14 },
    { name: 'Upholstery Cleaning', pricePerHour: 13 },
    { name: 'Window Cleaning', pricePerHour: 11 },
    { name: 'Move-In/Move-Out Cleaning', pricePerHour: 16 },
    { name: 'End of Tenancy Cleaning', pricePerHour: 17 },
    { name: 'After Builders Cleaning', pricePerHour: 18 },
    { name: 'Spring Cleaning', pricePerHour: 12 },
    { name: 'Regular Maintenance Cleaning', pricePerHour: 10 },
    { name: 'Post-Event Cleaning', pricePerHour: 15 },
    { name: 'Eco-Friendly Cleaning', pricePerHour: 13 },
  ];

  readonly VAT = 18;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contractService: CustomerContractService,
    private snackBar: MatSnackBar,
    private customerService: CustomerService,
    private objectService: ObjectService
  ) {
    this.contractForm = this.fb.group({
      // Contract Information
      contractNumber: ['', Validators.required],
      contractType: ['Recurring', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      status: ['Active', Validators.required],

      // Customer Information
      customerId: ['', Validators.required],
      customerName: ['', Validators.required],
      customerEmail: ['', [Validators.required, Validators.email]],
      customerPhone: ['', Validators.required],

      // Object Selection
      objectId: [''],

      customerAddress: this.fb.group({
        street: [''],
        city: [''],
        municipality: [''],
        country: ['Kosovo'],
      }),
      // Billing Address
      billingAddress: this.fb.group({
        sameAsService: [true],
        address: [''],
        city: [''],
        municipality: [''],
        country: ['Kosovo'],
      }),

      // Financial Information
      totalAmount: ['', [Validators.required, Validators.min(0)]],
      totalAmountWithVAT: [{ value: '', disabled: true }],
      vat: [{ value: this.VAT, disabled: true }],
      currency: ['EUR'],
      billingFrequency: ['Monthly', Validators.required],
      paymentTerms: ['Net 30', Validators.required],

      // Services (now includes working days and times)
      services: this.fb.array([]),

      // Service Preferences
      servicePreferences: this.fb.group({
        keyAccess: [false],
        petInstructions: [''],
        accessInstructions: [''],
        specialRequests: [''],
      }),

      // Additional Information
      specialRequirements: this.fb.array([]),
      terms: [''],
      notes: [''],
    });

    // Watch for changes to sameAsService to copy address if needed
    this.contractForm
      .get('billingAddress.sameAsService')
      ?.valueChanges.subscribe((same: boolean) => {
        if (same) {
          const addr = this.contractForm.get('customerAddress')?.value;
          this.contractForm.get('billingAddress')?.patchValue({
            address: addr.street,
            city: addr.city,
            municipality: addr.municipality,
            country: addr.country,
          });
        }
      });
  }

  ngOnInit(): void {
    this.contractId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.contractId;

    // Generate unique contract number if creating new contract
    if (!this.isEditMode) {
      this.generateUniqueContractNumber();
    }

    // Fetch customers and objects for dropdowns
    forkJoin({
      customers: this.customerService.getCustomers(),
      objects: this.objectService.getObjects(),
    }).subscribe({
      next: (data) => {
        this.customers = data.customers;
        this.filteredCustomers = data.customers;
        this.objects = data.objects;
      },
      error: (error) => {
        console.error('Error loading data:', error);
      },
    });

    this.customerFilterCtrl.valueChanges.subscribe((search) => {
      if (!search) {
        this.filteredCustomers = this.customers;
        return;
      }
      this.filteredCustomers = this.customers.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email}`
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });

    if (this.isEditMode && this.contractId) {
      this.loadContract();
    } else {
      this.initializeDefaultValues();
    }

    // Listen for changes to recalculate total amount
    this.contractForm.valueChanges.subscribe(() => {
      this.updateTotalAmount();
    });
  }

  private initializeDefaultValues(): void {
    // Add a default service with working days and times
    this.addService();

    if (this.services.length > 0) {
      // Add a default working day to the first service
      this.addWorkingDayToService(0);

      if (this.getServiceWorkingDays(0).length > 0) {
        // Set Monday as default
        this.getServiceWorkingDays(0).at(0).patchValue({ day: 'Monday' });

        // Add a default time slot
        this.addTimeSlotToService(0, 0);

        if (this.getServiceTimeSlots(0, 0).length > 0) {
          this.getServiceTimeSlots(0, 0).at(0).patchValue({
            from: '09:00',
            to: '12:00',
            duration: 3,
          });
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Services Management (now includes working days and times)
  get services(): FormArray {
    return this.contractForm.get('services') as FormArray;
  }

  addService(): void {
    const serviceGroup = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      frequency: ['Weekly', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      workingDaysAndTimes: this.fb.array([]), // Working days and times per service
    });
    this.services.push(serviceGroup);
  }

  removeService(index: number): void {
    this.services.removeAt(index);
  }

  // Working Days and Times Management (per service)
  getServiceWorkingDays(serviceIndex: number): FormArray {
    return this.services
      .at(serviceIndex)
      .get('workingDaysAndTimes') as FormArray;
  }

  addWorkingDayToService(serviceIndex: number): void {
    const workingDayGroup = this.fb.group({
      day: ['', Validators.required],
      timeSlots: this.fb.array([]),
    });
    this.getServiceWorkingDays(serviceIndex).push(workingDayGroup);
  }

  removeWorkingDayFromService(serviceIndex: number, dayIndex: number): void {
    this.getServiceWorkingDays(serviceIndex).removeAt(dayIndex);
  }

  getServiceTimeSlots(serviceIndex: number, dayIndex: number): FormArray {
    return this.getServiceWorkingDays(serviceIndex)
      .at(dayIndex)
      .get('timeSlots') as FormArray;
  }

  addTimeSlotToService(serviceIndex: number, dayIndex: number): void {
    const timeSlotGroup = this.fb.group({
      from: ['', Validators.required],
      to: ['', Validators.required],
      duration: [
        '',
        [Validators.required, Validators.min(0.5), Validators.max(12)],
      ],
    });
    this.getServiceTimeSlots(serviceIndex, dayIndex).push(timeSlotGroup);
  }

  removeTimeSlotFromService(
    serviceIndex: number,
    dayIndex: number,
    slotIndex: number
  ): void {
    this.getServiceTimeSlots(serviceIndex, dayIndex).removeAt(slotIndex);
  }

  // Special Requirements Management
  get specialRequirements(): FormArray {
    return this.contractForm.get('specialRequirements') as FormArray;
  }

  addSpecialRequirement(): void {
    this.specialRequirements.push(this.fb.control('', Validators.required));
  }

  removeSpecialRequirement(index: number): void {
    this.specialRequirements.removeAt(index);
  }

  private loadContract(): void {
    if (!this.contractId) return;

    this.isLoading = true;
    this.subscription = this.contractService
      .getContract(this.contractId)
      .subscribe({
        next: (contract) => {
          this.populateForm(contract);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading contract:', error);
          this.snackBar.open('Error loading contract details', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          this.isLoading = false;
          this.router.navigate(['/customer-contracts']);
        },
      });
  }

  private populateForm(contract: CustomerContract): void {
    // Set up customer objects if customer is selected
    const customerId = contract.customerId || contract.customer?._id;
    if (customerId) {
      this.selectedCustomer =
        this.customers.find((c) => c._id === customerId) || null;
      this.customerObjects = this.objects.filter(
        (obj) => obj.customerId === customerId
      );
    }

    this.contractForm.patchValue({
      contractNumber: contract.contractNumber,
      contractType: contract.contractType,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      customerId: customerId || '',
      objectId: contract.objectId || '',
      customerName: contract.customer?.name || '',
      customerEmail: contract.customer?.email || '',
      customerPhone: contract.customer?.phone || '',
      customerAddress: {
        street: contract.customer?.address?.street || '',
        city: contract.customer?.address?.city || '',
        municipality: contract.customer?.address?.municipality || '',
        country: contract.customer?.address?.country || 'Kosovo',
      },
      billingAddress: {
        sameAsService: contract.billingAddress?.sameAsService ?? true,
        address: contract.billingAddress?.address || '',
        city: contract.billingAddress?.city || '',
        municipality: contract.billingAddress?.municipality || '',
        country: contract.billingAddress?.country || 'Kosovo',
      },
      totalAmount: contract.totalAmount,
      currency: contract.currency || 'EUR',
      billingFrequency: contract.billingFrequency,
      paymentTerms: contract.paymentTerms,
      servicePreferences: contract.servicePreferences,
      terms: contract.terms,
      notes: contract.notes,
    });

    // Populate services with working days and times
    if (contract.services) {
      contract.services.forEach((service) => {
        const serviceGroup = this.fb.group({
          name: [service.name, Validators.required],
          description: [service.description],
          frequency: [service.frequency, Validators.required],
          price: [service.price, [Validators.required, Validators.min(0)]],
          workingDaysAndTimes: this.fb.array([]),
        });

        // Populate working days and times for this service
        if (service.workingDaysAndTimes) {
          service.workingDaysAndTimes.forEach((workingDay) => {
            const workingDayGroup = this.fb.group({
              day: [workingDay.day, Validators.required],
              timeSlots: this.fb.array([]),
            });

            if (workingDay.timeSlots) {
              workingDay.timeSlots.forEach((timeSlot) => {
                const timeSlotGroup = this.fb.group({
                  from: [timeSlot.from, Validators.required],
                  to: [timeSlot.to, Validators.required],
                  duration: [
                    timeSlot.duration,
                    [
                      Validators.required,
                      Validators.min(0.5),
                      Validators.max(12),
                    ],
                  ],
                });
                (workingDayGroup.get('timeSlots') as FormArray).push(
                  timeSlotGroup
                );
              });
            }

            (serviceGroup.get('workingDaysAndTimes') as FormArray).push(
              workingDayGroup
            );
          });
        }

        this.services.push(serviceGroup);
      });
    }

    // Populate special requirements
    if (contract.specialRequirements) {
      contract.specialRequirements.forEach((requirement) => {
        this.specialRequirements.push(
          this.fb.control(requirement, Validators.required)
        );
      });
    }
  }

  onSubmit(): void {
    if (this.contractForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSaving = true;
    const contractData = this.prepareContractData();

    const operation = this.isEditMode
      ? this.contractService.updateContract(this.contractId!, contractData)
      : this.contractService.createContract(contractData);

    this.subscription = operation.subscribe({
      next: (result) => {
        this.snackBar.open(
          `Contract ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
        this.router.navigate(['/customer-contracts']);
      },
      error: (error) => {
        console.error('Error saving contract:', error);
        this.snackBar.open(
          `Error ${this.isEditMode ? 'updating' : 'creating'} contract`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
        this.isSaving = false;
      },
    });
  }

  private prepareContractData(): any {
    const formValue = this.contractForm.value;

    return {
      contractNumber: formValue.contractNumber,
      contractType: formValue.contractType,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      status: formValue.status,
      customerId: formValue.customerId,
      objectId: formValue.objectId || null,
      customer: {
        name: formValue.customerName,
        email: formValue.customerEmail,
        phone: formValue.customerPhone,
        address: formValue.customerAddress,
      },
      billingAddress: formValue.billingAddress,
      totalAmount: formValue.totalAmount,
      currency: formValue.currency,
      billingFrequency: formValue.billingFrequency,
      paymentTerms: formValue.paymentTerms,
      services: formValue.services,
      servicePreferences: formValue.servicePreferences,
      specialRequirements: formValue.specialRequirements.filter((req: string) =>
        req.trim()
      ),
      terms: formValue.terms,
      notes: formValue.notes,
    };
  }

  private markFormGroupTouched(): void {
    Object.keys(this.contractForm.controls).forEach((key) => {
      const control = this.contractForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.contractId) {
      this.router.navigate(['/customer-contracts', this.contractId]);
    } else {
      this.router.navigate(['/customer-contracts']);
    }
  }

  getErrorMessage(controlName: string): string {
    const control = this.contractForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(controlName)} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['min']) {
        return `Value must be at least ${control.errors['min'].min}`;
      }
      if (control.errors['max']) {
        return `Value must be at most ${control.errors['max'].max}`;
      }
    }
    return '';
  }

  private getFieldLabel(controlName: string): string {
    const labels: { [key: string]: string } = {
      contractNumber: 'Contract Number',
      contractType: 'Contract Type',
      startDate: 'Start Date',
      customerName: 'Customer Name',
      customerEmail: 'Customer Email',
      customerPhone: 'Customer Phone',
      totalAmount: 'Total Amount',
      billingFrequency: 'Billing Frequency',
      paymentTerms: 'Payment Terms',
    };
    return labels[controlName] || controlName;
  }

  toggleSection(section: keyof typeof this.expandedSections): void {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  onCustomerSelected(customerId: string) {
    const customer = this.customers.find((c) => c._id === customerId);
    if (customer) {
      this.selectedCustomer = customer;
      this.contractForm.patchValue({
        customerName: customer.firstName + ' ' + customer.lastName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
      });

      // Filter objects for this customer
      this.customerObjects = this.objects.filter(
        (obj) => obj.customerId === customerId
      );

      // Clear object selection when customer changes
      this.contractForm.get('objectId')?.setValue('');
      this.contractForm.get('customerAddress')?.patchValue({
        street: '',
        city: '',
        municipality: '',
        country: 'Kosovo',
      });
    }
  }

  onObjectSelected(objectId: string) {
    const selectedObject = this.customerObjects.find(
      (obj) => obj._id === objectId
    );
    if (selectedObject) {
      // Prefill address fields from selected object
      this.contractForm.get('customerAddress')?.patchValue({
        street: selectedObject.address.street,
        city: selectedObject.address.city,
        municipality: selectedObject.address.municipality,
        country: selectedObject.address.country,
      });
    }
  }

  compareCustomers = (c1: any, c2: any) => c1 && c2 && c1 === c2;

  private generateContractNumber(): string {
    // Generate a random 7-digit number, padded with zeros if needed
    return Math.floor(1000000 + Math.random() * 9000000).toString();
  }

  private generateUniqueContractNumber(): void {
    this.contractService.getContracts().subscribe((contracts) => {
      const existingNumbers = contracts.map((c) => c.contractNumber);
      let newNumber = this.generateContractNumber();
      while (existingNumbers.includes(newNumber)) {
        newNumber = this.generateContractNumber();
      }
      this.contractForm.get('contractNumber')?.setValue(newNumber);
    });
  }

  onServiceTypeSelected(serviceIndex: number) {
    const selectedType = this.serviceTypes.find(
      (t) => t.name === this.services.at(serviceIndex).get('name')?.value
    );
    if (selectedType) {
      this.services
        .at(serviceIndex)
        .get('price')
        ?.setValue(selectedType.pricePerHour);
    }
    this.updateTotalAmount();
  }

  updateTotalAmount(): void {
    let total = 0;
    const billingFrequency = this.contractForm.get('billingFrequency')?.value;
    this.services.controls.forEach((service) => {
      const price = Number(service.get('price')?.value) || 0;
      const serviceFrequency = service.get('frequency')?.value;
      // Calculate total hours for this service
      let totalHours = 0;
      const workingDays = service.get('workingDaysAndTimes') as FormArray;
      workingDays.controls.forEach((day) => {
        const timeSlots = day.get('timeSlots') as FormArray;
        timeSlots.controls.forEach((slot) => {
          totalHours += Number(slot.get('duration')?.value) || 0;
        });
      });
      // Determine frequency multiplier based on billing frequency
      let billingFreqMultiplier = 1;
      switch (billingFrequency) {
        case 'Weekly':
          billingFreqMultiplier = 1;
          break;
        case 'Bi-weekly':
          billingFreqMultiplier = 2;
          break;
        case 'Monthly':
          billingFreqMultiplier = 4;
          break;
        case 'Quarterly':
          billingFreqMultiplier = 13;
          break;
        case 'Annually':
          billingFreqMultiplier = 52;
          break;
        default:
          billingFreqMultiplier = 1;
      }
      // Determine service frequency multiplier (per week)
      let serviceFreqPerWeek = 1;
      switch (serviceFrequency) {
        case 'Daily':
          serviceFreqPerWeek = 7;
          break;
        case 'Weekly':
          serviceFreqPerWeek = 1;
          break;
        case 'Bi-weekly':
          serviceFreqPerWeek = 0.5;
          break;
        case 'Monthly':
          serviceFreqPerWeek = 0.25;
          break;
        case 'As Needed':
          serviceFreqPerWeek = 1;
          break;
        default:
          serviceFreqPerWeek = 1;
      }
      // Calculate how many times the service is performed per billing cycle
      const serviceFreqMultiplier = serviceFreqPerWeek * billingFreqMultiplier;
      total += price * totalHours * serviceFreqMultiplier;
    });
    this.contractForm.get('totalAmount')?.setValue(total, { emitEvent: false });
    // Calculate total with VAT
    const totalWithVAT = total + (total * this.VAT) / 100;
    this.contractForm
      .get('totalAmountWithVAT')
      ?.setValue(totalWithVAT, { emitEvent: false });
  }
}
