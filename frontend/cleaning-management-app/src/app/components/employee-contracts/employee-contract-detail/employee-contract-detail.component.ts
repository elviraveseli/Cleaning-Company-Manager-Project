import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { EmployeeContractService } from '../../../services/employee-contract.service';
import { EmployeeService } from '../../../services/employee.service';
import { EmployeeContract } from '../../../models/employee-contract.model';
import { Employee } from '../../../services/employee.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employee-contract-detail',
  templateUrl: './employee-contract-detail.component.html',
  styleUrls: ['./employee-contract-detail.component.scss'],
})
export class EmployeeContractDetailComponent implements OnInit, OnDestroy {
  contract: EmployeeContract | null = null;
  employee: Employee | null = null;
  isLoading = true;
  error: string | null = null;
  private subscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractService: EmployeeContractService,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.routeConfig?.path;

    if (path === 'employee-contracts/new') {
      // Handle new contract creation
      this.initializeNewContract();
    } else if (path === 'employee-contracts/edit/:id' && id) {
      // Handle edit mode
      this.loadContractForEdit(id);
    } else if (id) {
      // Handle view mode
      this.loadContract();
    } else {
      this.error = 'Invalid route configuration';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadContract(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Contract ID not provided';
      this.isLoading = false;
      return;
    }

    this.subscription = this.contractService.getContract(id).subscribe({
      next: (contract) => {
        this.contract = contract;
        this.loadEmployee(contract.employeeId);
      },
      error: (error) => {
        console.error('Error loading contract:', error);
        this.error = 'Contract not found or could not be loaded';
        this.snackBar.open(this.error, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  private loadEmployee(employeeId: string): void {
    this.employeeService.getEmployee(employeeId).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.error = 'Employee information could not be loaded';
        this.snackBar.open(this.error, 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/employee-contracts']);
  }

  editContract(): void {
    if (this.contract) {
      this.router.navigate(['/employee-contracts/edit', this.contract._id]);
    }
  }

  deleteContract(): void {
    if (!this.contract || !this.employee) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Contract',
        message: `Are you sure you want to permanently delete the contract for ${this.employee.firstName} ${this.employee.lastName}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.contract) {
        this.contractService.deleteContract(this.contract._id).subscribe({
          next: () => {
            this.snackBar.open(
              `Contract for ${this.employee?.firstName} ${this.employee?.lastName} has been deleted successfully`,
              'Close',
              {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              }
            );
            this.router.navigate(['/employee-contracts']);
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

  terminateContract(): void {
    if (!this.contract || !this.employee) return;

    // This could be replaced with a proper dialog component
    const reason = prompt('Enter termination reason:');
    const notes = prompt('Enter additional notes (optional):') || '';

    if (reason) {
      this.contractService
        .terminateContract(this.contract._id, reason, notes)
        .subscribe({
          next: () => {
            this.snackBar.open(`Contract terminated successfully`, 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            });
            // Reload the contract to show updated status
            this.loadContract();
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

  renewContract(): void {
    if (!this.contract || !this.employee) return;

    const endDateStr = prompt(
      'Enter new end date (optional, format: YYYY-MM-DD):'
    );
    let newEndDate: Date | undefined;

    if (endDateStr) {
      newEndDate = new Date(endDateStr);
      if (isNaN(newEndDate.getTime())) {
        this.snackBar.open(
          'Invalid date format. Please use YYYY-MM-DD.',
          'Close',
          {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          }
        );
        return;
      }
    }

    this.contractService
      .renewContract(this.contract._id, newEndDate)
      .subscribe({
        next: () => {
          this.snackBar.open(`Contract renewed successfully`, 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
          // Reload the contract to show updated status
          this.loadContract();
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

  // Helper methods for display
  getEmployeeInitials(): string {
    if (!this.employee) return '';
    return `${this.employee.firstName[0]}${this.employee.lastName[0]}`;
  }

  getContractDuration(): string {
    if (!this.contract) return '';

    const start = new Date(this.contract.startDate);
    const end = this.contract.endDate
      ? new Date(this.contract.endDate)
      : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${months} month${
        months > 1 ? 's' : ''
      }`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
    }
  }

  isProbationActive(): boolean {
    if (!this.contract?.probationPeriod) return false;
    return new Date() <= new Date(this.contract.probationPeriod.endDate);
  }

  downloadDocument(doc: any): void {
    // This would typically handle file download
    this.snackBar.open(`Downloading ${doc.name}...`, 'Close', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  printContract(): void {
    if (!this.contract || !this.employee) {
      this.snackBar.open(
        'Contract or employee information not available',
        'Close',
        {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        }
      );
      return;
    }

    try {
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
      const printContent = this.generatePrintableContract(
        this.contract,
        this.employee
      );

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
          <div class="contract-number">Contract #${contract._id.slice(-8)}</div>
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

  private initializeNewContract(): void {
    // For now, just redirect to list since we don't have a form component
    // In a real app, you'd show a contract creation form
    this.snackBar.open(
      'Contract creation form not implemented yet. Redirecting to list.',
      'Close',
      {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }
    );
    this.router.navigate(['/employee-contracts']);
  }

  private loadContractForEdit(id: string): void {
    // For now, just redirect to view mode
    // In a real app, you'd load the contract in edit mode
    this.snackBar.open(
      'Contract editing form not implemented yet. Showing view mode.',
      'Close',
      {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }
    );
    this.router.navigate(['/employee-contracts', id]);
  }
}
