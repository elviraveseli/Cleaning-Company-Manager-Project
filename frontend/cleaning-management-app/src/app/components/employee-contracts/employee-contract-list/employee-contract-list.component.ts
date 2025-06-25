import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EmployeeContractService } from '../../../services/employee-contract.service';
import { EmployeeService } from '../../../services/employee.service';
import { EmailService } from '../../../services/email.service';
import { EmployeeContract } from '../../../models/employee-contract.model';
import { Employee } from '../../../services/employee.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employee-contract-list',
  templateUrl: './employee-contract-list.component.html',
  styleUrls: ['./employee-contract-list.component.scss'],
})
export class EmployeeContractListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'employeeName',
    'contractType',
    'startDate',
    'endDate',
    'salary',
    'status',
    'actions',
  ];
  dataSource: MatTableDataSource<EmployeeContract & { employeeName: string }>;
  isLoading = true;
  employees: { [key: string]: Employee } = {};
  searchTerm = '';
  private destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private contractService: EmployeeContractService,
    private employeeService: EmployeeService,
    private emailService: EmailService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private loadData(): void {
    this.isLoading = true;

    // Load employees first
    this.employeeService.employees$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (employees) => {
        this.employees = employees.reduce((acc, emp) => {
          acc[emp._id] = emp;
          return acc;
        }, {} as { [key: string]: Employee });

        // Then load contracts
        this.loadContracts();
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Error loading employee data', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  private loadContracts(): void {
    this.contractService.contracts$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (contracts) => {
        const contractsWithNames = contracts.map((contract) => ({
          ...contract,
          employeeName: this.getEmployeeName(contract.employeeId),
        }));
        this.dataSource.data = contractsWithNames;
        this.isLoading = false;
        console.log('Loaded contracts:', contractsWithNames.length);
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.snackBar.open('Error loading contracts', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  refreshContracts(): void {
    this.loadData();
  }

  private getEmployeeName(employeeId: string): string {
    const employee = this.employees[employeeId];
    return employee
      ? `${employee.firstName} ${employee.lastName}`
      : 'Unknown Employee';
  }

  applyFilter(filterValue: string): void {
    this.searchTerm = filterValue;
    filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (
      data: EmployeeContract & { employeeName: string },
      filter: string
    ) => {
      const searchStr =
        `${data.employeeName} ${data.contractType} ${data.status}`.toLowerCase();
      return searchStr.includes(filter);
    };
    this.dataSource.filter = filterValue;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter('');
  }

  addContract(): void {
    this.router.navigate(['/employee-contracts/new']);
  }

  viewContract(contract: EmployeeContract): void {
    this.router.navigate(['/employee-contracts', contract._id]);
  }

  editContract(contract: EmployeeContract): void {
    this.router.navigate(['/employee-contracts/edit', contract._id]);
  }

  deleteContract(contract: EmployeeContract): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Contract',
        message: `Are you sure you want to permanently delete the contract for ${this.getEmployeeName(
          contract.employeeId
        )}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.contractService.deleteContract(contract._id).subscribe({
          next: () => {
            this.snackBar.open(
              `Contract for ${this.getEmployeeName(
                contract.employeeId
              )} has been deleted successfully`,
              'Close',
              {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              }
            );
          },
          error: (error) => {
            console.error('Error deleting contract:', error);
            this.snackBar.open(
              'Error deleting contract. Please try again.',
              'Close',
              {
                duration: 3000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              }
            );
          },
        });
      }
    });
  }

  terminateContract(contract: EmployeeContract): void {
    // This could open a dialog to get termination details
    const reason = prompt('Enter termination reason:');
    const notes = prompt('Enter additional notes (optional):') || '';

    if (reason) {
      this.contractService
        .terminateContract(contract._id, reason, notes)
        .subscribe({
          next: () => {
            this.snackBar.open(`Contract terminated successfully`, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
          error: (error) => {
            console.error('Error terminating contract:', error);
            this.snackBar.open('Error terminating contract', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          },
        });
    }
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'check_circle';
      case 'expired':
        return 'schedule';
      case 'terminated':
        return 'cancel';
      default:
        return 'help_outline';
    }
  }

  // Helper methods for statistics
  getTotalContracts(): number {
    return this.dataSource.data.length;
  }

  getActiveContracts(): number {
    return this.dataSource.data.filter(
      (contract) => contract.status === 'Active'
    ).length;
  }

  getExpiredContracts(): number {
    return this.dataSource.data.filter(
      (contract) => contract.status === 'Expired'
    ).length;
  }

  getEmployeeInitials(employeeName: string): string {
    if (!employeeName) return '';
    return employeeName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  // Additional action methods
  duplicateContract(contract: EmployeeContract): void {
    console.log('Duplicating contract:', contract);

    try {
      const duplicatedContract = {
        ...contract,
        startDate: new Date(),
        endDate: undefined,
        status: 'Active' as const,
        terminationDetails: undefined,
        documents: [],
      };

      // Remove fields that shouldn't be duplicated
      delete (duplicatedContract as any)._id;
      delete (duplicatedContract as any).createdAt;
      delete (duplicatedContract as any).updatedAt;
      delete (duplicatedContract as any).__v;

      console.log('Creating duplicate contract with data:', duplicatedContract);

      this.contractService.createContract(duplicatedContract).subscribe({
        next: (newContract) => {
          console.log('Contract duplicated successfully:', newContract);
          this.snackBar.open(
            `Contract duplicated successfully for ${this.getEmployeeName(
              contract.employeeId
            )}`,
            'Close',
            {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
          this.loadData(); // Refresh the data
        },
        error: (error) => {
          console.error('Error duplicating contract:', error);
          let errorMessage = 'Error duplicating contract';
          if (error.error && error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          }
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
    } catch (error) {
      console.error('Error preparing contract for duplication:', error);
      this.snackBar.open('Error preparing contract for duplication', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  exportContracts(): void {
    const contracts = this.dataSource.data;
    const csvContent = this.convertToCSV(contracts);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee-contracts-${
      new Date().toISOString().split('T')[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Contracts exported successfully', 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private convertToCSV(contracts: any[]): string {
    const headers = [
      'Employee Name',
      'Contract Type',
      'Start Date',
      'End Date',
      'Salary',
      'Payment Frequency',
      'Status',
    ];
    const csvRows = [headers.join(',')];

    contracts.forEach((contract) => {
      const row = [
        contract.employeeName,
        contract.contractType,
        contract.startDate,
        contract.endDate || 'Ongoing',
        contract.salary,
        contract.paymentFrequency,
        contract.status,
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  filterByStatus(status: string): void {
    if (status === 'all') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (
        data: EmployeeContract & { employeeName: string },
        filter: string
      ) => {
        return data.status.toLowerCase() === filter.toLowerCase();
      };
      this.dataSource.filter = status;
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterByType(type: string): void {
    if (type === 'all') {
      this.dataSource.filter = '';
    } else {
      this.dataSource.filterPredicate = (
        data: EmployeeContract & { employeeName: string },
        filter: string
      ) => {
        return data.contractType.toLowerCase() === filter.toLowerCase();
      };
      this.dataSource.filter = type;
    }

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  printContract(contract: EmployeeContract): void {
    try {
      const employeeName = this.getEmployeeName(contract.employeeId);
      const employee = Object.values(this.employees).find(
        (emp) => emp._id === contract.employeeId
      );

      if (!employee) {
        this.snackBar.open('Employee information not found', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        return;
      }

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=1000');

      if (!printWindow) {
        this.snackBar.open('Please allow pop-ups to print contracts', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        return;
      }

      // Generate the print content
      const printContent = this.generatePrintableContract(contract, employee);

      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load, then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };

      this.snackBar.open('Opening print dialog...', 'Close', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    } catch (error) {
      console.error('Error preparing contract for printing:', error);
      this.snackBar.open('Error preparing contract for printing', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }

  private generatePrintableContract(
    contract: EmployeeContract,
    employee: Employee
  ): string {
    const currentDate = new Date().toLocaleDateString();
    const startDate = new Date(contract.startDate).toLocaleDateString();
    const endDate = contract.endDate
      ? new Date(contract.endDate).toLocaleDateString()
      : 'Ongoing';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Contract - ${employee.firstName} ${
      employee.lastName
    }</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            color: #333;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .document-title {
            font-size: 24px;
            color: #34495e;
            margin-bottom: 5px;
          }
          .contract-number {
            font-size: 14px;
            color: #7f8c8d;
            font-style: italic;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-item {
            margin-bottom: 10px;
          }
          .info-label {
            font-weight: bold;
            color: #2c3e50;
            display: inline-block;
            width: 140px;
          }
          .info-value {
            color: #34495e;
          }
          .terms-list {
            list-style-type: decimal;
            padding-left: 20px;
          }
          .terms-list li {
            margin-bottom: 10px;
            text-align: justify;
          }
          .benefits-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 5px;
            margin-top: 10px;
          }
          .benefit-item {
            padding: 5px 0;
            border-bottom: 1px dotted #bdc3c7;
          }
          .signature-section {
            margin-top: 60px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 60px;
          }
          .signature-block {
            text-align: center;
          }
          .signature-line {
            border-bottom: 2px solid #2c3e50;
            margin-bottom: 10px;
            height: 40px;
          }
          .signature-label {
            font-weight: bold;
            color: #2c3e50;
          }
          .signature-date {
            margin-top: 20px;
            font-size: 12px;
            color: #7f8c8d;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
            padding-top: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-active {
            background-color: #d4edda;
            color: #155724;
          }
          .status-expired {
            background-color: #fff3cd;
            color: #856404;
          }
          .status-terminated {
            background-color: #f8d7da;
            color: #721c24;
          }
          @media print {
            body { margin: 0; padding: 20px; }
            .header { page-break-after: avoid; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Cleaning Management System</div>
          <div class="document-title">Employment Contract</div>
                     <div class="contract-number">Contract #${contract._id.slice(
                       -8
                     )}</div>
          <div class="status-badge status-${contract.status.toLowerCase()}">
            ${contract.status}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Employee Information</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Full Name:</span>
                <span class="info-value">${employee.firstName} ${
      employee.lastName
    }</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${employee.email}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${employee.phone}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Position:</span>
                <span class="info-value">${employee.position}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Address:</span>
                <span class="info-value">${employee.address || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">City:</span>
                <span class="info-value">${employee.city || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">State:</span>
                <span class="info-value">${
                  employee.municipality || 'N/A'
                }</span>
              </div>
              <div class="info-item">
                <span class="info-label">Zip Code:</span>
                <span class="info-value">Kosovo</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contract Details</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Contract Type:</span>
                <span class="info-value">${contract.contractType}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Start Date:</span>
                <span class="info-value">${startDate}</span>
              </div>
              <div class="info-item">
                <span class="info-label">End Date:</span>
                <span class="info-value">${endDate}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Salary:</span>
                <span class="info-value">€${
                  contract.salary?.toLocaleString() || 'N/A'
                }</span>
              </div>
              <div class="info-item">
                <span class="info-label">Payment Frequency:</span>
                <span class="info-value">${contract.paymentFrequency}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${contract.status}</span>
              </div>
            </div>
          </div>
        </div>

        ${
          contract.workingHours
            ? `
        <div class="section">
          <div class="section-title">Working Hours</div>
          <div class="info-item">
            <span class="info-label">Weekly Hours:</span>
            <span class="info-value">${
              contract.workingHours.weeklyHours || 'N/A'
            } hours</span>
          </div>
          <div class="info-item">
            <span class="info-label">Schedule Type:</span>
            <span class="info-value">${
              contract.workingHours.scheduleType || 'N/A'
            }</span>
          </div>
        </div>
        `
            : ''
        }

        ${
          contract.benefits && contract.benefits.length > 0
            ? `
        <div class="section">
          <div class="section-title">Benefits Package</div>
          <div class="benefits-list">
            ${contract.benefits
              .map((benefit) => `<div class="benefit-item">• ${benefit}</div>`)
              .join('')}
          </div>
        </div>
        `
            : ''
        }

        ${
          contract.leaveEntitlement
            ? `
        <div class="section">
          <div class="section-title">Leave Entitlement</div>
          <div class="info-grid">
            <div>
              <div class="info-item">
                <span class="info-label">Annual Leave:</span>
                <span class="info-value">${
                  contract.leaveEntitlement.annualLeave || 'N/A'
                } days</span>
              </div>
              <div class="info-item">
                <span class="info-label">Sick Leave:</span>
                <span class="info-value">${
                  contract.leaveEntitlement.sickLeave || 'N/A'
                } days</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">Paid Holidays:</span>
                <span class="info-value">${
                  contract.leaveEntitlement.paidHolidays || 'N/A'
                } days</span>
              </div>
            </div>
          </div>
        </div>
        `
            : ''
        }

        ${
          contract.terms && contract.terms.length > 0
            ? `
        <div class="section">
          <div class="section-title">Terms and Conditions</div>
          <ol class="terms-list">
            ${contract.terms.map((term) => `<li>${term}</li>`).join('')}
          </ol>
        </div>
        `
            : ''
        }

        <div class="signature-section">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Employee Signature</div>
            <div class="signature-date">Date: _______________</div>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-label">Employer Signature</div>
            <div class="signature-date">Date: _______________</div>
          </div>
        </div>

        <div class="footer">
          <p>This contract was generated on ${currentDate}</p>
          <p>Cleaning Management System - Employee Contract</p>
        </div>
      </body>
      </html>
    `;
  }

  emailContract(contract: EmployeeContract): void {
    const employee = this.employees[contract.employeeId];
    if (!employee || !employee.email) {
      this.snackBar.open('Employee email is not available for this contract.', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return;
    }

    const employeeName = this.getEmployeeName(contract.employeeId);
    const confirmed = confirm(
      `Send contract email to ${employeeName} at ${employee.email}?`
    );

    if (!confirmed) return;

    this.emailService
      .sendEmployeeContractEmail(contract, employee)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          if (success) {
            this.snackBar.open(
              `Contract email sent successfully to ${employee.email}`,
              'Close',
              {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              }
            );
          } else {
            this.snackBar.open('Failed to send email. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
          }
        },
        error: (error) => {
          console.error('Error sending email:', error);
          this.snackBar.open('Failed to send email. Please try again.', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
  }

  canSendEmail(contract: EmployeeContract): boolean {
    const employee = this.employees[contract.employeeId];
    return !!(
      employee && employee.email && ['Active', 'Pending'].includes(contract.status)
    );
  }

  // Bulk actions
  bulkDelete(contracts: EmployeeContract[]): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Bulk Delete Contracts',
        message: `Are you sure you want to delete ${contracts.length} contracts? This action cannot be undone.`,
        confirmText: 'Delete All',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        contracts.forEach((contract) => {
          this.contractService.deleteContract(contract._id).subscribe({
            error: (error) => console.error('Error deleting contract:', error),
          });
        });

        this.snackBar.open(
          `${contracts.length} contracts deleted successfully`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
      }
    });
  }

  // Quick actions
  quickRenew(contract: EmployeeContract): void {
    const newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1); // Extend by 1 year

    this.contractService.renewContract(contract._id, newEndDate).subscribe({
      next: () => {
        this.snackBar.open(
          `Contract renewed for ${this.getEmployeeName(contract.employeeId)}`,
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
      },
      error: (error) => {
        console.error('Error renewing contract:', error);
        this.snackBar.open('Error renewing contract', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
      },
    });
  }
}
