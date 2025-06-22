import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-detail',
  templateUrl: './customer-detail.component.html',
  styleUrls: ['./customer-detail.component.scss'],
})
export class CustomerDetailComponent implements OnInit, OnDestroy {
  customer: Customer | null = null;
  isLoading = false;
  customerId: string | null = null;
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerService: CustomerService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
      this.loadCustomer();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadCustomer(): void {
    if (!this.customerId) return;

    this.isLoading = true;
    this.subscription = this.customerService
      .getCustomer(this.customerId)
      .subscribe({
        next: (customer) => {
          this.customer = customer;
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

  onEditCustomer(): void {
    if (this.customer) {
      this.router.navigate(['/customers/edit', this.customer._id]);
    }
  }

  onDeleteCustomer(): void {
    if (!this.customer) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Customer',
        message: `Are you sure you want to delete ${this.customer.firstName} ${this.customer.lastName}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.customer) {
        this.deleteCustomer(this.customer._id);
      }
    });
  }

  private deleteCustomer(customerId: string): void {
    this.customerService.deleteCustomer(customerId).subscribe({
      next: () => {
        this.snackBar.open('Customer deleted successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.router.navigate(['/customers']);
      },
      error: (error) => {
        console.error('Error deleting customer:', error);
        this.snackBar.open('Error deleting customer', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  onBackToList(): void {
    this.router.navigate(['/customers']);
  }

  onCreateContract(): void {
    if (this.customer) {
      // Navigate to create customer contract with customer pre-selected
      this.router.navigate(['/customer-contracts/new'], {
        queryParams: { customerId: this.customer._id },
      });
    }
  }

  onViewContracts(): void {
    if (this.customer) {
      // Navigate to customer contracts filtered by this customer
      this.router.navigate(['/customer-contracts'], {
        queryParams: { customerId: this.customer._id },
      });
    }
  }

  onSendEmail(): void {
    if (this.customer) {
      const subject = encodeURIComponent('Cleaning Service Inquiry');
      const body = encodeURIComponent(`Dear ${this.customer.firstName},\n\n`);
      const mailtoLink = `mailto:${this.customer.email}?subject=${subject}&body=${body}`;
      window.open(mailtoLink);
    }
  }

  onCallCustomer(): void {
    if (this.customer) {
      const telLink = `tel:${this.customer.phone}`;
      window.open(telLink);
    }
  }

  getCustomerInitials(): string {
    if (!this.customer) return '';
    return `${this.customer.firstName.charAt(0)}${this.customer.lastName.charAt(
      0
    )}`.toUpperCase();
  }

  getStatusColor(): string {
    if (!this.customer) return '#9e9e9e';
    switch (this.customer.status) {
      case 'Active':
        return '#4caf50';
      case 'Inactive':
        return '#f44336';
      case 'Pending':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  }

  getTypeColor(): string {
    if (!this.customer) return '#9e9e9e';
    switch (this.customer.customerType) {
      case 'Residential':
        return '#2196f3';
      case 'Individual Business':
      case 'General Partnership':
      case 'Limited Partnership':
      case 'Limited Liability Company':
      case 'Joint Stock Company':
        return '#9c27b0';
      default:
        return '#9e9e9e';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sq-XK', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getDaysSinceRegistration(): number {
    if (!this.customer) return 0;
    const today = new Date();
    const registrationDate = new Date(this.customer.registrationDate);
    const timeDiff = today.getTime() - registrationDate.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  getDaysSinceLastService(): number | null {
    if (!this.customer || !this.customer.lastServiceDate) return null;
    const today = new Date();
    const lastServiceDate = new Date(this.customer.lastServiceDate);
    const timeDiff = today.getTime() - lastServiceDate.getTime();
    return Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  getPreferredDaysText(): string {
    if (!this.customer || !this.customer.servicePreferences?.dayPreference)
      return 'Not specified';
    return this.customer.servicePreferences.dayPreference.join(', ');
  }

  hasEmergencyContact(): boolean {
    return !!this.customer?.emergencyContact?.name;
  }

  hasBillingAddress(): boolean {
    return !!this.customer?.billingAddress?.address;
  }

  hasServicePreferences(): boolean {
    return !!this.customer?.servicePreferences;
  }

  hasPaymentInfo(): boolean {
    return !!this.customer?.paymentInfo?.preferredMethod;
  }
}
