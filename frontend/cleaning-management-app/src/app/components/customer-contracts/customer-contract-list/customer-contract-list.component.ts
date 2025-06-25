import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { EmailService } from '../../../services/email.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import {
  CustomerContract,
  CustomerContractStats,
  CustomerContractFilters,
  CustomerOption,
} from '../../../models/customer-contract.model';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    private router: Router,
    private dialog: MatDialog
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

    this.contracts.forEach((contract) => {
      if (contract.customer) {
        const customerData = contract.customer as any;
        const customerId = customerData._id || customerData.id;
        const customerName =
          customerData.fullName ||
          customerData.name ||
          (customerData.firstName && customerData.lastName
            ? `${customerData.firstName} ${customerData.lastName}`
            : '');

        if (customerId && customerName) {
          uniqueCustomers.set(customerId, {
            _id: customerId,
            name: customerName,
            email: customerData.email || ''
          });
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
          (customerData.email && customerData.email.toLowerCase().includes(search))
        );
      });
    }

    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(
        (contract) => contract.status === this.filters.status
      );
    }

    // Apply contract type filter
    if (this.filters.contractType) {
      filtered = filtered.filter(
        (contract) => contract.contractType === this.filters.contractType
      );
    }

    // Apply customer filter
    if (this.filters.customer) {
      filtered = filtered.filter((contract) => {
        const customerData = contract.customer as any;
        const customerId = customerData._id || customerData.id;
        return customerId === this.filters.customer;
      });
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Contract',
        message: `Are you sure you want to delete contract ${contract.contractNumber}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
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
    });
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

  downloadContractPDF(contract: CustomerContract): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Colors (matching email template)
    const primaryColor = [59, 130, 246]; // Blue (#3b82f6)
    const greenColor = [5, 150, 105]; // Green (#059669)
    const secondaryColor = [31, 41, 55]; // Dark gray (#1f2937)
    const lightGray = [248, 250, 252]; // Light gray (#f8fafc)
    const warningColor = [245, 158, 11]; // Yellow (#f59e0b)
    
    // Header Section (matching email template)
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Contract Signature Required', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Your cleaning service contract is ready for your digital signature', pageWidth / 2, 32, { align: 'center' });
    
    // Reset text color
    doc.setTextColor(0, 0, 0);
    let yPosition = 65;
    
    // Customer greeting
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dear ${contract.customer.name},`, 20, yPosition);
    yPosition += 15;
    
    doc.text('Thank you for choosing CLEANING COMPANY for your cleaning needs.', 20, yPosition);
    yPosition += 8;
    doc.text('Your contract is now ready for your digital signature.', 20, yPosition);
    yPosition += 25;
    
    // Contract Details Section (matching email template)
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPosition - 5, pageWidth - 30, 18, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Contract Details', 20, yPosition + 7);
    
    yPosition += 25;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Contract details in structured format
    const contractDetails = [
      { label: 'Contract Number:', value: contract.contractNumber },
      { label: 'Contract Type:', value: contract.contractType },
      { label: 'Start Date:', value: this.formatDate(contract.startDate) },
      { label: 'End Date:', value: contract.endDate ? this.formatDate(contract.endDate) : 'Ongoing' },
      { label: 'Billing Frequency:', value: contract.billingFrequency },
      { label: 'Payment Terms:', value: contract.paymentTerms },
      { label: 'Total Contract Value:', value: this.formatCurrency(contract.totalAmount) }
    ];
    
    contractDetails.forEach((detail, index) => {
      const currentY = yPosition + (index * 12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128); // Gray color for labels
      doc.text(detail.label, 20, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      // Highlight total value
      if (detail.label.includes('Total')) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      }
      doc.text(detail.value, 100, currentY);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
    });
    
    yPosition += (contractDetails.length * 12) + 20;
    
    // Payment Calculation Section
    if (contract.paymentCalculation) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPosition - 5, pageWidth - 30, 18, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Payment Calculation', 20, yPosition + 7);
      
      yPosition += 25;
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Payment calculation grid
      const paymentCalc = contract.paymentCalculation;
      
      // First row
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Terms:', 20, yPosition);
      doc.text('Payment Method:', 110, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(paymentCalc.paymentTermsText || 'N/A', 20, yPosition + 8);
      doc.text(paymentCalc.paymentMethod || 'N/A', 110, yPosition + 8);
      
      yPosition += 25;
      
      // Quantity and Rate row
      doc.setFont('helvetica', 'bold');
      doc.text('Quantity Hours:', 20, yPosition);
      doc.text('Hourly Rate:', 110, yPosition);
             doc.setFont('helvetica', 'normal');
       doc.text((paymentCalc.quantityHours || 0).toString(), 20, yPosition + 8);
       doc.text(`€${(paymentCalc.hourlyRate || 0).toFixed(2)}`, 110, yPosition + 8);
      
      yPosition += 25;
      
             // Amount calculations
       doc.setFont('helvetica', 'bold');
       doc.text('Total Amount (EUR excluding VAT):', 20, yPosition);
       doc.text('VAT Rate:', 110, yPosition);
       doc.setFont('helvetica', 'normal');
       doc.text(`€${(paymentCalc.totalAmountExcludingVAT || 0).toFixed(2)}`, 20, yPosition + 8);
       doc.text(`${(paymentCalc.vatRate || 8.1).toFixed(1)}%`, 110, yPosition + 8);
       
       yPosition += 25;
       
       // Total with VAT
       doc.setFont('helvetica', 'bold');
       doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
       doc.text('Total Amount (EUR including VAT):', 20, yPosition);
       doc.text(`€${(paymentCalc.totalAmountIncludingVAT || 0).toFixed(2)}`, 20, yPosition + 8);
      
      yPosition += 25;
      doc.setTextColor(0, 0, 0);
      
      // Annual calculations section
      if (paymentCalc.rhythmCountByYear || paymentCalc.totalAnnualizedQuantityHours) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Annual Calculations:', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        // Grid layout for annual calculations
                 const annualItems = [
           { label: 'Rhythm Count by Year:', value: (paymentCalc.rhythmCountByYear || 0).toString() },
           { label: 'Total Annualized Quantity Hours:', value: (paymentCalc.totalAnnualizedQuantityHours || 0).toString() },
           { label: 'Total Month Working Hours:', value: (paymentCalc.totalMonthWorkingHours || 0).toFixed(2) },
           { label: 'Total Annualized Contract Value:', value: `€${(paymentCalc.totalAnnualizedContractValue || 0).toFixed(2)}` },
           { label: 'Total Monthly Contract Value:', value: `€${(paymentCalc.totalMonthlyContractValue || 0).toFixed(2)}` }
         ];
        
        annualItems.forEach((item, index) => {
          const row = Math.floor(index / 2);
          const col = index % 2;
          const xPos = 20 + (col * 90);
          const currentY = yPosition + (row * 16);
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(item.label, xPos, currentY);
          doc.setFont('helvetica', 'normal');
          doc.text(item.value, xPos, currentY + 8);
        });
        
        yPosition += Math.ceil(annualItems.length / 2) * 16 + 10;
      }
      
      // Employee engagement calculations
      if (paymentCalc.employeeHoursPerEngagement || paymentCalc.numberOfEmployees) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Employee Engagement:', 20, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Hours per Engagement:', 20, yPosition);
        doc.text('Number of Employees:', 110, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text((paymentCalc.employeeHoursPerEngagement || 0).toString(), 20, yPosition + 8);
        doc.text((paymentCalc.numberOfEmployees || 1).toString(), 110, yPosition + 8);
        
        yPosition += 20;
        
        doc.setFont('helvetica', 'bold');
        doc.text('Total Hours per Engagement:', 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text((paymentCalc.totalHoursPerEngagement || 0).toString(), 20, yPosition + 8);
        
        yPosition += 25;
      }
    }
    
    // Services Section (matching email table style)
    if (contract.services && contract.services.length > 0) {
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(15, yPosition - 5, pageWidth - 30, 18, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Services Included', 20, yPosition + 7);
      
      yPosition += 25;
      doc.setTextColor(0, 0, 0);
      
      // Table header (matching email style)
      doc.setFillColor(243, 244, 246); // Light gray background
      doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Service', 25, yPosition + 5);
      doc.text('Frequency', 100, yPosition + 5);
      doc.text('Price', pageWidth - 50, yPosition + 5, { align: 'right' });
      
      yPosition += 15;
      
      // Services list
      doc.setFont('helvetica', 'normal');
      let totalServices = 0;
      contract.services.forEach((service, index) => {
        const currentY = yPosition + (index * 12);
        
        // Alternate row background
        if (index % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(20, currentY - 5, pageWidth - 40, 12, 'F');
        }
        
        doc.setTextColor(0, 0, 0);
        doc.text(service.name || 'N/A', 25, currentY + 3);
        doc.text(service.frequency || 'N/A', 100, currentY + 3);
        doc.text(this.formatCurrency(service.price || 0), pageWidth - 50, currentY + 3, { align: 'right' });
        
        totalServices += service.price || 0;
      });
      
      yPosition += (contract.services.length * 12) + 10;
      
      // Total row (matching email style)
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.rect(20, yPosition - 5, pageWidth - 40, 15, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('Total:', 25, yPosition + 5);
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
      doc.text(this.formatCurrency(contract.totalAmount), pageWidth - 50, yPosition + 5, { align: 'right' });
      
      yPosition += 25;
    }
    
    // Special Requirements Section
    if (contract.specialRequirements && contract.specialRequirements.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Special Requirements:', 20, yPosition);
      yPosition += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      contract.specialRequirements.forEach((req, index) => {
        doc.text(`• ${req}`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 10;
    }
    
    // Terms & Conditions Section
    if (contract.terms) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Terms & Conditions:', 20, yPosition);
      yPosition += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const termsLines = doc.splitTextToSize(contract.terms, pageWidth - 50);
      doc.text(termsLines, 20, yPosition);
      yPosition += (termsLines.length * 5) + 15;
    }
    
    // Additional Notes Section
    if (contract.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Additional Notes:', 20, yPosition);
      yPosition += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      const notesLines = doc.splitTextToSize(contract.notes, pageWidth - 50);
      const notesHeight = notesLines.length * 5 + 10;
      doc.rect(15, yPosition - 5, pageWidth - 30, notesHeight, 'F');
      doc.text(notesLines, 20, yPosition);
      yPosition += notesHeight + 10;
    }
    
    // Check if we need a new page for signature section
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = 30;
    }
    
    // Action Required Alert (matching email style)
    doc.setFillColor(254, 243, 199); // Yellow background
    doc.setDrawColor(warningColor[0], warningColor[1], warningColor[2]);
    doc.setLineWidth(3);
    doc.rect(15, yPosition - 5, pageWidth - 30, 25, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(warningColor[0], warningColor[1], warningColor[2]);
    doc.text('Action Required:', 20, yPosition + 5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Please review the contract details above and sign below.', 20, yPosition + 15);
    
    yPosition += 40;
    
    // Digital Signature Section
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(15, yPosition - 5, pageWidth - 30, 18, 'F');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('Digital Signature', 20, yPosition + 7);
    
    yPosition += 30;
    
    // Signature fields
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    
    // Customer signature
    doc.text('Customer Signature:', 20, yPosition);
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPosition + 15, pageWidth - 100, yPosition + 15);
    
    // Date field
    doc.text('Date:', pageWidth - 80, yPosition);
    doc.line(pageWidth - 60, yPosition + 15, pageWidth - 20, yPosition + 15);
    
    yPosition += 30;
    doc.text('Print Name:', 20, yPosition);
    doc.line(20, yPosition + 15, pageWidth - 100, yPosition + 15);
    
    yPosition += 40;
    
    // Company signature section
    doc.text('Company Representative:', 20, yPosition);
    doc.line(20, yPosition + 15, pageWidth - 100, yPosition + 15);
    
    doc.text('Date:', pageWidth - 80, yPosition);
    doc.line(pageWidth - 60, yPosition + 15, pageWidth - 20, yPosition + 15);
    
    yPosition += 30;
    doc.text('Print Name & Title:', 20, yPosition);
    doc.line(20, yPosition + 15, pageWidth - 100, yPosition + 15);
    
    // Footer (matching email template)
    const footerY = pageHeight - 40;
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(0, footerY - 10, pageWidth, 50, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('CLEANING COMPANY', pageWidth / 2, footerY, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('📧 contracts@cleaningcompany.com | 📞 +1 (555) 123-4567', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.text('📍 123 Business Ave, Suite 100, City, State 12345', pageWidth / 2, footerY + 16, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(`This contract was generated on ${new Date().toLocaleDateString()} regarding contract ${contract.contractNumber}.`, pageWidth / 2, footerY + 28, { align: 'center' });
    doc.text('If you received this document in error, please contact us immediately.', pageWidth / 2, footerY + 35, { align: 'center' });
    
    // Save the PDF
    const fileName = `Contract-Signature-${contract.contractNumber}-${contract.customer.name.replace(/\s+/g, '-')}.pdf`;
    doc.save(fileName);
  }
}
