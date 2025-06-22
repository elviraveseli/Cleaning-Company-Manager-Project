import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { EmailService } from '../../../services/email.service';
import {
  CustomerContract,
  CustomerContractStats,
  CustomerContractFilters,
  CustomerOption,
} from '../../../models/customer-contract.model';

@Component({
  selector: 'app-customer-contract-list',
  templateUrl: './customer-contract-list.component.html',
  styleUrls: ['./customer-contract-list.component.scss'],
})
export class CustomerContractListComponent implements OnInit, OnDestroy {
  contracts: CustomerContract[] = [];
  filteredContracts: CustomerContract[] = [];
  stats: CustomerContractStats = {
    total: 0,
    active: 0,
    expired: 0,
    terminated: 0,
    suspended: 0,
    pending: 0,
    totalRevenue: 0,
    averageContractValue: 0,
  };

  // Filters
  filters: CustomerContractFilters = {};
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';
  selectedCustomer = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  totalPages = 1;

  // Loading states
  loading = false;
  error: string | null = null;

  // Form options
  statusTypes: string[] = [];
  contractTypes: string[] = [];
  customerOptions: CustomerOption[] = [];

  // Utility
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private customerContractService: CustomerContractService,
    private emailService: EmailService,
    private router: Router
  ) {
    this.statusTypes = this.customerContractService.statusTypes;
    this.contractTypes = this.customerContractService.contractTypes;
  }

  ngOnInit(): void {
    // Initialize form options
    this.statusTypes = this.customerContractService.statusTypes;
    this.contractTypes = this.customerContractService.contractTypes;

    this.loadContracts();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadContracts(): void {
    this.loading = true;
    this.customerContractService
      .getContracts(this.filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts = contracts;
          this.extractCustomerOptions();
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          this.error = 'Failed to load contracts';
          this.loading = false;
        },
      });
  }

  private extractCustomerOptions(): void {
    console.log('Extracting customer options from contracts:', this.contracts);

    // Extract unique customers from contracts
    const uniqueCustomers = new Map<string, CustomerOption>();

    this.contracts.forEach((contract, index) => {
      console.log(`Contract ${index}:`, contract);
      console.log(`Customer data:`, contract.customer);

      if (contract.customer) {
        // Use customer._id if available, otherwise create a unique key from name+email
        const customerData = contract.customer as any; // Cast to any to access dynamic properties
        const customerName =
          customerData.fullName ||
          customerData.name ||
          (customerData.firstName && customerData.lastName
            ? `${customerData.firstName} ${customerData.lastName}`
            : '');
        const customerId =
          customerData._id || `${customerName}-${customerData.email}`;

        if (customerId && customerName) {
          uniqueCustomers.set(customerId, {
            _id: customerId,
            name: customerName,
            email: customerData.email || '',
          });
          console.log(`Added customer: ${customerName} with ID: ${customerId}`);
        }
      }
    });

    this.customerOptions = Array.from(uniqueCustomers.values());
    console.log('Final customer options:', this.customerOptions);
    console.log('Customer options count:', this.customerOptions.length);

    // Fallback: if no customers found, check if we have contracts but they're missing customer data
    if (this.customerOptions.length === 0 && this.contracts.length > 0) {
      console.warn(
        'No customer options extracted but contracts exist. Creating fallback options...'
      );

      // Create fallback customer options from contract customer names
      this.contracts.forEach((contract, index) => {
        if (contract.customer) {
          const customerData = contract.customer as any; // Cast to any to access dynamic properties
          const customerName =
            customerData.fullName ||
            customerData.name ||
            (customerData.firstName && customerData.lastName
              ? `${customerData.firstName} ${customerData.lastName}`
              : '');
          if (customerName) {
            this.customerOptions.push({
              _id: `fallback-${index}`,
              name: customerName,
              email: customerData.email || 'No email',
            });
          }
        }
      });

      console.log('Fallback customer options created:', this.customerOptions);
    }
  }

  private loadStats(): void {
    this.customerContractService
      .getContractStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        },
      });
  }

  private loadCustomerOptions(): void {
    // This method is now handled by extractCustomerOptions() in loadContracts()
    // Keeping it for compatibility but it's no longer needed
  }

  // Filtering and Search
  onSearchChange(): void {
    this.filters.search = this.searchTerm;
    this.applyFilters();
  }

  onStatusFilterChange(): void {
    this.filters.status = this.selectedStatus || undefined;
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.filters.contractType = this.selectedType || undefined;
    this.applyFilters();
  }

  onCustomerFilterChange(): void {
    this.filters.customer = this.selectedCustomer || undefined;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedCustomer = '';
    this.filters = {};
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  refreshContracts(): void {
    this.loadContracts();
    this.loadStats();
  }

  private applyFilters(): void {
    let filtered = [...this.contracts];

    // Apply search filter
    if (this.filters.search) {
      const search = this.filters.search.toLowerCase();
      filtered = filtered.filter((contract) => {
        const customerData = contract.customer as any;
        const customerName =
          customerData.fullName ||
          customerData.name ||
          `${customerData.firstName} ${customerData.lastName}` ||
          '';
        return (
          contract.contractNumber.toLowerCase().includes(search) ||
          customerName.toLowerCase().includes(search) ||
          customerData.email.toLowerCase().includes(search)
        );
      });
    }

    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(
        (contract) => contract.status === this.filters.status
      );
    }

    // Apply type filter
    if (this.filters.contractType) {
      filtered = filtered.filter(
        (contract) => contract.contractType === this.filters.contractType
      );
    }

    // Apply customer filter
    if (this.filters.customer) {
      filtered = filtered.filter(
        (contract) => contract.customer._id === this.filters.customer
      );
    }

    this.filteredContracts = filtered;
    this.updatePagination();
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredContracts.length / this.pageSize);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.updatePagination();
  }

  getPageNumbers(): (number | null)[] {
    const pages: (number | null)[] = [];
    const maxVisible = 5;

    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (this.currentPage > 3) {
        pages.push(null); // ellipsis
      }

      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== this.totalPages) {
          pages.push(i);
        }
      }

      if (this.currentPage < this.totalPages - 2) {
        pages.push(null); // ellipsis
      }

      if (this.totalPages > 1) {
        pages.push(this.totalPages);
      }
    }

    return pages;
  }

  get paginatedContracts(): CustomerContract[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredContracts.slice(start, end);
  }

  // Navigation
  viewContract(contract: CustomerContract): void {
    this.router.navigate(['/customer-contracts', contract._id]);
  }

  editContract(contract: CustomerContract): void {
    this.router.navigate(['/customer-contracts', contract._id, 'edit']);
  }

  createContract(): void {
    this.router.navigate(['/customer-contracts', 'new']);
  }

  duplicateContract(contract: CustomerContract): void {
    console.log('Duplicating customer contract:', contract);

    try {
      const duplicateData = {
        ...contract,
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
            alert(`Contract duplicated successfully!`);
            this.loadContracts();
            this.loadStats();
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

  deleteContract(contract: CustomerContract): void {
    if (
      confirm(
        `Are you sure you want to delete contract ${contract.contractNumber}?`
      )
    ) {
      this.customerContractService
        .deleteContract(contract._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadContracts();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting contract:', error);
            this.error = 'Failed to delete contract';
          },
        });
    }
  }

  // Utility methods
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

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sq-XK', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getDaysUntilExpiry(contract: CustomerContract): number | null {
    if (!contract.endDate) return null;
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Export functionality
  exportToCSV(): void {
    this.customerContractService
      .exportToCSV()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (csvContent) => {
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `customer-contracts-${
            new Date().toISOString().split('T')[0]
          }.csv`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting contracts:', error);
          this.error = 'Failed to export contracts';
        },
      });
  }

  // Email methods
  sendContractEmail(contract: CustomerContract): void {
    if (!contract.customer.email) {
      alert('Customer email is not available for this contract.');
      return;
    }

    const customerData = contract.customer as any;
    const customerName =
      customerData.fullName ||
      customerData.name ||
      `${customerData.firstName} ${customerData.lastName}` ||
      'Unknown Customer';
    const confirmed = confirm(
      `Send contract signature email to ${customerName} at ${customerData.email}?`
    );

    if (!confirmed) return;

    this.emailService
      .sendContractSignatureEmail(contract)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            alert(
              `Contract signature email sent successfully to ${contract.customer.email}`
            );
          } else {
            alert('Failed to send email. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error sending email:', error);
          alert('Failed to send email. Please try again.');
        },
      });
  }

  canSendEmail(contract: CustomerContract): boolean {
    return !!(
      contract.customer.email && ['Active', 'Pending'].includes(contract.status)
    );
  }

  // Helper methods for Material Design table
  getCustomerInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Active':
        return 'check_circle';
      case 'Pending':
        return 'schedule';
      case 'Expired':
        return 'event_busy';
      case 'Terminated':
        return 'cancel';
      case 'Suspended':
        return 'pause_circle';
      default:
        return 'help';
    }
  }

  trackByContractId(index: number, contract: CustomerContract): string {
    return contract._id;
  }
}
