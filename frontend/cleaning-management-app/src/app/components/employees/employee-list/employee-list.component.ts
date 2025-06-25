import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { EmployeeService, Employee } from '../../../services/employee.service';
import { ConfirmDialogComponent } from '../../../components/shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'name',
    'position',
    'email',
    'phone',
    'status',
    'actions',
  ];
  dataSource: MatTableDataSource<Employee>;
  isLoading = true;
  searchTerm = '';
  private employeesSubscription?: Subscription;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.dataSource = new MatTableDataSource<Employee>();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.subscribeToEmployeeUpdates();
  }

  ngOnDestroy(): void {
    if (this.employeesSubscription) {
      this.employeesSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.firstName + ' ' + item.lastName;
        default:
          return (item as any)[property];
      }
    };
  }

  private subscribeToEmployeeUpdates(): void {
    // Subscribe to employee updates from the service
    this.employeesSubscription = this.employeeService.employees$.subscribe(
      (employees) => {
        this.updateDataSource(employees);
        this.isLoading = false;
      }
    );
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.updateDataSource(employees);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Error loading employees', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
        });
        this.isLoading = false;
      },
    });
  }

  refreshEmployees(): void {
    this.loadEmployees();
  }

  private updateDataSource(employees: Employee[]): void {
    console.log('Updating data source with employees:', employees);
    console.log('Displayed columns:', this.displayedColumns);
    this.dataSource.data = employees;
    this.applyFilter(this.searchTerm);
  }

  applyFilter(filterValue: string): void {
    this.searchTerm = filterValue;
    filterValue = filterValue.trim().toLowerCase();
    this.dataSource.filterPredicate = (data: Employee, filter: string) => {
      const searchStr =
        `${data.firstName} ${data.lastName} ${data.email} ${data.position} ${data.status}`.toLowerCase();
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

  addEmployee(): void {
    this.router.navigate(['/employees/new']);
  }

  viewEmployee(employee: Employee): void {
    this.router.navigate(['/employees', employee._id]);
  }

  editEmployee(employee: Employee): void {
    this.router.navigate(['/employees/edit', employee._id]);
  }

  deleteEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to permanently delete ${employee.firstName} ${employee.lastName}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.employeeService.deleteEmployee(employee._id).subscribe({
          next: () => {
            this.snackBar.open(
              `${employee.firstName} ${employee.lastName} has been deleted successfully`,
              'Close',
              {
                duration: 4000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
              }
            );
            // The data will be automatically updated through the subscription
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            this.snackBar.open(
              'Error deleting employee. Please try again.',
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Inactive':
        return 'red';
      case 'On Leave':
        return 'orange';
      default:
        return 'gray';
    }
  }

  getStatusIcon(status: string): string {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'check_circle';
      case 'inactive':
        return 'cancel';
      case 'on leave':
        return 'event_busy';
      case 'pending':
        return 'schedule';
      default:
        return 'help_outline';
    }
  }

  // Helper method to get total number of employees
  getTotalEmployees(): number {
    return this.dataSource.data.length;
  }

  // Helper method to get active employees count
  getActiveEmployees(): number {
    return this.dataSource.data.filter((emp) => emp.status === 'Active').length;
  }

  // Export employees to CSV
  exportEmployees(): void {
    const employees = this.dataSource.data;
    if (employees.length === 0) {
      this.snackBar.open('No employees to export', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
      return;
    }

    const csvContent = this.convertToCSV(employees);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `employees-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    this.snackBar.open('Employees exported successfully', 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  private convertToCSV(employees: Employee[]): string {
    const headers = [
      'ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Position',
      'Department',
      'Status',
      'Employment Type',
      'Hire Date',
      'Hourly Rate',
      'Address',
      'City',
      'State',
      'Zip Code',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Skills',
      'Certifications',
      'Languages',
      'Availability',
    ];

    const csvRows = [headers.join(',')];

    employees.forEach((employee) => {
      const row = [
        employee._id || '',
        this.escapeCSV(employee.firstName),
        this.escapeCSV(employee.lastName),
        this.escapeCSV(employee.email),
        this.escapeCSV(employee.phone),
        this.escapeCSV(employee.position),
        this.escapeCSV(employee.department || ''),
        this.escapeCSV(employee.status),
        this.escapeCSV(employee.employmentType || ''),
        employee.hireDate
          ? new Date(employee.hireDate).toLocaleDateString()
          : '',
        employee.hourlyRate || '',
        this.escapeCSV(employee.address || ''),
        this.escapeCSV(employee.city || ''),
        this.escapeCSV(employee.municipality || ''),
        this.escapeCSV(employee.emergencyContact?.name || ''),
        this.escapeCSV(employee.emergencyContact?.phone || ''),
        this.escapeCSV(employee.skills?.join('; ') || ''),
        this.escapeCSV(employee.certifications?.join('; ') || ''),
        this.escapeCSV(employee.languages?.join('; ') || ''),
        this.escapeCSV(employee.availability || ''),
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
