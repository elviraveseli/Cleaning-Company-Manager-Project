import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { EmailService } from '../../../services/email.service';
import {
  CustomerContract,
  ObjectOption,
  EmployeeOption,
  CustomerOption,
} from '../../../models/customer-contract.model';

@Component({
  selector: 'app-customer-contract-detail',
  templateUrl: './customer-contract-detail.component.html',
  styleUrls: ['./customer-contract-detail.component.scss'],
})
export class CustomerContractDetailComponent implements OnInit, OnDestroy {
  contract: CustomerContract | null = null;
  loading = false;
  error: string | null = null;
  isEditing = false;
  contractId: string = '';

  // Reference data
  objectOptions: ObjectOption[] = [];
  employeeOptions: EmployeeOption[] = [];

  // Form options
  contractTypes: string[] = [];
  billingFrequencies: string[] = [];
  paymentTerms: string[] = [];
  statusTypes: string[] = [];
  serviceFrequencies: string[] = [];

  // Editing state
  editingContract: CustomerContract | null = null;
  newService = {
    name: '',
    description: '',
    frequency: 'Monthly' as
      | 'Daily'
      | 'Weekly'
      | 'Bi-weekly'
      | 'Monthly'
      | 'As Needed',
    price: 0,
  };
  showAddService = false;

  // Utility
  Math = Math;

  // Add new properties
  customerOptions: CustomerOption[] = [];
  selectedCustomerObjects: ObjectOption[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerContractService: CustomerContractService,
    private emailService: EmailService
  ) {
    this.contractTypes = this.customerContractService.contractTypes;
    this.billingFrequencies = this.customerContractService.billingFrequencies;
    this.paymentTerms = this.customerContractService.paymentTerms;
    this.statusTypes = this.customerContractService.statusTypes;
    this.serviceFrequencies = this.customerContractService.serviceFrequencies;
  }

  ngOnInit(): void {
    // Get contract ID from route
    this.contractId = this.route.snapshot.params['id'] || 'new';

    // Check if we're in editing mode
    this.isEditing =
      this.route.snapshot.url.some((segment) => segment.path === 'edit') ||
      this.contractId === 'new';

    // Initialize form options
    this.contractTypes = this.customerContractService.contractTypes;
    this.billingFrequencies = this.customerContractService.billingFrequencies;
    this.paymentTerms = this.customerContractService.paymentTerms;
    this.statusTypes = this.customerContractService.statusTypes;
    this.serviceFrequencies = this.customerContractService.serviceFrequencies;

    if (this.contractId === 'new') {
      this.initializeNewContract();
    } else {
      this.loadContract();
    }

    this.loadReferenceData();
    this.loadCustomerOptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContract(): void {
    this.loading = true;
    this.customerContractService
      .getContract(this.contractId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contract) => {
          this.contract = contract;
          this.editingContract = { ...contract };
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading contract:', error);
          this.error = 'Failed to load contract';
          this.loading = false;
        },
      });
  }

  private initializeNewContract(): void {
    this.isEditing = true;
    this.contract = null;
    this.editingContract = {
      contractNumber: '', // Will be auto-generated
      customer: {
        name: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA',
        },
      },
      objects: [],
      assignedEmployees: [],
      startDate: new Date(),
      contractType: 'One-time',
      billingFrequency: 'Monthly',
      totalAmount: 0,
      paymentTerms: 'Net 30',
      services: [],
      specialRequirements: [],
      status: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;

    console.log('New contract initialized:', this.editingContract);
  }

  private loadReferenceData(): void {
    this.customerContractService
      .getObjectOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (objects) => {
          this.objectOptions = objects;
        },
        error: (error) => {
          console.error('Error loading objects:', error);
        },
      });

    this.customerContractService
      .getEmployeeOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (employees) => {
          this.employeeOptions = employees;
        },
        error: (error) => {
          console.error('Error loading employees:', error);
        },
      });
  }

  private loadCustomerOptions(): void {
    this.customerContractService.getCustomerOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (customers) => {
          this.customerOptions = customers;
        },
        error: (error) => {
          console.error('Error loading customer options:', error);
          this.error = 'Failed to load customers';
        }
      });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/customer-contracts']);
  }

  editContract(): void {
    this.router.navigate(['/customer-contracts', this.contractId, 'edit']);
  }

  cancelEdit(): void {
    if (this.contractId === 'new') {
      this.goBack();
    } else {
      this.router.navigate(['/customer-contracts', this.contractId]);
    }
  }

  // Form methods
  onFormSubmit(): void {
    if (!this.editingContract) {
      this.error = 'No contract data to save';
      return;
    }

    // Basic validation
    if (!this.editingContract.customer.name.trim()) {
      this.error = 'Customer name is required';
      return;
    }

    if (!this.editingContract.customer.email.trim()) {
      this.error = 'Customer email is required';
      return;
    }

    if (!this.editingContract.customer.phone.trim()) {
      this.error = 'Customer phone is required';
      return;
    }

    this.loading = true;
    this.error = null;

    const contractData = {
      ...this.editingContract,
      totalAmount: this.calculateTotalAmount(),
    };

    // Remove empty fields for create
    if (this.contractId === 'new') {
      delete (contractData as any)._id;
      delete (contractData as any).createdAt;
      delete (contractData as any).updatedAt;
    }

    const operation =
      this.contractId === 'new'
        ? this.customerContractService.createContract(contractData)
        : this.customerContractService.updateContract(
            this.contractId,
            contractData
          );

    operation.pipe(takeUntil(this.destroy$)).subscribe({
      next: (contract) => {
        console.log('Contract saved successfully:', contract);
        this.contract = contract;
        this.loading = false;

        // Navigate to list after successful save
        this.router.navigate(['/customer-contracts']);
      },
      error: (error) => {
        console.error('Error saving contract:', error);
        this.error = `Failed to save contract: ${
          error.error?.message || error.message
        }`;
        this.loading = false;
      },
    });
  }

  deleteContract(): void {
    if (!this.contract) return;

    if (
      confirm(
        `Are you sure you want to delete contract ${this.contract.contractNumber}?`
      )
    ) {
      this.customerContractService
        .deleteContract(this.contract._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/customer-contracts']);
          },
          error: (error) => {
            console.error('Error deleting contract:', error);
            this.error = 'Failed to delete contract';
          },
        });
    }
  }

  duplicateContract(): void {
    if (!this.contract) return;

    console.log('Duplicating customer contract from detail:', this.contract);

    try {
      const duplicateData = {
        ...this.contract,
        contractNumber: '', // Will be auto-generated
        status: 'Pending' as const,
        startDate: new Date(),
        endDate: undefined,
      };

      // Remove fields that shouldn't be duplicated
      delete (duplicateData as any)._id;
      delete (duplicateData as any).createdAt;
      delete (duplicateData as any).updatedAt;
      delete (duplicateData as any).__v;

      console.log(
        'Creating duplicate customer contract with data:',
        duplicateData
      );

      this.customerContractService
        .createContract(duplicateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newContract) => {
            console.log(
              'Customer contract duplicated successfully:',
              newContract
            );
            alert(`Contract duplicated successfully! Redirecting to edit...`);
            this.router.navigate([
              '/customer-contracts',
              newContract._id,
              'edit',
            ]);
          },
          error: (error) => {
            console.error('Error duplicating contract:', error);
            let errorMessage = 'Failed to duplicate contract';
            if (error.error && error.error.message) {
              errorMessage = `Error: ${error.error.message}`;
            }
            this.error = errorMessage;
            alert(errorMessage);
          },
        });
    } catch (error) {
      console.error('Error preparing contract for duplication:', error);
      this.error = 'Error preparing contract for duplication';
      alert('Error preparing contract for duplication. Please try again.');
    }
  }

  // Service management
  addService(): void {
    if (
      !this.editingContract ||
      !this.newService.name ||
      this.newService.price <= 0
    ) {
      return;
    }

    this.editingContract.services.push({ ...this.newService });
    this.newService = {
      name: '',
      description: '',
      frequency: 'Monthly',
      price: 0,
    };
    this.showAddService = false;
  }

  removeService(index: number): void {
    if (!this.editingContract) return;
    this.editingContract.services.splice(index, 1);
  }

  calculateTotalAmount(): number {
    if (!this.editingContract) return 0;
    return this.editingContract.services.reduce(
      (total, service) => total + service.price,
      0
    );
  }

  // Special requirements management
  addSpecialRequirement(requirement: string): void {
    if (!this.editingContract || !requirement.trim()) return;

    if (
      !this.editingContract.specialRequirements.includes(requirement.trim())
    ) {
      this.editingContract.specialRequirements.push(requirement.trim());
    }
  }

  removeSpecialRequirement(index: number): void {
    if (!this.editingContract) return;
    this.editingContract.specialRequirements.splice(index, 1);
  }

  // Object and employee management
  toggleObject(objectId: string): void {
    if (!this.editingContract) return;

    const index = this.editingContract.objects.indexOf(objectId);
    if (index > -1) {
      this.editingContract.objects.splice(index, 1);
    } else {
      this.editingContract.objects.push(objectId);
    }
  }

  toggleEmployee(employeeId: string): void {
    if (!this.editingContract) return;

    if (!this.editingContract.assignedEmployees) {
      this.editingContract.assignedEmployees = [];
    }

    const index = this.editingContract.assignedEmployees.indexOf(employeeId);
    if (index > -1) {
      this.editingContract.assignedEmployees.splice(index, 1);
    } else {
      this.editingContract.assignedEmployees.push(employeeId);
    }
  }

  // Utility methods
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sq-XK', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      Active: 'status-active',
      Pending: 'status-pending',
      Expired: 'status-expired',
      Terminated: 'status-terminated',
      Suspended: 'status-suspended',
    };
    return statusClasses[status] || 'status-default';
  }

  getDaysUntilExpiry(): number | null {
    const contract = this.contract || this.editingContract;
    if (!contract?.endDate) return null;

    const today = new Date();
    const endDate = new Date(contract.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getSelectedObjects(): ObjectOption[] {
    const contract = this.contract || this.editingContract;
    if (!contract) return [];

    return this.objectOptions.filter((obj) =>
      contract.objects.includes(obj._id)
    );
  }

  getSelectedEmployees(): EmployeeOption[] {
    const contract = this.contract || this.editingContract;
    if (!contract?.assignedEmployees) return [];

    return this.employeeOptions.filter((emp) =>
      contract.assignedEmployees!.includes(emp._id)
    );
  }

  isObjectSelected(objectId: string): boolean {
    return this.editingContract?.objects.includes(objectId) || false;
  }

  isEmployeeSelected(employeeId: string): boolean {
    return (
      this.editingContract?.assignedEmployees?.includes(employeeId) || false
    );
  }

  // Date handling methods
  onStartDateChange(event: any): void {
    if (this.editingContract && event.target.value) {
      this.editingContract.startDate = new Date(event.target.value);
    }
  }

  onEndDateChange(event: any): void {
    if (this.editingContract) {
      this.editingContract.endDate = event.target.value
        ? new Date(event.target.value)
        : undefined;
    }
  }

  getStartDateValue(): string {
    return this.editingContract?.startDate
      ? new Date(this.editingContract.startDate).toISOString().split('T')[0]
      : '';
  }

  getEndDateValue(): string {
    return this.editingContract?.endDate
      ? new Date(this.editingContract.endDate).toISOString().split('T')[0]
      : '';
  }

  // Email methods
  sendContractEmail(): void {
    if (!this.contract) {
      console.error('No contract available to send');
      return;
    }

    if (!this.contract.customer.email) {
      alert(
        'Customer email is not available. Please add customer email first.'
      );
      return;
    }

    const confirmed = confirm(
      `Send contract signature email to ${this.contract.customer.name} at ${this.contract.customer.email}?`
    );

    if (!confirmed) return;

    this.loading = true;

    this.emailService
      .sendContractSignatureEmail(this.contract)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.loading = false;
          if (success) {
            alert(
              `Contract signature email sent successfully to ${
                this.contract!.customer.email
              }`
            );
          } else {
            alert('Failed to send email. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error sending email:', error);
          this.loading = false;
          alert('Failed to send email. Please try again.');
        },
      });
  }

  previewContractEmail(): void {
    if (!this.contract) {
      console.error('No contract available to preview');
      return;
    }

    const emailTemplate = this.emailService.previewContractEmail(this.contract);

    // Open preview in a new window/tab
    const previewWindow = window.open(
      '',
      '_blank',
      'width=800,height=600,scrollbars=yes'
    );
    if (previewWindow) {
      previewWindow.document.write(emailTemplate.htmlContent);
      previewWindow.document.close();
    }
  }

  copySignatureLink(): void {
    if (!this.contract?._id) return;

    const signatureUrl = `${window.location.origin}/contracts/${this.contract._id}/sign`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(signatureUrl)
      .then(() => {
        alert('Signature link copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = signatureUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Signature link copied to clipboard!');
      });
  }

  canSendEmail(): boolean {
    return !!(
      this.contract &&
      this.contract.customer.email &&
      ['Active', 'Pending'].includes(this.contract.status)
    );
  }

  debugEmail(): void {
    if (!this.contract) return;
    this.emailService.debugEmailGeneration(this.contract);
  }

  onCustomerSelect(event: any): void {
    const selectedCustomer = event.value;
    if (selectedCustomer && selectedCustomer._id) {
      // Reset selected object when customer changes
      if (this.editingContract) {
        this.editingContract.selectedObject = null;
      }
      
      // Load customer objects
      this.customerContractService.getCustomerObjects(selectedCustomer._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (objects) => {
            this.selectedCustomerObjects = objects;
            console.log('Loaded customer objects:', objects);
          },
          error: (error) => {
            console.error('Error loading customer objects:', error);
            this.error = 'Failed to load customer objects';
            this.selectedCustomerObjects = [];
          }
        });
    } else {
      this.selectedCustomerObjects = [];
    }
  }

  getObjectIcon(type: string): string {
    if (!type) return 'location_on';
    
    switch (type.toLowerCase()) {
      case 'house':
      case 'residential':
        return 'home';
      case 'office':
      case 'commercial':
        return 'business';
      case 'apartment':
        return 'apartment';
      case 'store':
        return 'storefront';
      default:
        return 'location_on';
    }
  }
}
