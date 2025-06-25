import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../../services/invoice.service';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { InvoiceDetailComponent } from '../invoice-detail/invoice-detail.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import {
  Invoice,
  InvoiceListQuery,
  InvoiceStatus,
  InvoiceStats,
  PaymentUpdate,
  PaymentMethod,
} from '../../../models/invoice.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-invoice-list',
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.scss'],
})
export class InvoiceListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data properties
  invoices: Invoice[] = [];
  contracts: any[] = [];
  loading = false;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalInvoices = 0;

  // Filtering and search
  searchTerm = '';
  selectedStatus: InvoiceStatus | 'All' = 'All';
  dateFrom = '';
  dateTo = '';
  showFilters = false;

  // Statistics
  stats: InvoiceStats = {
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    overdue: 0,
    pending: 0,
    averageInvoiceValue: 0,
    revenueByMunicipality: {},
    vatCollected: 0,
  };

  // Display columns for table
  displayedColumns: string[] = [
    'invoiceNumber',
    'customer',
    'issueDate',
    'dueDate',
    'totalAmount',
    'status',
    'actions',
  ];

  // Status options for filter
  statusOptions: (InvoiceStatus | 'All')[] = [
    'All',
    'Draft',
    'Sent',
    'Paid',
    'Overdue',
    'Cancelled',
    'Partially Paid',
  ];

  constructor(
    private invoiceService: InvoiceService,
    private contractService: CustomerContractService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadInvoices();
    this.loadContracts();
    this.loadStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInvoices() {
    this.loading = true;

    // Format dates to ISO string if they exist
    const formattedDateFrom = this.dateFrom ? new Date(this.dateFrom + 'T00:00:00').toISOString() : '';
    const formattedDateTo = this.dateTo ? new Date(this.dateTo + 'T23:59:59').toISOString() : '';

    const query: InvoiceListQuery = {
      page: this.currentPage,
      limit: this.pageSize,
      ...(this.searchTerm && { search: this.searchTerm.trim() }),
      ...(this.selectedStatus !== 'All' && { status: this.selectedStatus }),
      ...(formattedDateFrom && { dateFrom: formattedDateFrom }),
      ...(formattedDateTo && { dateTo: formattedDateTo }),
    };

    this.invoiceService
      .getInvoices(query)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.invoices = response.invoices;
          this.totalPages = response.totalPages;
          this.currentPage = response.currentPage;
          this.totalInvoices = response.total;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading invoices:', error);
          this.loading = false;
          this.snackBar.open('Error loading invoices', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  loadContracts() {
    this.contractService
      .getCustomerContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts = contracts;
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
        },
      });
  }

  loadStats() {
    this.invoiceService
      .getInvoiceStats()
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

  // Search and filter methods
  onSearch() {
    this.currentPage = 1;
    this.loadInvoices();
  }

  onStatusChange() {
    this.currentPage = 1;
    this.loadInvoices();
  }

  onDateRangeChange() {
    this.currentPage = 1;
    this.loadInvoices();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.dateFrom = '';
    this.dateTo = '';
    this.currentPage = 1;
    this.loadInvoices();
  }

  clearSearch() {
    this.searchTerm = '';
    this.loadInvoices();
  }

  exportInvoices() {
    // Create CSV export manually since the service doesn't have exportInvoices method
    try {
      const csvData = this.convertToCSV(this.invoices);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'invoices.csv';
      link.click();
      window.URL.revokeObjectURL(url);
      this.snackBar.open('Invoices exported successfully', 'Close', {
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error exporting invoices:', error);
      this.snackBar.open('Error exporting invoices', 'Close', {
        duration: 3000,
      });
    }
  }

  private convertToCSV(invoices: Invoice[]): string {
    const headers = [
      'Invoice Number',
      'Customer',
      'Issue Date',
      'Due Date',
      'Total Amount',
      'Paid Amount',
      'Status',
    ];

    const csvRows = [
      headers.join(','),
      ...invoices.map((invoice) =>
        [
          invoice.invoiceNumber,
          this.getCustomerName(invoice),
          this.formatDate(invoice.issueDate),
          this.formatDate(invoice.dueDate),
          invoice.totalAmount,
          invoice.paidAmount || 0,
          invoice.status,
        ].join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  // Pagination methods
  onPageChange(page: number) {
    this.currentPage = page;
    this.loadInvoices();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadInvoices();
  }

  // Invoice operations
  createInvoice() {
    this.router.navigate(['/invoices/new']);
  }

  createInvoiceFromContract(contract: any) {
    this.router.navigate(['/invoices/new'], { state: { contract } });
  }

  editInvoice(invoice: Invoice) {
    this.router.navigate(['/invoices', invoice._id, 'edit']);
  }

  deleteInvoice(invoice: Invoice) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Invoice',
        message: `Are you sure you want to delete invoice ${invoice.invoiceNumber}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && invoice._id) {
        this.invoiceService
          .deleteInvoice(invoice._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadInvoices();
              this.loadStats();
              this.snackBar.open('Invoice deleted successfully', 'Close', {
                duration: 3000,
              });
            },
            error: (error) => {
              console.error('Error deleting invoice:', error);
              this.snackBar.open('Error deleting invoice', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

  // Invoice actions
  markAsPaid(invoice: Invoice) {
    const invoiceId = invoice._id;
    if (!invoiceId) {
      this.snackBar.open('Invalid invoice ID', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Mark Invoice as Paid',
        message: `Are you sure you want to mark invoice ${invoice.invoiceNumber} as paid?`,
        confirmText: 'Mark as Paid',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.invoiceService
          .markAsPaid(invoiceId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadInvoices();
              this.loadStats();
              this.snackBar.open('Invoice marked as paid', 'Close', {
                duration: 3000,
              });
            },
            error: (error) => {
              console.error('Error marking invoice as paid:', error);
              this.snackBar.open(
                `Error marking invoice as paid: ${error.error?.message || error.message || 'Unknown error'}`,
                'Close',
                { duration: 5000 }
              );
            },
          });
      }
    });
  }

  markAsSent(invoice: Invoice) {
    const invoiceId = invoice._id;
    if (!invoiceId) {
      this.snackBar.open('Invalid invoice ID', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Mark Invoice as Sent',
        message: `Are you sure you want to mark invoice ${invoice.invoiceNumber} as sent?`,
        confirmText: 'Mark as Sent',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.invoiceService
          .markAsSent(invoiceId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadInvoices();
              this.loadStats();
              this.snackBar.open('Invoice marked as sent', 'Close', {
                duration: 3000,
              });
            },
            error: (error) => {
              console.error('Error marking invoice as sent:', error);
              this.snackBar.open(
                `Error marking invoice as sent: ${error.error?.message || error.message || 'Unknown error'}`,
                'Close',
                { duration: 5000 }
              );
            },
          });
      }
    });
  }

  sendInvoiceEmail(invoice: Invoice) {
    if (!invoice._id) return;

    // Show loading dialog
    const loadingDialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      disableClose: true,
      data: {
        title: 'Sending Invoice',
        message: 'Preparing invoice PDF and sending email...',
        hideActions: true,
        showSpinner: true
      }
    });

    const customerEmail = this.getCustomerEmail(invoice);
    if (!customerEmail) {
      loadingDialogRef.close();
      this.snackBar.open('Customer email not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    const emailData = {
      to: customerEmail,
      subject: `Invoice ${invoice.invoiceNumber} from Your Company`,
      message: `
Dear ${invoice.customer.name},

Please find attached the invoice ${invoice.invoiceNumber} for our services.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Amount: €${invoice.totalAmount.toFixed(2)}
- Due Date: ${this.formatDate(invoice.dueDate)}

You can view and pay this invoice using the secure payment link in this email.

Thank you for your business!

Best regards,
Your Company
      `,
      replyTo: 'your-company@example.com', // Replace with your company email
    };

    this.invoiceService
      .sendInvoiceEmail(invoice._id, emailData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          loadingDialogRef.close();
          
          // Show success dialog
          this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
              title: 'Invoice Sent',
              message: `Invoice has been sent to ${customerEmail} and marked as "Sent".\n\nThe customer will receive:\n- Invoice PDF\n- Secure payment link\n- Payment instructions`,
              confirmText: 'OK',
              hideCancel: true,
              confirmColor: 'primary'
            }
          });

          // Refresh the invoice list to show updated status
          this.loadInvoices();
          this.loadStats();
        },
        error: (error) => {
          loadingDialogRef.close();
          console.error('Error sending invoice email:', error);
          
          // Show error dialog
          this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
              title: 'Error Sending Invoice',
              message: `Failed to send invoice: ${error.error?.message || error.message || 'Unknown error'}`,
              confirmText: 'OK',
              hideCancel: true,
              confirmColor: 'warn'
            }
          });
        },
      });
  }

  // Helper method to check email status
  private checkEmailStatus(invoiceId: string) {
    this.invoiceService.getEmailStatus(invoiceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          if (status.openedAt) {
            console.log('Invoice email was opened at:', status.openedAt);
          }
          if (status.clickedAt) {
            console.log('Payment link was clicked at:', status.clickedAt);
          }
        },
        error: (error) => {
          console.error('Error checking email status:', error);
        }
      });
  }

  exportToPDF(invoice: Invoice) {
    if (!invoice._id) return;

    this.invoiceService
      .exportInvoicePDF(invoice._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${invoice.invoiceNumber}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting PDF:', error);
          this.snackBar.open('Error exporting PDF', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  // Utility methods
  getStatusColor(status: InvoiceStatus): string {
    const colors = {
      Draft: '#9E9E9E',
      Sent: '#2196F3',
      Paid: '#4CAF50',
      Overdue: '#F44336',
      Cancelled: '#607D8B',
      'Partially Paid': '#FF9800',
    };
    return colors[status] || '#9E9E9E';
  }

  getCustomerName(invoice: Invoice): string {
    const customer = invoice.customer as any;
    return (
      customer.fullName ||
      customer.name ||
      `${customer.firstName} ${customer.lastName}` ||
      'Unknown Customer'
    );
  }

  getCustomerEmail(invoice: Invoice): string {
    return invoice.customer.email || '';
  }

  isOverdue(invoice: Invoice): boolean {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return invoice.status !== 'Paid' && dueDate < today;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  refreshData() {
    this.loadInvoices();
    this.loadStats();
    this.snackBar.open('Data refreshed', 'Close', { duration: 2000 });
  }
}
