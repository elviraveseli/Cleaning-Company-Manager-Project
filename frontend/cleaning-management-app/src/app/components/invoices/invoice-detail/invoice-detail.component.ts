import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../../services/invoice.service';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { CustomerService } from '../../../services/customer.service';
import { ScheduleService, ScheduleResponse } from '../../../services/schedule.service';
import { ObjectService } from '../../../services/object.service';
import {
  Invoice,
  InvoiceService as InvoiceServiceType,
  InvoiceStatus,
  PaymentMethod,
  CustomerInfo,
} from '../../../models/invoice.model';
import { ActivatedRoute, Router } from '@angular/router';
import { ServiceType } from '../../../models/service-type.model';

@Component({
  selector: 'app-invoice-detail',
  templateUrl: './invoice-detail.component.html',
  styleUrls: ['./invoice-detail.component.scss'],
})
export class InvoiceDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  invoiceForm!: FormGroup;
  isEdit = false;
  isFromContract = false;
  loading = false;

  // Related data from other modules
  customers: any[] = [];
  contracts: any[] = [];
  schedules: any[] = [];
  objects: any[] = [];
  filteredContracts: any[] = [];
  selectedCustomer: any = null;
  selectedContract: any = null;

  // Object-related properties
  customerObjects: any[] = [];
  selectedObject: any = null;

  // Form options
  statusOptions: InvoiceStatus[] = [
    'Draft',
    'Sent',
    'Paid',
    'Overdue',
    'Cancelled',
    'Partially Paid',
  ];
  paymentMethodOptions: PaymentMethod[] = [
    'Cash',
    'ProCredit Bank',
    'TEB Bank',
    'NLB Bank',
    'BKT Bank',
    'Raiffeisen Bank',
    'Bank Transfer',
    'Online Payment',
  ];

  // Calculated totals
  subtotal = 0;
  taxAmount = 0;
  totalAmount = 0;

  // New properties for the component
  invoiceId: string | null = null;

  municipalities: string[] = [
    'Prishtinë',
    'Gjakovë',
    'Pejë',
    'Mitrovicë',
    'Ferizaj',
    'Gjilan',
    'Prizren',
    'Vushtrri',
    'Podujevë',
    'Fushë Kosovë',
    'Suharekë',
    'Rahovec',
    'Malishevë',
    'Drenas',
    'Lipjan',
    'Kaçanik',
    'Kamenicë',
    'Viti',
    'Dragash',
    'Istog',
    'Klinë',
    'Deçan',
    'Junik',
    'Shtime',
    'Shtërpcë',
    'Obiliq',
    'Skenderaj',
    'Leposaviq',
    'Zubin Potok',
    'Zvečan',
    'Graçanicë',
    'Ranillug',
    'Kllokot',
    'Parteš',
    'Novobërdë',
    'Mamushë',
    'Hani i Elezit',
  ];

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

  constructor(
    private fb: FormBuilder,
    private invoiceService: InvoiceService,
    private contractService: CustomerContractService,
    private customerService: CustomerService,
    private scheduleService: ScheduleService,
    private objectService: ObjectService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Remove dialog data logic
  }

  ngOnInit() {
    this.initializeForm();
    this.loadRelatedData();
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEdit = true;
        this.loadInvoice(id);
      } else {
        this.isEdit = false;
        const nav = this.router.getCurrentNavigation();
        const contract = nav?.extras?.state?.['contract'];
        if (contract) {
          this.populateFromContract(contract);
        }
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm() {
    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() + 30); // Default 30 days from today

    this.invoiceForm = this.fb.group({
      invoiceNumber: ['', Validators.required],
      customer: this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        phone: [''],
        address: this.fb.group({
          street: [''],
          city: [''],
          municipality: [''],
          country: ['Kosovo'],
        }),
      }),
      objectId: [''],
      customerContract: [''],
      issueDate: [today, Validators.required],
      dueDate: [dueDate, Validators.required],
      services: this.fb.array([]),
      taxRate: [18, [Validators.min(0), Validators.max(100)]],
      discount: [0, Validators.min(0)],
      status: ['Draft', Validators.required],
      paymentMethod: [''],
      paymentDate: [null],
      notes: [''],
      terms: ['Net 30 days'],
    });

    // Add initial service line item
    this.addService();

    // Subscribe to form value changes to recalculate totals
    this.invoiceForm.get('taxRate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotals());

    this.invoiceForm.get('discount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateTotals());

    // Generate invoice number for new invoices
    if (!this.isEdit) {
      this.generateInvoiceNumber();
    }
  }

  loadRelatedData() {
    this.loading = true;
    let loadedCount = 0;
    const totalToLoad = 4; // customers, contracts, schedules, objects

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === totalToLoad) {
        this.loading = false;
        if (!this.isEdit) {
          this.generateInvoiceNumber();
        }
      }
    };

    // Load customers
    this.customerService
      .getCustomers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customers = customers;
          console.log('Loaded customers:', customers);
          console.log('Total customers loaded:', customers.length);
          // Log structure of first customer for debugging
          if (customers.length > 0) {
            console.log('Sample customer structure:', customers[0]);
          }
          checkAllLoaded();
        },
        error: (error) => {
          console.error('Error loading customers:', error);
          checkAllLoaded();
        },
      });

    // Load contracts
    this.contractService
      .getCustomerContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts = contracts;
          this.filteredContracts = contracts;
          console.log('Loaded contracts:', contracts);
          console.log('Total contracts loaded:', contracts.length);
          checkAllLoaded();
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          checkAllLoaded();
        },
      });

    // Load schedules with pagination
    this.scheduleService
      .getSchedules()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: ScheduleResponse) => {
          this.schedules = response.schedules;
          console.log('Loaded schedules:', this.schedules);
          console.log('Total schedules:', response.totalSchedules);
          checkAllLoaded();
        },
        error: (error) => {
          console.error('Error loading schedules:', error);
          this.schedules = [];
          checkAllLoaded();
        },
      });

    // Load objects
    this.objectService
      .getObjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (objects) => {
          this.objects = objects;
          console.log('Loaded objects:', objects);
          checkAllLoaded();
        },
        error: (error) => {
          console.error('Error loading objects:', error);
          this.objects = [];
          checkAllLoaded();
        },
      });
  }

  populateFormFromInvoice(invoice: any) {
    // Set up customer and objects if available
    if (invoice.customer?.customerId) {
      this.selectedCustomer = this.customers.find(
        (c) => c._id === invoice.customer.customerId
      );
      if (this.selectedCustomer) {
        this.customerObjects = this.objects.filter(
          (obj) => obj.customerId === this.selectedCustomer._id
        );
      }
    }

    // Set up selected object if available
    if (invoice.objectId) {
      this.selectedObject = this.customerObjects.find(
        (obj) => obj._id === invoice.objectId
      );
    }

    this.invoiceForm.patchValue({
      invoiceNumber: invoice.invoiceNumber,
      objectId: invoice.objectId || '',
      customer: {
        name:
          invoice.customer?.fullName ||
          invoice.customer?.name ||
          `${invoice.customer?.firstName} ${invoice.customer?.lastName}` ||
          'Unknown Customer',
        email: invoice.customer?.email,
        phone: invoice.customer?.phone || '',
        address: invoice.customer?.address || {},
      },
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      taxRate: invoice.taxRate || 0,
      discount: invoice.discount || 0,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod || '',
      paymentDate: invoice.paymentDate ? new Date(invoice.paymentDate) : '',
      notes: invoice.notes || '',
      terms: invoice.terms || 'Net 30 days',
    });
    if (invoice.customerContract) {
      const contract = this.contracts.find(
        (c) =>
          c._id ===
          (typeof invoice.customerContract === 'string'
            ? invoice.customerContract
            : invoice.customerContract._id)
      );
      if (contract) {
        this.selectedContract = contract;
        this.invoiceForm.patchValue({ customerContract: contract });
      }
    }
    const servicesArray = this.invoiceForm.get('services') as FormArray;
    servicesArray.clear();
    if (invoice.services && invoice.services.length > 0) {
      invoice.services.forEach((service: any) => {
        servicesArray.push(this.createServiceFormGroup(service));
      });
    } else {
      this.addService();
    }
    this.calculateTotals();

    // Prefill billing address if invoice.customer.address is missing or incomplete
    if (
      invoice.customer &&
      (!invoice.customer.address || !invoice.customer.address.street)
    ) {
      const customer = this.selectedCustomer;
      let billingAddress = {
        street: '',
        city: '',
        municipality: '',
        country: 'Kosovo',
      };
      if (customer) {
        if (!customer.billingAddress || customer.billingAddress.sameAsService) {
          billingAddress.street = customer.address || '';
          billingAddress.city = customer.city || '';
          billingAddress.municipality = customer.municipality || '';
        } else {
          billingAddress.street = customer.billingAddress.address || '';
          billingAddress.city = customer.billingAddress.city || '';
          billingAddress.municipality =
            customer.billingAddress.municipality || '';
        }
        console.log('Prefilling billing address (edit):', billingAddress);
        this.invoiceForm.get('customer.address')?.patchValue(billingAddress);
      }
    }
  }

  populateFromContract(contract: any) {
    if (!contract) return;

    console.log('Populating form from contract:', contract);

    // Set selected contract
    this.selectedContract = contract;

    // Get billing address
    let billingAddress;
    if (contract.billingAddress) {
      if (contract.billingAddress.sameAsService) {
        billingAddress = {
          street: contract.customer?.address?.street || '',
          city: contract.customer?.address?.city || '',
          municipality: contract.customer?.address?.municipality || '',
          country: contract.customer?.address?.country || 'Kosovo',
        };
      } else {
        billingAddress = {
          street: contract.billingAddress.address || '',
          city: contract.billingAddress.city || '',
          municipality: contract.billingAddress.municipality || '',
          country: contract.billingAddress.country || 'Kosovo',
        };
      }
    } else {
      billingAddress = {
        street: contract.customer?.address?.street || '',
        city: contract.customer?.address?.city || '',
        municipality: contract.customer?.address?.municipality || '',
        country: contract.customer?.address?.country || 'Kosovo',
      };
    }

    this.invoiceForm.patchValue({
      customerContract: contract,
      customer: {
        name: contract.customer?.name || contract['customerName'] || '',
        email: contract.customer?.email || '',
        address: billingAddress,
      },
    });

    const servicesArray = this.invoiceForm.get('services') as FormArray;
    servicesArray.clear();

    // Get the contract's total amount
    const contractTotalAmount = contract.totalAmount || 0;

    // Add contract total amount as a service line item
    servicesArray.push(
      this.createServiceFormGroup({
        description: `Contract Total Amount (${contract['contractNumber']})`,
        quantity: 1,
        unitPrice: contractTotalAmount,
        total: contractTotalAmount,
      })
    );

    // If there are additional services, add them as separate line items
    if (contract.services && contract.services.length > 0) {
      contract.services.forEach((service: any) => {
        servicesArray.push(
          this.createServiceFormGroup({
            description: service.name || service.description,
            quantity: 1,
            unitPrice: service.price || 0,
            total: service.price || 0,
          })
        );
      });
    }

    // Update tax rate from contract if available
    if (contract.paymentCalculation?.vatRate) {
      this.invoiceForm.patchValue({
        taxRate: contract.paymentCalculation.vatRate
      });
    }

    this.calculateTotals();
  }

  generateInvoiceNumber() {
    this.invoiceService
      .generateInvoiceNumber()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.invoiceForm.patchValue({
            invoiceNumber: response.invoiceNumber,
          });
        },
        error: (error) => {
          console.error('Error generating invoice number:', error);
          // Fallback to timestamp-based number
          const timestamp = Date.now();
          this.invoiceForm.patchValue({ invoiceNumber: `INV-${timestamp}` });
        },
      });
  }

  // Services FormArray management
  get servicesArray(): FormArray {
    return this.invoiceForm.get('services') as FormArray;
  }

  createServiceFormGroup(
    service?: any,
    fromContract: boolean = false
  ): FormGroup {
    const group = this.fb.group({
      description: [
        {
          value: service?.description || service?.name || '',
          disabled: fromContract,
        },
        Validators.required,
      ],
      quantity: [
        { value: service?.quantity || 1, disabled: fromContract },
        [Validators.required, Validators.min(0.1)],
      ],
      unitPrice: [
        {
          value: service?.unitPrice || service?.price || 0,
          disabled: fromContract,
        },
        [Validators.required, Validators.min(0)],
      ],
      total: [
        {
          value:
            service?.total ||
            (service?.quantity || 1) *
              (service?.unitPrice || service?.price || 0),
          disabled: true,
        },
        [Validators.required, Validators.min(0)],
      ],
      fromContract: [fromContract],
    });

    // Watch for changes to recalculate total
    if (!fromContract) {
      group
        .get('quantity')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateServiceTotal(group));
      group
        .get('unitPrice')
        ?.valueChanges.pipe(takeUntil(this.destroy$))
        .subscribe(() => this.updateServiceTotal(group));
      this.updateServiceTotal(group);
    } else {
      // For contract services, calculate total immediately
      const quantity = group.get('quantity')?.value || 1;
      const unitPrice = group.get('unitPrice')?.value || 0;
      group.patchValue({ total: quantity * unitPrice }, { emitEvent: false });
    }

    return group;
  }

  addService() {
    this.servicesArray.push(this.createServiceFormGroup(undefined, false));
  }

  removeService(index: number) {
    if (this.servicesArray.length > 1) {
      this.servicesArray.removeAt(index);
      this.calculateTotals();
    }
  }

  updateServiceTotal(serviceGroup: FormGroup) {
    const quantity = serviceGroup.get('quantity')?.value || 0;
    const unitPrice = serviceGroup.get('unitPrice')?.value || 0;
    const total = quantity * unitPrice;

    serviceGroup.patchValue({ total }, { emitEvent: false });
    this.calculateTotals();
  }

  calculateTotals() {
    const taxRate = this.invoiceForm.get('taxRate')?.value || 0;
    const discount = this.invoiceForm.get('discount')?.value || 0;
    let subtotal = 0;

    // Calculate subtotal from all services
    this.servicesArray.controls.forEach((s) => {
      const total = +s.get('total')?.value || 0;
      subtotal += total;
    });

    // Add contract total amount to subtotal if a contract is selected
    if (this.selectedContract?.totalAmount) {
      subtotal += this.selectedContract.totalAmount;
    }

    this.subtotal = Math.round(subtotal * 100) / 100;
    this.taxAmount = Math.round(((this.subtotal * taxRate) / 100) * 100) / 100;
    this.totalAmount = Math.round((this.subtotal + this.taxAmount - discount) * 100) / 100;
  }

  // Customer and Contract management
  onCustomerChange(customer: any) {
    this.selectedCustomer = customer;

    // Only fill in customer name and email, not the address
    // Address will be filled when a contract is selected
    this.invoiceForm.patchValue({
      customer: {
        name:
          customer.fullName ||
          customer.name ||
          customer.firstName + ' ' + customer.lastName,
        email: customer.email,
        address: {
          street: '',
          city: '',
          municipality: '',
          country: 'Kosovo',
        },
      },
    });

    if (!customer) {
      this.filteredContracts = [];
      this.selectedContract = null;
      this.customerObjects = [];
      this.selectedObject = null;
      return;
    }

    // Filter objects for selected customer
    this.customerObjects = this.objects.filter(
      (obj) => obj.customerId === customer._id
    );
    console.log(
      `Found ${this.customerObjects.length} objects for customer: ${customer.firstName} ${customer.lastName}`
    );
    console.log('Customer objects:', this.customerObjects);
    // Add detailed logging for each object's address
    this.customerObjects.forEach((obj, index) => {
      console.log(`Object ${index + 1} address structure:`, {
        name: obj.name,
        fullAddress: obj.address,
        street: obj?.address?.street,
        city: obj?.address?.city,
        municipality: obj?.address?.municipality
      });
    });

    // Clear selected object and contract since we changed customer
    this.selectedObject = null;
    this.selectedContract = null;
    this.filteredContracts = [];
    this.invoiceForm.patchValue({
      objectId: '',
      customerContract: null,
    });
  }

  onObjectChange(objectId: string) {
    if (!objectId) {
      this.selectedObject = null;
      this.filteredContracts = [];
      this.selectedContract = null;
      this.invoiceForm.patchValue({ customerContract: null });
      return;
    }

    this.selectedObject =
      this.customerObjects.find((obj) => obj._id === objectId) || null;

    if (!this.selectedObject) {
      this.filteredContracts = [];
      this.selectedContract = null;
      this.invoiceForm.patchValue({ customerContract: null });
      return;
    }

    // Filter contracts for selected customer and object
    const customerName =
      this.selectedCustomer.fullName ||
      this.selectedCustomer.name ||
      `${this.selectedCustomer.firstName} ${this.selectedCustomer.lastName}`;

    console.log('Filtering contracts for object:', {
      selectedObject: this.selectedObject,
      objectId: objectId,
      customerId: this.selectedCustomer._id,
      totalContracts: this.contracts.length,
    });

    this.filteredContracts = this.contracts.filter((contract) => {
      // First check if contract belongs to the selected customer
      const customerMatches =
        contract.customer?._id === this.selectedCustomer._id ||
        contract.customerId === this.selectedCustomer._id ||
        (contract.customer as any)?.fullName === customerName ||
        (contract.customer as any)?.name === customerName ||
        contract.customer?.email === this.selectedCustomer.email;

      // Then check if contract is for the selected object
      const objectMatches = contract.objectId === objectId;

      console.log(
        `Contract ${contract.contractNumber} - Customer match: ${customerMatches}, Object match: ${objectMatches}`
      );

      return customerMatches && objectMatches;
    });

    console.log(
      `Found ${this.filteredContracts.length} contracts for customer ${customerName} and object ${this.selectedObject.name}`
    );

    // Clear selected contract since we changed object
    this.selectedContract = null;
    this.invoiceForm.patchValue({ customerContract: null });
  }

  onContractChange(contract: any) {
    this.selectedContract = contract;

    if (contract) {
      console.log('Contract change - Contract data:', contract);
      console.log(
        'Contract change - Billing address:',
        contract.billingAddress
      );
      console.log(
        'Contract change - Customer address:',
        contract.customer?.address
      );

      // Use billing address from contract, fallback to customer address if billing address not set
      let billingAddress = {
        street: '',
        city: '',
        municipality: '',
        country: 'Kosovo',
      };

      if (contract.billingAddress) {
        console.log(
          'Contract change - sameAsService value:',
          contract.billingAddress.sameAsService
        );

        if (contract.billingAddress.sameAsService) {
          // Use service address (customer address)
          billingAddress = {
            street: contract.customer?.address?.street || '',
            city: contract.customer?.address?.city || '',
            municipality: contract.customer?.address?.municipality || '',
            country: contract.customer?.address?.country || 'Kosovo',
          };
          console.log(
            'Contract change - Using customer address:',
            billingAddress
          );
        } else {
          // Use billing address
          billingAddress = {
            street: contract.billingAddress.address || '',
            city: contract.billingAddress.city || '',
            municipality: contract.billingAddress.municipality || '',
            country: contract.billingAddress.country || 'Kosovo',
          };
          console.log(
            'Contract change - Using billing address:',
            billingAddress
          );
        }
      } else {
        // Fallback to customer address if no billing address defined
        billingAddress = {
          street: contract.customer?.address?.street || '',
          city: contract.customer?.address?.city || '',
          municipality: contract.customer?.address?.municipality || '',
          country: contract.customer?.address?.country || 'Kosovo',
        };
        console.log(
          'Contract change - No billing address defined, using customer address:',
          billingAddress
        );
      }

      console.log(
        'Contract change - Final billing address to be used:',
        billingAddress
      );

      // Update customer information from contract
      this.invoiceForm.patchValue({
        customer: {
          name:
            contract.customer?.fullName ||
            contract.customer?.name ||
            `${contract.customer?.firstName} ${contract.customer?.lastName}` ||
            contract.customerName ||
            '',
          email: contract.customer?.email || '',
          address: billingAddress,
        },
      });

      // Suggest services from contract
      this.suggestServicesFromContract(contract);
    }
  }

  suggestServicesFromContract(contract: any) {
    if (contract.services && contract.services.length > 0) {
      const servicesArray = this.servicesArray;
      if (
        servicesArray.length > 1 ||
        (servicesArray.length === 1 &&
          servicesArray.at(0)?.get('description')?.value)
      ) {
        const replace = confirm(
          'Would you like to replace current services with contract services?'
        );
        if (!replace) return;
      }
      servicesArray.clear();
      contract.services.forEach((service: any) => {
        servicesArray.push(
          this.createServiceFormGroup(
            {
              description: service.name || service.description,
              quantity: 1,
              unitPrice: service.price || 0,
              total: service.price || 0,
            },
            true
          )
        );
      });
      this.calculateTotals();
    }
  }

  // Add services from schedules
  addServicesFromSchedules() {
    const customerSchedules = this.schedules.filter((schedule) => {
      if (this.selectedContract) {
        return schedule.customerContract === this.selectedContract._id;
      }
      return false;
    });

    if (customerSchedules.length === 0) {
      this.snackBar.open('No schedules found for selected contract', 'Close', {
        duration: 3000,
      });
      return;
    }

    customerSchedules.forEach((schedule) => {
      const objectName =
        typeof schedule.object === 'string'
          ? this.getObjectName(schedule.object)
          : schedule.object?.name || 'Unknown Location';

      this.servicesArray.push(
        this.createServiceFormGroup({
          description: `Cleaning service for ${objectName} on ${new Date(
            schedule.scheduledDate
          ).toLocaleDateString()}`,
          quantity: schedule.estimatedDuration || 1,
          unitPrice: 50, // Default hourly rate
          total: (schedule.estimatedDuration || 1) * 50,
        })
      );
    });

    this.calculateTotals();
    this.snackBar.open(
      `Added ${customerSchedules.length} services from schedules`,
      'Close',
      { duration: 3000 }
    );
  }

  getObjectName(objectId: string): string {
    const object = this.objects.find((obj) => obj._id === objectId);
    return object?.name || 'Unknown Location';
  }

  getObjectDisplayName(object: any): string {
    if (!object) return '-- Choose an Object/Location --';

    // Get the name
    const name = object.name || 'Unnamed Object';

    // Handle the nested address structure
    let address = '';
    if (object.address) {
      const parts = [];
      if (object.address.street) parts.push(object.address.street);
      if (object.address.city) parts.push(object.address.city);
      if (object.address.municipality) parts.push(object.address.municipality);
      address = parts.join(', ');
    }

    if (!address) {
      address = 'No address';
    }

    return `${name} - ${address}`;
  }

  get selectedObjectId(): string {
    return this.invoiceForm.get('objectId')?.value || '';
  }

  getSelectedObjectDisplayName(): string {
    const objectId = this.selectedObjectId;
    if (!objectId) return '';
    const object = this.customerObjects.find((obj) => obj._id === objectId);
    return this.getObjectDisplayName(object);
  }

  // Form submission
  onSubmit() {
    if (this.invoiceForm.invalid) {
      this.markFormGroupTouched();
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (this.servicesArray.length === 0) {
      this.snackBar.open('Please add at least one service', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.loading = true;
    const formValue = this.invoiceForm.value;

    // Prepare customer data properly
    const customerData: any = {
      customerId: this.selectedCustomer?._id,
      name: formValue.customer.name,
      email: formValue.customer.email,
      phone: formValue.customer.phone || '',
      address: {
        street: formValue.customer.address?.street || '',
        city: formValue.customer.address?.city || '',
        municipality: formValue.customer.address?.municipality || '',
        country: formValue.customer.address?.country || 'Kosovo',
      },
    };

    // Prepare services data properly (including disabled fields)
    const servicesData = this.servicesArray.controls.map((control) => {
      const service = control.getRawValue(); // getRawValue() includes disabled fields
      return {
        description: service.description || '',
        quantity: Number(service.quantity) || 1,
        unitPrice: Number(service.unitPrice) || 0,
        total: Number(service.total) || 0,
        fromContract: service.fromContract || false,
      };
    });

    // Validate services data
    if (servicesData.some(service => service.quantity <= 0 || service.unitPrice < 0)) {
      this.loading = false;
      this.snackBar.open('Invalid service quantity or price', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Calculate totals
    const subtotal = servicesData.reduce((sum, service) => sum + service.total, 0);
    const taxRate = Number(formValue.taxRate) || 0;
    const taxAmount = (subtotal * taxRate) / 100;
    const discount = Number(formValue.discount) || 0;
    const totalAmount = subtotal + taxAmount - discount;

    // Prepare invoice data
    const invoiceData: any = {
      invoiceNumber: formValue.invoiceNumber,
      objectId: formValue.objectId || null,
      customer: customerData,
      customerContract: this.selectedContract?._id || null,
      issueDate: formValue.issueDate instanceof Date ? formValue.issueDate.toISOString() : new Date(formValue.issueDate).toISOString(),
      dueDate: formValue.dueDate instanceof Date ? formValue.dueDate.toISOString() : new Date(formValue.dueDate).toISOString(),
      services: servicesData,
      currency: 'EUR',
      subtotal: Number(subtotal.toFixed(2)),
      taxRate: taxRate,
      taxAmount: Number(taxAmount.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      totalAmount: Number(totalAmount.toFixed(2)),
      paidAmount: 0,
      balance: Number(totalAmount.toFixed(2)),
      status: formValue.status,
      paymentMethod: formValue.paymentMethod || undefined,
      paymentDate: formValue.paymentDate ? (formValue.paymentDate instanceof Date ? formValue.paymentDate.toISOString() : new Date(formValue.paymentDate).toISOString()) : undefined,
      notes: formValue.notes || '',
      terms: formValue.terms || 'Net 30 days',
    };

    // Remove undefined fields
    Object.keys(invoiceData).forEach(key => {
      if (invoiceData[key] === undefined) {
        delete invoiceData[key];
      }
    });

    // Validate dates
    try {
      new Date(invoiceData.issueDate);
      new Date(invoiceData.dueDate);
      if (invoiceData.paymentDate) {
        new Date(invoiceData.paymentDate);
      }
    } catch (e) {
      this.loading = false;
      this.snackBar.open('Invalid date format', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Add ID for updates
    if (this.isEdit && this.invoiceId) {
      invoiceData._id = this.invoiceId;
    }

    console.log('Sending invoice data:', invoiceData); // Debug log

    const operation = this.isEdit
      ? this.invoiceService.updateInvoice(invoiceData)
      : this.invoiceService.createInvoice(invoiceData);

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (result) => {
        // Check if component is still mounted before updating state
        if (!this.destroy$.closed) {
          this.loading = false;
          // Use afterDismissed to navigate only after the snackBar is dismissed or times out
          this.snackBar.open(
            `Invoice ${this.isEdit ? 'updated' : 'created'} successfully`,
            'Close',
            { duration: 3000 }
          ).afterDismissed().subscribe(() => {
            this.router.navigate(['/invoices']);
          });
        }
      },
      error: (error) => {
        // Check if component is still mounted before updating state
        if (!this.destroy$.closed) {
          this.loading = false;
          console.error('Error saving invoice:', error);
          this.snackBar.open(
            `Error ${this.isEdit ? 'updating' : 'creating'} invoice: ${
              error.error?.message || error.message || 'Unknown error'
            }`,
            'Close',
            { duration: 5000 }
          );
        }
      },
    });
  }

  markFormGroupTouched() {
    Object.keys(this.invoiceForm.controls).forEach((key) => {
      const control = this.invoiceForm.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched();
      }
    });

    this.servicesArray.controls.forEach((control) => {
      Object.keys(control.value).forEach((key) => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  onCancel() {
    this.router.navigate(['/invoices']);
  }

  // Utility methods
  getContractDisplayName(contract: any): string {
    if (!contract) return '';
    const customerName =
      contract.customer?.fullName ||
      contract.customer?.name ||
      `${contract.customer?.firstName} ${contract.customer?.lastName}` ||
      contract.customerName ||
      'Unknown Customer';

    const contractInfo = [
      contract.contractNumber,
      contract.contractType,
      contract.status,
      contract.totalAmount ? `$${contract.totalAmount.toFixed(2)}` : '',
    ]
      .filter(Boolean)
      .join(' | ');

    return `${customerName} - ${contractInfo}`;
  }

  getCustomerDisplayName(customer: any): string {
    return customer
      ? `${
          customer.fullName || customer.firstName + ' ' + customer.lastName
        } (${customer.email})`
      : '';
  }

  // Add loadInvoice method for edit mode
  loadInvoice(id: string) {
    this.loading = true;
    this.invoiceService
      .getInvoiceById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (invoice) => {
          this.invoiceId = invoice._id ?? null;
          this.populateFormFromInvoice(invoice);
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open('Error loading invoice', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/invoices']);
        },
      });
  }

  // Handler to prefill price when service type is selected
  onServiceTypeSelected(index: number) {
    const serviceGroup = this.servicesArray.at(index) as FormGroup;
    const selectedDescription = serviceGroup.get('description')?.value;
    const selectedType = this.serviceTypes.find(
      (t) => t.name === selectedDescription
    );
    if (selectedType) {
      serviceGroup.get('unitPrice')?.setValue(selectedType.pricePerHour);
    }
    this.updateServiceTotal(serviceGroup);
  }
}
