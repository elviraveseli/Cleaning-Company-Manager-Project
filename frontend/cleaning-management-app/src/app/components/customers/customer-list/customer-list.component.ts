import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CustomerService } from '../../../services/customer.service';
import { Customer } from '../../../models/customer.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
})
export class CustomerListComponent implements OnInit, OnDestroy {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isLoading = false;
  searchQuery = '';
  selectedType = 'All';
  selectedStatus = 'All';
  private subscription?: Subscription;
  private searchSubject = new Subject<string>();

  // Table configuration
  displayedColumns: string[] = [
    'avatar',
    'name',
    'contact',
    'type',
    'company',
    'location',
    'status',
    'contracts',
    'revenue',
    'actions',
  ];

  // Statistics
  totalCustomers = 0;
  activeCustomers = 0;
  residentialCustomers = 0;
  commercialCustomers = 0;
  totalRevenue = 0;

  constructor(
    private customerService: CustomerService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.searchSubject.complete();
  }

  private loadCustomers(): void {
    this.isLoading = true;
    this.subscription = this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.filteredCustomers = customers;
        this.calculateStatistics();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.snackBar.open('Error loading customers', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  private calculateStatistics(): void {
    this.totalCustomers = this.customers.length;
    this.activeCustomers = this.customers.filter(
      (c) => c.status === 'Active'
    ).length;
    this.residentialCustomers = this.customers.filter(
      (c) => c.customerType === 'Residential'
    ).length;
    this.commercialCustomers = this.customers.filter(
      (c) => c.customerType !== 'Residential'
    ).length;
    this.totalRevenue = this.customers.reduce(
      (sum, c) => sum + c.totalRevenue,
      0
    );
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim()) {
        this.isLoading = true;
        this.customerService.searchCustomers(query).subscribe({
          next: (customers) => {
            this.customers = customers;
            this.applyFilters();
            this.calculateStatistics();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error searching customers:', error);
            this.snackBar.open('Error searching customers', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            this.isLoading = false;
          }
        });
      } else {
        this.loadCustomers();
      }
    });
  }

  onSearch(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onClearSearch(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.customers];

    // Apply type filter
    if (this.selectedType !== 'All') {
      filtered = filtered.filter(
        (customer) => customer.customerType === this.selectedType
      );
    }

    // Apply status filter
    if (this.selectedStatus !== 'All') {
      filtered = filtered.filter(
        (customer) => customer.status === this.selectedStatus
      );
    }

    this.filteredCustomers = filtered;
  }

  onViewCustomer(customer: Customer): void {
    this.router.navigate(['/customers', customer._id]);
  }

  onEditCustomer(customer: Customer): void {
    this.router.navigate(['/customers/edit', customer._id]);
  }

  onDeleteCustomer(customer: Customer): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Customer',
        message: `Are you sure you want to delete ${customer.firstName} ${customer.lastName}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteCustomer(customer._id);
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
        this.loadCustomers();
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

  onCreateCustomer(): void {
    this.router.navigate(['/customers/new']);
  }

  onExportCustomers(): void {
    this.customerService.exportCustomers().subscribe({
      next: (customers) => {
        this.exportToCSV(customers);
        this.snackBar.open('Customers exported successfully', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
      error: (error) => {
        console.error('Error exporting customers:', error);
        this.snackBar.open('Error exporting customers', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }

  refreshCustomers(): void {
    this.loadCustomers();
  }

  private exportToCSV(customers: Customer[]): void {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Company',
      'Customer Type',
      'Status',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Registration Date',
      'Last Service Date',
      'Total Contracts',
      'Total Revenue',
      'Preferred Contact',
      'Notes',
    ];

    const csvContent = [
      headers.join(','),
      ...customers.map((customer) =>
        [
          customer._id || '',
          customer.firstName || '',
          customer.lastName || '',
          customer.email || '',
          customer.phone || '',
          customer.company || '',
          customer.customerType || '',
          customer.status || '',
          customer.address || '',
          customer.city || '',
          customer.municipality || '',
          customer.registrationDate
            ? new Date(customer.registrationDate).toLocaleDateString()
            : '',
          customer.lastServiceDate
            ? new Date(customer.lastServiceDate).toLocaleDateString()
            : '',
          customer.totalContracts || 0,
          customer.totalRevenue || 0,
          customer.preferredContactMethod || '',
          `"${(customer.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `customers_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  getCustomerInitials(customer: Customer): string {
    return `${customer.firstName.charAt(0)}${customer.lastName.charAt(
      0
    )}`.toUpperCase();
  }

  getStatusColor(status: string): string {
    switch (status) {
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

  getTypeColor(type: string): string {
    switch (type) {
      case 'Residential':
        return '#2196f3';
      case 'Commercial':
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
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Active':
        return 'check_circle';
      case 'Inactive':
        return 'cancel';
      case 'Pending':
        return 'schedule';
      default:
        return 'help_outline';
    }
  }
}
