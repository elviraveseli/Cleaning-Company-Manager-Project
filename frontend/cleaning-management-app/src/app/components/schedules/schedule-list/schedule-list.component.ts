import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { ScheduleService } from '../../../services/schedule.service';
import { EmployeeService, Employee } from '../../../services/employee.service';
import { ObjectService } from '../../../services/object.service';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleDetailComponent } from '../schedule-detail/schedule-detail.component';
import { Schedule, ScheduleStatus, SchedulePriority, CleaningType } from '../../../models/schedule.model';
import { CustomerContract } from '../../../models/customer-contract.model';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-schedule-list',
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.scss'],
})
export class ScheduleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  schedules: Schedule[] = [];
  employees: Employee[] = [];
  contracts: CustomerContract[] = [];
  filteredSchedules: Schedule[] = [];
  
  // UI state properties
  loading = true;
  totalSchedules = 0;
  currentPage = 1;
  pageSize = 10;
  
  // Filter properties
  filterForm = new FormGroup({
    status: new FormControl<string | null>(null),
    priority: new FormControl<string | null>(null),
    cleaningType: new FormControl<string | null>(null),
    dateFrom: new FormControl<Date | null>(null),
    dateTo: new FormControl<Date | null>(null),
    searchTerm: new FormControl('')
  });
  
  // Dropdown options
  statusOptions: ScheduleStatus[] = ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'No Show'];
  priorityOptions: SchedulePriority[] = ['Low', 'Medium', 'High', 'Critical'];
  cleaningTypeOptions: CleaningType[] = ['Regular', 'Deep Clean', 'Move-in/Move-out', 'Emergency', 'Special Event'];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private scheduleService: ScheduleService,
    private employeeService: EmployeeService,
    private objectService: ObjectService,
    private contractService: CustomerContractService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadData();
    
    // Subscribe to filter changes
    this.filterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  // Stats methods
  getTodaySchedulesCount(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      scheduleDate.setHours(0, 0, 0, 0);
      return scheduleDate.getTime() === today.getTime();
    }).length;
  }

  getPendingSchedulesCount(): number {
    return this.schedules.filter(schedule => 
      schedule.status === 'Scheduled' || schedule.status === 'In Progress'
    ).length;
  }

  getCompletedSchedulesCount(): number {
    return this.schedules.filter(schedule => schedule.status === 'Completed').length;
  }

  // Icon methods
  getStatusIcon(status: string): string {
    switch (status) {
      case 'Scheduled': return 'event';
      case 'In Progress': return 'engineering';
      case 'Completed': return 'check_circle';
      case 'Cancelled': return 'cancel';
      case 'No Show': return 'person_off';
      default: return 'help';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'Low': return 'low_priority';
      case 'Medium': return 'drag_handle';
      case 'High': return 'priority_high';
      case 'Critical': return 'error';
      default: return 'help';
    }
  }

  // Employee list formatting
  getEmployeeList(schedule: Schedule): { name: string; role: string; }[] {
    if (!schedule.employees || schedule.employees.length === 0) {
      return [];
    }
    
    return schedule.employees.map(assignment => {
      let name = 'Unknown';
      
      if (typeof assignment.employee === 'object' && assignment.employee !== null) {
        const firstName = assignment.employee.firstName || '';
        const lastName = assignment.employee.lastName || '';
        if (firstName || lastName) {
          name = `${firstName} ${lastName}`;
        }
      } else if (typeof assignment.employee === 'string') {
        const employeeId = assignment.employee;
        const employeeObj = this.employees.find(e => e._id === employeeId);
        if (employeeObj) {
          name = `${employeeObj.firstName} ${employeeObj.lastName}`;
        }
      }
      
      return {
        name,
        role: assignment.role
      };
    });
  }

  // Status update
  updateStatus(scheduleId: string, newStatus: ScheduleStatus) {
    const schedule = this.schedules.find(s => s._id === scheduleId);
    if (!schedule) return;

    const updatedSchedule = { ...schedule, status: newStatus };
    this.scheduleService.updateSchedule(updatedSchedule)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Status updated to ${newStatus}`, 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
          this.loadData();
        },
        error: (error: Error) => {
          this.snackBar.open(`Error updating status: ${error.message}`, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      });
  }

  // Existing methods with updates
  loadData() {
    this.loading = true;
    
    combineLatest([
      this.scheduleService.getSchedules(this.currentPage, this.pageSize),
      this.employeeService.getEmployees(),
      this.contractService.getContracts()
    ])
    .pipe(
      takeUntil(this.destroy$),
      catchError(error => {
        this.snackBar.open('Error loading data: ' + error.message, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        this.loading = false;
        throw error;
      })
    )
    .subscribe(([scheduleResponse, employees, contracts]) => {
      this.schedules = scheduleResponse.schedules;
      this.filteredSchedules = [...this.schedules];
      this.totalSchedules = scheduleResponse.totalSchedules;
      this.employees = employees;
      this.contracts = contracts;
      this.loading = false;
      this.applyFilters();
    });
  }

  openScheduleDialog(schedule?: Schedule, event?: MouseEvent) {
    // Stop event propagation to prevent row click when clicking action buttons
    if (event) {
      event.stopPropagation();
    }

    const dialogRef = this.dialog.open(ScheduleDetailComponent, {
      width: '800px',
      data: {
        schedule: schedule ? { ...schedule } : {},
        employees: this.employees,
        contracts: this.contracts,
        isEdit: !!schedule
      },
      disableClose: true,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      // Only reload data if the dialog was closed with true (indicating a successful save)
      if (result === true) {
        this.loadData();
      }
    });
  }

  deleteSchedule(id: string | undefined, event?: MouseEvent) {
    // Stop event propagation to prevent row click
    if (event) {
      event.stopPropagation();
    }

    if (!id) {
      this.snackBar.open('Invalid schedule ID', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });
      return;
    }
    
    if (confirm('Are you sure you want to delete this schedule?')) {
      this.scheduleService.deleteSchedule(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Schedule deleted successfully', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
            this.loadData();
          },
          error: (error: Error) => {
            this.snackBar.open('Error deleting schedule: ' + error.message, 'Close', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            });
          }
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters() {
    const filters = this.filterForm.value;
    
    this.filteredSchedules = this.schedules.filter(schedule => {
      // Status filter
      if (filters.status && schedule.status !== filters.status) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && schedule.priority !== filters.priority) {
        return false;
      }
      
      // Date range filter
      const scheduleDate = new Date(schedule.scheduledDate);
      if (filters.dateFrom && scheduleDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && scheduleDate > filters.dateTo) {
        return false;
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        const customerName = typeof schedule.customerContract === 'object' && schedule.customerContract?.customer?.name.toLowerCase();
        const objectName = typeof schedule.object === 'object' && schedule.object?.name.toLowerCase();
        const employeeNames = this.getEmployeeList(schedule)
          .map(emp => emp.name.toLowerCase())
          .join(' ');
        
        return (customerName && customerName.includes(searchTerm)) || 
               (objectName && objectName.includes(searchTerm)) ||
               employeeNames.includes(searchTerm);
      }
      
      return true;
    });
  }

  resetFilters() {
    this.filterForm.reset();
    this.filteredSchedules = [...this.schedules];
  }

  getCustomerName(schedule: Schedule): string {
    if (typeof schedule.customerContract === 'object' && schedule.customerContract?.customer) {
      return schedule.customerContract.customer.name;
    }
    return 'No customer assigned';
  }

  getLocationName(schedule: Schedule): string {
    if (typeof schedule.object === 'object') {
      return `${schedule.object.name}${schedule.object.address?.city ? `, ${schedule.object.address.city}` : ''}`;
    }
    return 'No location assigned';
  }

  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }
}
