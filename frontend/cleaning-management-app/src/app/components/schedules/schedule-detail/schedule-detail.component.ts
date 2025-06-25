import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormControl,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScheduleService } from '../../../services/schedule.service';
import { CustomerContractService } from '../../../services/customer-contract.service';
import { EmployeeService, Employee } from '../../../services/employee.service';
import { ObjectService } from '../../../services/object.service';
import {
  Schedule,
  ScheduleStatus,
  SchedulePriority,
  CleaningType,
  ObjectInfo,
  EmployeeAssignment
} from '../../../models/schedule.model';
import {
  CustomerContract,
  ObjectOption,
} from '../../../models/customer-contract.model';
import { ObjectLocation } from '../../../models/object.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-schedule-detail',
  templateUrl: './schedule-detail.component.html',
  styleUrls: ['./schedule-detail.component.scss'],
})
export class ScheduleDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  scheduleForm!: FormGroup;
  isEdit: boolean = false;
  loading = false;
  submitting = false;

  // Dropdown options
  statusOptions: ScheduleStatus[] = [
    'Scheduled',
    'In Progress',
    'Completed',
    'Cancelled',
    'No Show',
  ];
  priorityOptions: SchedulePriority[] = ['Low', 'Medium', 'High', 'Critical'];
  cleaningTypeOptions: CleaningType[] = [
    'Regular',
    'Deep Clean',
    'Move-in/Move-out',
    'Emergency',
    'Special Event',
  ];

  // Data from parent component
  employees: Employee[] = [];
  contracts: CustomerContract[] = [];
  filteredEmployees: Employee[] = [];
  filteredContracts: CustomerContract[] = [];

  // Selected data
  selectedContract: CustomerContract | null = null;
  selectedObject: ObjectOption | null = null;
  objectOptions: ObjectOption[] = [];
  allObjects: ObjectLocation[] = [];

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private contractService: CustomerContractService,
    private employeeService: EmployeeService,
    private objectService: ObjectService,
    private dialogRef: MatDialogRef<ScheduleDetailComponent>,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data.schedule?._id;
    this.employees = data.employees || [];
    this.contracts = data.contracts || [];
    this.filteredEmployees = [...this.employees];
    this.filteredContracts = [...this.contracts];
  }

  ngOnInit() {
    this.initForm();
    
    // Load all objects at component initialization
    this.loadAllObjects();

    if (this.isEdit && this.data.schedule) {
      this.populateForm(this.data.schedule);
    }
  }
  
  loadAllObjects() {
    this.loading = true;
    this.objectService.getObjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (objects: ObjectLocation[]) => {
          console.log('All objects loaded at init:', objects.length);
          this.allObjects = objects;
          this.loading = false;
        },
        error: (error: Error) => {
          console.error('Error loading objects:', error);
          this.loading = false;
          
          // If API fails, create some mock objects for testing
          this.createMockObjects();
        }
      });
  }
  
  createMockObjects() {
    console.log('Creating mock objects for testing');
    this.allObjects = [
      {
        _id: 'obj1',
        customerId: 'cust1',
        name: 'Office Building A',
        type: 'Office',
        address: {
          street: '123 Main St',
          city: 'New York',
          municipality: 'Manhattan',
          country: 'USA'
        },
        contactPerson: {
          name: 'John Doe',
          phone: '123-456-7890'
        },
        floors: 5,
        rooms: 20,
        specialRequirements: ['Eco-friendly Products'],
        cleaningFrequency: 'Weekly',
        estimatedCleaningTime: 4,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'obj2',
        customerId: 'cust1',
        name: 'Residential Complex B',
        type: 'Residential',
        address: {
          street: '456 Park Ave',
          city: 'New York',
          municipality: 'Brooklyn',
          country: 'USA'
        },
        contactPerson: {
          name: 'Jane Smith',
          phone: '987-654-3210'
        },
        floors: 3,
        rooms: 15,
        specialRequirements: ['24/7 Access'],
        cleaningFrequency: 'Bi-weekly',
        estimatedCleaningTime: 3,
        status: 'Active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  initForm() {
    this.scheduleForm = this.fb.group({
      _id: [null],
      scheduledDate: [new Date(), Validators.required],
      startTime: ['08:00', [
        Validators.required,
        Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
      ]],
      endTime: ['16:00', [
        Validators.required,
        Validators.pattern('^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$')
      ]],
      customerContractId: ['', Validators.required],
      objectId: ['', Validators.required],
      employees: this.fb.array(
        [],
        [Validators.required, Validators.maxLength(2)]
      ),
      status: ['Scheduled', Validators.required],
      priority: ['Medium', Validators.required],
      cleaningType: ['Regular', Validators.required],
      notes: [''],
      tasks: this.fb.array([]),
    });

    // Add default task
    this.addTask();

    // Subscribe to contract changes
    this.scheduleForm
      .get('customerContractId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((contractId) => {
        if (contractId) {
          this.onContractChange(contractId);
        }
      });

    // Add time validation
    this.scheduleForm.get('endTime')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(endTime => {
        const startTime = this.scheduleForm.get('startTime')?.value;
        if (startTime && endTime) {
          const start = this.timeToMinutes(startTime);
          const end = this.timeToMinutes(endTime);
          if (end <= start) {
            this.scheduleForm.get('endTime')?.setErrors({ invalidEndTime: true });
          }
        }
      });
  }

  populateForm(schedule: Schedule) {
    console.log('Populating form with schedule:', schedule);
    
    // Load all objects first to ensure we have locations available
    this.loadAllObjects();
    
    // Find the contract and set it
    if (schedule.customerContract) {
      const contractId =
        typeof schedule.customerContract === 'object'
          ? schedule.customerContract._id
          : schedule.customerContract;

      console.log('Setting contract ID:', contractId);
      
      // First load all objects, then trigger contract change
      this.objectService.getObjects().subscribe((objects: ObjectLocation[]) => {
        console.log('Loaded all objects for edit:', objects.length);
        this.allObjects = objects;
        
        // Now that we have objects, trigger contract change and set object ID
        this.onContractChange(contractId);
        
        const objectId = typeof schedule.object === 'object' ? schedule.object._id : schedule.object;
        console.log('Setting object ID:', objectId);
        this.scheduleForm.get('objectId')?.setValue(objectId);
      });
    }

    // Set basic form values
    this.scheduleForm.patchValue({
      _id: schedule._id,
      scheduledDate: new Date(schedule.scheduledDate),
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      customerContractId:
        typeof schedule.customerContract === 'object'
          ? schedule.customerContract._id
          : schedule.customerContract,
      status: schedule.status,
      priority: schedule.priority,
      cleaningType: schedule.cleaningType,
      notes: schedule.notes
    });

    // Clear and repopulate employees array
    while (this.employeesArray.length) {
      this.employeesArray.removeAt(0);
    }

    if (schedule.employees && schedule.employees.length > 0) {
      schedule.employees.forEach((emp) => {
        const employeeId = typeof emp.employee === 'object' ? emp.employee._id : emp.employee;
        this.employeesArray.push(
          this.fb.group({
            employee: [employeeId, Validators.required],
            role: [emp.role, Validators.required]
          })
        );
      });
    }

    // Clear and repopulate tasks array
    while (this.tasksArray.length) {
      this.tasksArray.removeAt(0);
    }

    if (schedule.tasks && schedule.tasks.length > 0) {
      schedule.tasks.forEach((task) => {
        this.tasksArray.push(
          this.fb.group({
            name: [task.name, Validators.required],
            description: [task.description, Validators.required],
            completed: [task.completed]
          })
        );
      });
    }
  }

  onContractChange(contractId: string) {
    console.log('Contract changed to:', contractId);
    const contract = this.contracts.find((c) => c._id === contractId);
    if (contract) {
      this.selectedContract = contract;
      console.log('Selected contract full data:', contract);
      
      // Clear and reset object selection
      this.scheduleForm.get('objectId')?.setValue('');
      
      this.loading = true;
      
      // Get all objects and filter by either objects array or objectId
      this.objectService.getObjects().subscribe({
        next: (objects) => {
          // First try to get objects from the objects array
          let contractObjects: ObjectLocation[] = [];
          if (contract.objects && contract.objects.length > 0) {
            contractObjects = objects.filter(obj => contract.objects.includes(obj._id));
          }
          // If no objects in array, try to get the object from objectId
          if (contractObjects.length === 0 && contract.objectId) {
            console.log('Looking for object with ID:', contract.objectId);
            const singleObject = objects.find(obj => obj._id === contract.objectId);
            if (singleObject) {
              console.log('Found object:', singleObject);
              contractObjects = [singleObject];
            } else {
              console.log('No object found with ID:', contract.objectId);
            }
          }
          
          // Map the objects to the correct format
          this.objectOptions = contractObjects.map(obj => ({
            _id: obj._id,
            name: obj.name,
            address: obj.address || {},
            type: obj.type
          }));
          
          console.log('Final objectOptions:', this.objectOptions);
          
          if (this.objectOptions.length === 0) {
            this.snackBar.open('No locations found for this contract. Please select a different contract.', 'Close', { duration: 5000 });
          }
          // If there's only one object, select it automatically
          else if (this.objectOptions.length === 1) {
            this.scheduleForm.get('objectId')?.setValue(this.objectOptions[0]._id);
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading objects:', error);
          this.snackBar.open('Error loading locations', 'Close', { duration: 5000 });
          this.loading = false;
          this.objectOptions = [];
        }
      });
    } else {
      this.objectOptions = [];
      this.snackBar.open('Selected contract not found', 'Close', { duration: 5000 });
    }
  }

  // Getters for form arrays
  get employeesArray() {
    return this.scheduleForm.get('employees') as FormArray;
  }

  get tasksArray() {
    return this.scheduleForm.get('tasks') as FormArray;
  }

  addEmployee() {
    if (this.employeesArray.length < 2) {
      this.employeesArray.push(
        this.fb.group({
          employee: ['', Validators.required],
          role: ['Primary', Validators.required], // Using valid enum value: Primary, Secondary, or Supervisor
        })
      );
    } else {
      this.snackBar.open(
        'Maximum of 2 employees allowed per schedule',
        'Close',
        {
          duration: 3000,
        }
      );
    }
  }

  removeEmployee(index: number) {
    this.employeesArray.removeAt(index);
  }

  addTask() {
    this.tasksArray.push(
      this.fb.group({
        name: ['', Validators.required], // Required field for backend
        description: ['', Validators.required],
        completed: [false],
      })
    );
  }

  removeTask(index: number) {
    this.tasksArray.removeAt(index);
  }

// ... (rest of the code remains the same)
  filterEmployees(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredEmployees = this.employees.filter(
      (employee) =>
        `${employee.firstName} ${employee.lastName}`
          .toLowerCase()
          .includes(searchTerm) ||
        employee.position.toLowerCase().includes(searchTerm)
    );
  }

  filterContracts(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredContracts = this.contracts.filter(
      (contract) =>
        contract.customer.name.toLowerCase().includes(searchTerm) ||
        contract.contractNumber.toLowerCase().includes(searchTerm)
    );
  }

  getEmployeeName(employeeId: string): string {
    const employee = this.employees.find((e) => e._id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }

  getContractName(contractId: string): string {
    const contract = this.contracts.find((c) => c._id === contractId);
    return contract
      ? `${contract.customer.name} - ${contract.contractNumber}`
      : 'Unknown';
  }

  getObjectName(objectId: string): string {
    const object = this.objectOptions.find(o => o._id === objectId);
    if (object) {
      return `${object.name} - ${object.address.street || ''}, ${object.address.city || ''}`;
    }
    return 'Unknown';
  }

  onSubmit() {
    if (this.scheduleForm.invalid) {
      this.markFormGroupTouched(this.scheduleForm);
      return;
    }

    this.submitting = true;
    const formValue = this.scheduleForm.value;
    
    try {
      // Create a clean schedule object with only the required fields
      const schedule: any = {};
      
      // Only include _id if it exists and we're editing
      if (this.isEdit && formValue._id) {
        schedule._id = formValue._id;
      }
      
      // Basic required fields
      schedule.scheduledDate = formValue.scheduledDate;
      schedule.startTime = formValue.startTime;
      schedule.endTime = formValue.endTime;
      schedule.status = formValue.status;
      schedule.priority = formValue.priority;
      schedule.cleaningType = formValue.cleaningType;
      
      // References - validate that they are valid MongoDB ObjectIds (24 hex characters)
      if (formValue.customerContractId && this.isValidObjectId(formValue.customerContractId)) {
        schedule.customerContract = formValue.customerContractId;
      } else {
        throw new Error('Invalid customer contract ID');
      }
      
      if (formValue.objectId && this.isValidObjectId(formValue.objectId)) {
        schedule.object = formValue.objectId;
      } else {
        throw new Error('Invalid location ID');
      }
      
      // Optional fields
      if (formValue.notes) {
        schedule.notes = formValue.notes;
      }
      
      // Calculate estimated duration
      schedule.estimatedDuration = this.calculateDuration(formValue.startTime, formValue.endTime);
      
      // Format employees correctly - this is critical
      if (formValue.employees && formValue.employees.length > 0) {
        schedule.employees = formValue.employees.map((emp: {employee: string, role: string}) => ({
          employee: emp.employee, // Just the ID string
          role: emp.role
        }));
      } else {
        schedule.employees = [];
      }
      
      // Format tasks if they exist
      if (formValue.tasks && formValue.tasks.length > 0) {
        schedule.tasks = formValue.tasks.map((task: {name: string, description: string, completed: boolean}) => ({
          name: task.name || task.description,
          description: task.description,
          completed: !!task.completed
        }));
      }

      // Save schedule
      const request = this.isEdit
        ? this.scheduleService.updateSchedule(schedule)
        : this.scheduleService.createSchedule(schedule);

      request.pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          // First close the dialog with true to indicate success
          this.dialogRef.close(true);
          
          // Then show the snackbar message
          this.snackBar.open(
            `Schedule ${this.isEdit ? 'updated' : 'created'} successfully`,
            'Close',
            { 
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            }
          );
          this.submitting = false;
        },
        error: (error) => {
          console.error('Server error:', error);
          this.snackBar.open(
            `Error ${this.isEdit ? 'updating' : 'creating'} schedule: ${
              error.error?.message || error.message || 'Unknown error'
            }`,
            'Close',
            { 
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            }
          );
          this.submitting = false;
        },
      });
    } catch (err: any) {
      console.error('Error preparing schedule data:', err);
      this.snackBar.open(
        `Error preparing schedule data: ${err?.message || 'Unknown error'}`,
        'Close',
        { 
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        }
      );
      this.submitting = false;
    }
  }
  
  // Helper method to validate MongoDB ObjectId format (24 hex characters)
  private isValidObjectId(id: string): boolean {
    return !!id && /^[0-9a-fA-F]{24}$/.test(id);
  }
  
  // Helper method to format employee assignments correctly
  private formatEmployeeAssignments(employees: any[]): EmployeeAssignment[] {
    if (!employees || !Array.isArray(employees)) {
      console.warn('Invalid employees data:', employees);
      return [];
    }
    
    return employees.map(emp => {
      if (!emp) {
        console.warn('Invalid employee entry:', emp);
        return null;
      }
      
      // Make sure we have the correct structure
      return {
        employee: emp.employee, // This should be the employee ID string
        role: emp.role || 'Cleaner'
      };
    }).filter(Boolean) as EmployeeAssignment[];
  }
  
  // Helper method to convert time string to minutes
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Update the calculateDuration method to work with the new time format
  calculateDuration(startTime: string, endTime: string): number {
    if (!startTime || !endTime) return 0;
    
    const start = this.timeToMinutes(startTime);
    const end = this.timeToMinutes(endTime);
    
    return end > start ? (end - start) / 60 : 24 - (start - end) / 60;
  }

  // Helper to mark all controls as touched
  markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
