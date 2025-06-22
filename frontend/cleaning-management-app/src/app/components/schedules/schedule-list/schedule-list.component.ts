import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ScheduleService } from '../../../services/schedule.service';
import { EmployeeService, Employee } from '../../../services/employee.service';
import { ObjectService } from '../../../services/object.service';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { MatDialog } from '@angular/material/dialog';
import { ScheduleDetailComponent } from '../schedule-detail/schedule-detail.component';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Schedule } from '../../../models/schedule.model';

interface Contract {
  _id: string;
  contractNumber?: string;
  customer?: {
    name: string;
    email: string;
    phone: string;
  };
  customerName?: string; // For backward compatibility
  objects?: string[];
  services?: Array<{
    name: string;
    description: string;
    frequency: string;
    price: number;
  }>;
  status?: string;
  totalAmount: number;
  billingFrequency?: string;
}

interface WeekDay {
  name: string;
  shortName: string;
  date: Date;
  isToday: boolean;
  isWeekend: boolean;
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  displayTime: string;
}

interface EmployeeWithAvailability extends Employee {
  isAvailable: boolean;
  currentSchedules: Schedule[];
  totalHoursThisWeek: number;
  profileImage?: string;
}

@Component({
  selector: 'app-schedule-list',
  templateUrl: './schedule-list.component.html',
  styleUrls: ['./schedule-list.component.scss']
})
export class ScheduleListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  schedules: Schedule[] = [];
  employees: EmployeeWithAvailability[] = [];
  rawEmployees: Employee[] = []; // Store raw employee data for reprocessing
  availableEmployees: EmployeeWithAvailability[] = [];
  scheduledEmployees: EmployeeWithAvailability[] = [];
  filteredAvailableEmployees: EmployeeWithAvailability[] = [];
  objects: any[] = [];
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  selectedContract: Contract | null = null;
  selectedEmployee: EmployeeWithAvailability | null = null;

  // Search terms
  employeeSearchTerm: string = '';
  contractSearchTerm: string = '';

  // Calendar properties
  currentWeekStart: Date = new Date();
  weekDays: WeekDay[] = [];
  timeSlots: TimeSlot[] = [];
  
  // UI state
  loading = false;
  viewMode: 'week' | 'day' = 'week';
  selectedDate: Date | null = null;
  showFilters = false;
  
  // Filters
  statusFilter: string = 'All';
  employeeFilter: string = 'All';
  priorityFilter: string = 'All';
  
  // Statistics
  todayStats = {
    totalSchedules: 0,
    completedSchedules: 0,
    inProgressSchedules: 0,
    pendingSchedules: 0
  };

  weekStats = {
    totalRevenue: 0,
    totalHours: 0,
    averageRating: 0,
    completionRate: 0
  };

  // Drag and drop
  employeeListIds = ['available-employees', 'scheduled-employees'];
  contractListIds = ['available-contracts'];

  constructor(
    private scheduleService: ScheduleService,
    private employeeService: EmployeeService,
    private objectService: ObjectService,
    private contractService: CustomerContractService,
    private dialog: MatDialog
  ) {
    this.initializeCalendar();
  }

  ngOnInit() {
    this.loadAllData();
    
    // Set a timeout to ensure loading doesn't hang forever
    setTimeout(() => {
      if (this.loading) {
        console.log('Timeout reached, forcing loading to false');
        this.loading = false;
        this.calculateStats();
      }
    }, 10000); // Increased timeout for API calls
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeCalendar() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    this.currentWeekStart = startOfWeek;

    this.generateWeekDays();
    this.generateTimeSlots();
  }

  generateWeekDays() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    this.weekDays = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);
      const isWeekend = i === 5 || i === 6; // Saturday or Sunday
      
      this.weekDays.push({
        name: days[i],
        shortName: shortDays[i],
        date: date,
        isToday: date.toDateString() === today.toDateString(),
        isWeekend: isWeekend
      });
    }
  }

  generateTimeSlots() {
    this.timeSlots = [];
    // Generate time slots from 6 AM to 11:30 PM (covers most business hours)
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = this.formatTimeForDisplay(hour, minute);
        
        this.timeSlots.push({
          time: timeString,
          hour: hour,
          minute: minute,
          displayTime: displayTime
        });
      }
    }
    
    // Debug: Log the first few time slots to verify
    console.log('Generated time slots (first 10):', this.timeSlots.slice(0, 10));
    console.log('Time slot for 09:00:', this.timeSlots.find(slot => slot.time === '09:00'));
  }

  formatTimeForDisplay(hour: number, minute: number): string {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
  }

  loadAllData() {
    this.loading = true;
    console.log('Starting to load data...');
    
    let loadedCount = 0;
    const totalServices = 4;
    
    const checkIfAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalServices) {
        console.log('All services loaded, calculating stats...');
        console.log('Final schedules:', this.schedules);
        console.log('Final employees:', this.employees);
        
        // Recategorize employees now that schedules are loaded
        this.processEmployeeData(this.rawEmployees);
        this.categorizeEmployees();
        
        // Debug: Show today's schedules
        const today = new Date();
        const todaySchedules = this.schedules.filter(schedule => {
          const scheduleDate = new Date(schedule.scheduledDate);
          return scheduleDate.toDateString() === today.toDateString();
        });
        console.log('Today\'s schedules:', todaySchedules);
        console.log('Available employees:', this.availableEmployees);
        console.log('Scheduled employees:', this.scheduledEmployees);
        
        this.calculateStats();
        this.loading = false;
      }
    };
    
    // Load each service individually to better debug issues
    this.scheduleService.getSchedules().pipe(takeUntil(this.destroy$)).subscribe({
      next: (schedules) => {
        console.log('Schedules loaded:', schedules);
        this.schedules = schedules || [];
        checkIfAllLoaded();
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.schedules = [];
        checkIfAllLoaded();
      }
    });

    this.employeeService.getEmployees().pipe(takeUntil(this.destroy$)).subscribe({
      next: (employees) => {
        console.log('Employees loaded:', employees);
        this.rawEmployees = employees || [];
        this.processEmployeeData(this.rawEmployees);
        this.categorizeEmployees();
        checkIfAllLoaded();
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.rawEmployees = [];
        this.employees = [];
        this.categorizeEmployees();
        checkIfAllLoaded();
      }
    });

    this.objectService.getObjects().pipe(takeUntil(this.destroy$)).subscribe({
      next: (objects) => {
        console.log('Objects loaded:', objects);
        this.objects = objects || [];
        checkIfAllLoaded();
      },
      error: (error) => {
        console.error('Error loading objects:', error);
        this.objects = [];
        checkIfAllLoaded();
      }
    });

    this.contractService.getCustomerContracts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (contracts) => {
        console.log('Contracts loaded:', contracts);
        this.contracts = contracts || [];
        this.filterContracts(); // Initialize filtered contracts
        checkIfAllLoaded();
      },
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.contracts = [];
        this.filterContracts(); // Initialize filtered contracts
        checkIfAllLoaded();
      }
    });
  }

  processEmployeeData(employees: Employee[]) {
    if (!employees || employees.length === 0) {
      console.log('No employees found, using empty array');
      this.employees = [];
      return;
    }
    
    this.employees = employees.map(emp => ({
      ...emp,
      isAvailable: this.isEmployeeAvailable(emp._id),
      currentSchedules: this.getEmployeeSchedules(emp._id),
      totalHoursThisWeek: this.calculateEmployeeWeeklyHours(emp._id),
      profileImage: undefined // Add this since we check for it in template
    }));
  }

  categorizeEmployees() {
    console.log('Categorizing employees:', this.employees);
    this.availableEmployees = this.employees.filter(emp => emp.isAvailable);
    this.scheduledEmployees = this.employees.filter(emp => !emp.isAvailable);
    console.log('Available employees after categorization:', this.availableEmployees);
    console.log('Scheduled employees after categorization:', this.scheduledEmployees);
    
    // Initialize filtered arrays
    this.filterEmployees();
  }

  filterEmployees() {
    if (!this.employeeSearchTerm.trim()) {
      this.filteredAvailableEmployees = [...this.availableEmployees];
    } else {
      const searchTerm = this.employeeSearchTerm.toLowerCase().trim();
      this.filteredAvailableEmployees = this.availableEmployees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm) ||
        emp.lastName.toLowerCase().includes(searchTerm) ||
        emp.position.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm)
      );
    }
  }

  filterContracts() {
    if (!this.contractSearchTerm.trim()) {
      this.filteredContracts = [...this.contracts];
    } else {
      const searchTerm = this.contractSearchTerm.toLowerCase().trim();
      this.filteredContracts = this.contracts.filter(contract =>
        (contract.customer?.name || contract.customerName || '').toLowerCase().includes(searchTerm) ||
        (contract.contractNumber || '').toLowerCase().includes(searchTerm) ||
        (contract._id || '').toLowerCase().includes(searchTerm) ||
        (contract.customer?.email || '').toLowerCase().includes(searchTerm)
      );
    }
  }

  isEmployeeAvailable(employeeId: string): boolean {
    const currentTime = new Date();
    const employeeSchedules = this.schedules.filter(schedule => {
      // Handle the union type for employees
      const hasEmployee = schedule.employees.some(emp => {
        const empId = typeof emp.employee === 'string' ? emp.employee : emp.employee._id;
        return empId === employeeId;
      });
      
      return hasEmployee &&
        new Date(schedule.scheduledDate).toDateString() === currentTime.toDateString();
    });
    
    console.log(`Employee ${employeeId} has ${employeeSchedules.length} schedules today, available: ${employeeSchedules.length === 0}`);
    return employeeSchedules.length === 0;
  }

  getEmployeeSchedules(employeeId: string): Schedule[] {
    return this.schedules.filter(schedule =>
      schedule.employees.some(emp => {
        const empId = typeof emp.employee === 'string' ? emp.employee : emp.employee._id;
        return empId === employeeId;
      })
    );
  }

  calculateEmployeeWeeklyHours(employeeId: string): number {
    const weekStart = this.currentWeekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    return this.schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.scheduledDate);
        const hasEmployee = schedule.employees.some(emp => {
          const empId = typeof emp.employee === 'string' ? emp.employee : emp.employee._id;
          return empId === employeeId;
        });
        return hasEmployee && scheduleDate >= weekStart && scheduleDate < weekEnd;
      })
      .reduce((total, schedule) => {
        const duration = schedule.estimatedDuration || 2; // Default 2 hours
        return total + duration;
      }, 0);
  }

  calculateStats() {
    console.log('Calculating stats with schedules:', this.schedules);
    
    if (!this.schedules || this.schedules.length === 0) {
      console.log('No schedules found, setting stats to 0');
      this.todayStats = {
        totalSchedules: 0,
        completedSchedules: 0,
        inProgressSchedules: 0,
        pendingSchedules: 0
      };
      this.weekStats = {
        totalRevenue: 0,
        totalHours: 0,
        averageRating: 0,
        completionRate: 0
      };
      return;
    }

    const today = new Date();
    const todaySchedules = this.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      return scheduleDate.toDateString() === today.toDateString();
    });

    this.todayStats = {
      totalSchedules: todaySchedules.length,
      completedSchedules: todaySchedules.filter(s => s.status === 'Completed').length,
      inProgressSchedules: todaySchedules.filter(s => s.status === 'In Progress').length,
      pendingSchedules: todaySchedules.filter(s => s.status === 'Scheduled').length
    };

    // Week stats calculation
    const weekStart = this.currentWeekStart;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekSchedules = this.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      return scheduleDate >= weekStart && scheduleDate < weekEnd;
    });

    this.weekStats = {
      totalRevenue: this.calculateWeekRevenue(weekSchedules),
      totalHours: weekSchedules.reduce((total, s) => total + (s.estimatedDuration || 2), 0),
      averageRating: 4.5, // Mock data
      completionRate: weekSchedules.length ? 
        (weekSchedules.filter(s => s.status === 'Completed').length / weekSchedules.length) * 100 : 0
    };

    console.log('Stats calculated:', this.todayStats, this.weekStats);
  }

  calculateWeekRevenue(schedules: Schedule[]): number {
    // Mock calculation - in real app, you'd calculate based on contract rates
    return schedules.length * 150; // Average $150 per schedule
  }

  getCurrentWeekRange(): string {
    const start = this.weekDays[0]?.date;
    const end = this.weekDays[6]?.date;
    if (!start || !end) return '';
    
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  }

  previousWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    this.calculateStats();
  }

  nextWeek() {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.calculateStats();
  }

  goToToday() {
    this.initializeCalendar();
    this.calculateStats();
  }

  hasEventAt(dayIndex: number, timeIndex: number): boolean {
    return this.getEventsAt(dayIndex, timeIndex).length > 0;
  }

  getEventsAt(dayIndex: number, timeIndex: number): Schedule[] {
    const targetDate = this.weekDays[dayIndex]?.date;
    const targetTime = this.timeSlots[timeIndex]?.time;
    
    if (!targetDate || !targetTime) return [];

    const matchingSchedules = this.schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledDate);
      const isSameDay = scheduleDate.toDateString() === targetDate.toDateString();
      const isSameTime = schedule.startTime === targetTime;
      
      // Debug logging for time mismatches
      if (schedule.startTime === '09:00' || (typeof schedule.object === 'object' && schedule.object?.name?.includes('Medical'))) {
        const objectName = typeof schedule.object === 'string' ? schedule.object : schedule.object?.name || 'Unknown';
        console.log(`Debug schedule "${objectName}" (${schedule.startTime}) - dayIndex: ${dayIndex}, timeIndex: ${timeIndex}`);
        console.log(`Target time: ${targetTime}, Schedule time: ${schedule.startTime}`);
        console.log(`Same day: ${isSameDay}, Same time: ${isSameTime}`);
        console.log(`Schedule date: ${scheduleDate.toDateString()}, Target date: ${targetDate.toDateString()}`);
      }
      
      return isSameDay && isSameTime;
    });

    return matchingSchedules;
  }

  getEventColor(status: string): string {
    const colors = {
      'Scheduled': '#4CAF50',
      'In Progress': '#FF9800',
      'Completed': '#2196F3',
      'Cancelled': '#F44336',
      'No Show': '#9E9E9E',
      'Pending': '#FFC107'
    };
    return colors[status as keyof typeof colors] || '#4CAF50';
  }

  getPriorityColor(priority?: string): string {
    const colors = {
      'Low': '#4CAF50',
      'Medium': '#FF9800',
      'High': '#FF5722',
      'Critical': '#F44336'
    };
    return colors[priority as keyof typeof colors] || '#4CAF50';
  }

  createScheduleAt(dayIndex: number, timeIndex: number) {
    const targetDate = this.weekDays[dayIndex]?.date;
    const targetTime = this.timeSlots[timeIndex]?.time;
    
    if (!targetDate || !targetTime) return;

    const newSchedule = {
      scheduledDate: targetDate.toISOString(),
      startTime: targetTime,
      endTime: this.getEndTime(targetTime, 2),
      priority: 'Medium' as const,
      status: 'Scheduled'
    };

    this.openScheduleDetail(newSchedule);
  }

  getEndTime(startTime: string, durationHours: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + durationHours;
    return `${endHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  onEmployeeDrop(event: CdkDragDrop<EmployeeWithAvailability[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    
    // Update filtered arrays after drag and drop
    this.filterEmployees();
  }

  showContractDetails(contract: Contract) {
    this.selectedContract = contract;
  }

  closeContractDetails() {
    this.selectedContract = null;
  }

  showEmployeeDetails(employee: EmployeeWithAvailability) {
    this.selectedEmployee = employee;
  }

  closeEmployeeDetails() {
    this.selectedEmployee = null;
  }

  scheduleContract(contract: Contract) {
    const newSchedule = {
      customerContract: contract._id,
      status: 'Scheduled',
      priority: 'Medium' as const
    };
    this.openScheduleDetail(newSchedule);
    this.closeContractDetails();
  }

  quickScheduleEmployee(employee: EmployeeWithAvailability) {
    const today = new Date();
    const newSchedule = {
      scheduledDate: today.toISOString(),
      startTime: '09:00',
      endTime: '17:00',
      employees: [{ employee: { _id: employee._id, name: `${employee.firstName} ${employee.lastName}` } }],
      status: 'Scheduled',
      priority: 'Medium' as const
    };
    this.openScheduleDetail(newSchedule);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  applyFilters() {
    // Implement filtering logic
    this.loadAllData();
  }

  clearFilters() {
    this.statusFilter = 'All';
    this.employeeFilter = 'All';
    this.priorityFilter = 'All';
    this.loadAllData();
  }

  openScheduleDetail(schedule?: any) {
    // Convert the schedule employee structure to match the employee service structure
    let processedSchedule = schedule || {};
    if (schedule && schedule.employees) {
      processedSchedule = {
        ...schedule,
        employees: schedule.employees.map((emp: any) => {
          // Find the full employee data from our employees array
          const fullEmployee = this.employees.find(e => e._id === emp.employee._id);
          return fullEmployee || emp.employee;
        })
      };
    }

    const dialogRef = this.dialog.open(ScheduleDetailComponent, {
      width: '900px',
      maxHeight: '90vh',
      data: {
        schedule: processedSchedule,
        employees: this.employees, // Pass the full employee list for selection
        objects: this.objects,
        contracts: this.contracts
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAllData();
      }
    });
  }

  exportSchedules() {
    // Implement export functionality
    console.log('Exporting schedules...');
  }

  refreshData() {
    console.log('Refreshing all data...');
    // Clear search terms
    this.employeeSearchTerm = '';
    this.contractSearchTerm = '';
    
    this.clearAllLocalStorage();
    this.loadAllData();
  }

  private clearAllLocalStorage() {
    localStorage.removeItem('cleaning_employees');
    localStorage.removeItem('cleaning_customer_contracts');
    localStorage.removeItem('cleaning_objects');
    console.log('Cleared all localStorage data');
  }

  getEmployeeName(emp: any): string {
    // Handle different employee data structures
    if (emp.employee) {
      const employee = emp.employee;
      if (employee.firstName && employee.lastName) {
        return `${employee.firstName} ${employee.lastName}`;
      } else if (employee.name) {
        return employee.name;
      }
    } else if (emp.firstName && emp.lastName) {
      return `${emp.firstName} ${emp.lastName}`;
    } else if (emp.name) {
      return emp.name;
    }
    return 'Unknown Employee';
  }

  // Helper method to safely get object name from union types
  getObjectName(obj: string | any): string {
    if (typeof obj === 'string') {
      return obj;
    } else if (obj && obj.name) {
      return obj.name;
    }
    return 'Unknown Location';
  }
}
