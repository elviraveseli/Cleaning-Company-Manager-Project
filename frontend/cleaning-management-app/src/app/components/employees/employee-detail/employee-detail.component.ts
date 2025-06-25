import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeService, Employee } from '../../../services/employee.service';
import { ConfirmDialogComponent } from '../../../components/shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(id);
    }
  }

  loadEmployee(id: string): void {
    this.isLoading = true;
    this.employeeService.getEmployee(id).subscribe({
      next: (employee) => {
        this.employee = employee;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading employee:', error);
        this.snackBar.open('Error loading employee details', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.isLoading = false;
        this.goBack();
      }
    });
  }

  editEmployee(): void {
    if (this.employee) {
      this.router.navigate(['/employees/edit', this.employee._id]);
    }
  }

  deleteEmployee(): void {
    if (!this.employee) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Employee',
        message: `Are you sure you want to permanently delete ${this.employee.firstName} ${this.employee.lastName}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.employee) {
        this.employeeService.deleteEmployee(this.employee._id).subscribe({
          next: () => {
            this.snackBar.open(`${this.employee!.firstName} ${this.employee!.lastName} has been deleted successfully`, 'Close', {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.goBack();
          },
          error: (error) => {
            console.error('Error deleting employee:', error);
            this.snackBar.open('Error deleting employee. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/employees']);
  }

  // Helper method to calculate total weekly hours
  getTotalWeeklyHours(): number {
    if (!this.employee?.workingDays) return 0;
    
    return this.employee.workingDays.reduce((total, day) => {
      return total + (day.duration || 0);
    }, 0);
  }

  // Helper method to format working days for display
  getFormattedWorkingDays(): string {
    if (!this.employee?.workingDays || this.employee.workingDays.length === 0) {
      return 'No working days set';
    }

    return this.employee.workingDays.map(day => 
      `${day.day}: ${day.from} - ${day.to} (${day.duration || 0}h)`
    ).join(', ');
  }
}
