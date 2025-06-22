import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ScheduleService } from '../../../services/schedule.service';

@Component({
  selector: 'app-schedule-detail',
  templateUrl: './schedule-detail.component.html',
  styleUrls: ['./schedule-detail.component.scss'],
})
export class ScheduleDetailComponent implements OnInit {
  scheduleForm!: FormGroup;
  isEdit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private dialogRef: MatDialogRef<ScheduleDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.isEdit = !!data.schedule._id;
    console.log('Schedule Detail Data:', this.data);
    this.initForm();
  }

  ngOnInit() {}

  initForm() {
    // Format the date properly for the date picker
    let scheduledDate = new Date();
    if (this.data.schedule.scheduledDate) {
      scheduledDate = new Date(this.data.schedule.scheduledDate);
    }

    // Format times properly for HTML time input (HH:MM format)
    // For new schedules (create mode), always default to 09:00-17:00
    const defaultStartTime = this.isEdit
      ? this.data.schedule.startTime
      : '09:00';
    const defaultEndTime = this.isEdit ? this.data.schedule.endTime : '17:00';

    const startTime = this.formatTimeForInput(defaultStartTime || '09:00');
    const endTime = this.formatTimeForInput(defaultEndTime || '17:00');

    // Find the matching contract object if customerContract is provided as ID
    let selectedContract = null;
    if (this.data.schedule.customerContract) {
      if (typeof this.data.schedule.customerContract === 'string') {
        // It's an ID, find the contract object
        selectedContract = this.data.contracts?.find(
          (c: any) => c._id === this.data.schedule.customerContract
        );
      } else {
        // It's already an object
        selectedContract = this.data.schedule.customerContract;
      }
    }

    // Find the matching object if provided
    let selectedObject = null;
    if (this.data.schedule.object) {
      if (typeof this.data.schedule.object === 'string') {
        selectedObject = this.data.objects?.find(
          (o: any) => o._id === this.data.schedule.object
        );
      } else {
        selectedObject = this.data.schedule.object;
      }
    }

    // Process employees to ensure they're in the correct format
    let selectedEmployees = [];
    if (
      this.data.schedule.employees &&
      Array.isArray(this.data.schedule.employees)
    ) {
      selectedEmployees = this.data.schedule.employees.map((emp: any) => {
        if (emp.employee) {
          // Find the full employee object from the data
          return (
            this.data.employees?.find((e: any) => e._id === emp.employee._id) ||
            emp.employee
          );
        }
        return emp;
      });
    }

    this.scheduleForm = this.fb.group({
      object: [selectedObject || '', Validators.required],
      employees: [selectedEmployees || [], Validators.required],
      customerContract: [selectedContract || ''],
      scheduledDate: [scheduledDate, Validators.required],
      startTime: [startTime, Validators.required],
      endTime: [endTime, Validators.required],
      estimatedDuration: [
        this.data.schedule.estimatedDuration || 2,
        [Validators.required, Validators.min(0.5)],
      ],
      status: [this.data.schedule.status || 'Scheduled', Validators.required],
      priority: [this.data.schedule.priority || 'Medium', Validators.required],
      cleaningType: [
        this.data.schedule.cleaningType || 'Regular',
        Validators.required,
      ],
      notes: [this.data.schedule.notes || ''],
    });

    // Listen for time changes to auto-calculate duration
    this.scheduleForm.get('startTime')?.valueChanges.subscribe(() => {
      this.updateEstimatedDuration();
    });
    this.scheduleForm.get('endTime')?.valueChanges.subscribe(() => {
      this.updateEstimatedDuration();
    });

    // For debugging - log the form values
    console.log('Form initialized with values:', {
      startTime: this.scheduleForm.get('startTime')?.value,
      endTime: this.scheduleForm.get('endTime')?.value,
      isEdit: this.isEdit,
    });
  }

  private formatTimeForInput(time: string): string {
    if (!time) return '09:00';

    // Remove any AM/PM and convert to 24-hour format
    if (time.includes('AM') || time.includes('PM')) {
      const cleanTime = time.replace(/\s*(AM|PM)/i, '');
      const [hours, minutes] = cleanTime.split(':').map(Number);

      if (time.toUpperCase().includes('PM') && hours !== 12) {
        return `${(hours + 12).toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}`;
      } else if (time.toUpperCase().includes('AM') && hours === 12) {
        return `00:${minutes.toString().padStart(2, '0')}`;
      } else {
        return `${hours.toString().padStart(2, '0')}:${minutes
          .toString()
          .padStart(2, '0')}`;
      }
    }

    // If time is already in HH:MM format, return as is
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }

    // If time is in H:MM format, pad with zero
    if (time.match(/^\d{1}:\d{2}$/)) {
      return '0' + time;
    }

    // Default fallback
    return '09:00';
  }

  private updateEstimatedDuration() {
    const startTime = this.scheduleForm.get('startTime')?.value;
    const endTime = this.scheduleForm.get('endTime')?.value;

    if (startTime && endTime) {
      const start = this.timeToMinutes(startTime);
      const end = this.timeToMinutes(endTime);

      if (end > start) {
        const durationHours = (end - start) / 60;
        this.scheduleForm.patchValue(
          { estimatedDuration: durationHours },
          { emitEvent: false }
        );
      }
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private formatTimeForSave(time: string): string {
    if (!time) return '09:00';

    // Ensure time is in HH:MM format
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time;
    }

    // If time is in H:MM format, pad with zero
    if (time.match(/^\d{1}:\d{2}$/)) {
      return '0' + time;
    }

    // Default fallback
    return '09:00';
  }

  onSubmit() {
    if (this.scheduleForm.valid) {
      const formValue = this.scheduleForm.value;

      // Process the form data to match the backend API structure
      const scheduleData: any = {
        // For updates, include the ID
        ...(this.isEdit && { _id: this.data.schedule._id }),
        // Object ID (required)
        object: formValue.object._id || formValue.object,
        // Employees array with proper structure for backend
        employees: formValue.employees.map((emp: any) => ({
          employee: emp._id || emp,
          role: 'Primary', // Default role, can be enhanced later
        })),
        // Customer contract ID (optional)
        customerContract: formValue.customerContract
          ? formValue.customerContract._id || formValue.customerContract
          : undefined,
        // Schedule date and times
        scheduledDate: new Date(formValue.scheduledDate).toISOString(),
        startTime: this.formatTimeForSave(formValue.startTime),
        endTime: this.formatTimeForSave(formValue.endTime),
        // Duration and other fields
        estimatedDuration: formValue.estimatedDuration,
        status: formValue.status,
        priority: formValue.priority,
        cleaningType: formValue.cleaningType,
        notes: formValue.notes || '',
      };

      // Remove undefined values to keep the payload clean
      Object.keys(scheduleData).forEach((key) => {
        if (scheduleData[key] === undefined) {
          delete scheduleData[key];
        }
      });

      console.log('Submitting schedule data:', scheduleData);

      const operation = this.isEdit
        ? this.scheduleService.updateSchedule(scheduleData)
        : this.scheduleService.createSchedule(scheduleData);

      operation.subscribe({
        next: (result: any) => {
          console.log('Schedule saved successfully:', result);
          this.dialogRef.close(result);
        },
        error: (error: any) => {
          console.error('Error saving schedule:', error);
          // Handle error (show message to user)
        },
      });
    } else {
      console.log('Form is invalid:', this.scheduleForm.errors);
      // Mark all fields as touched to show validation errors
      Object.keys(this.scheduleForm.controls).forEach((key) => {
        this.scheduleForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  compareObjects(o1: any, o2: any): boolean {
    return o1 && o2 ? o1._id === o2._id : o1 === o2;
  }

  // Helper method to get contract display name
  getContractDisplayName(contract: any): string {
    if (!contract) return '';

    const customerName =
      contract.customer?.fullName ||
      contract.customer?.name ||
      (contract.customer?.firstName && contract.customer?.lastName
        ? `${contract.customer.firstName} ${contract.customer.lastName}`
        : '') ||
      contract.customerName ||
      '';

    if (customerName && contract.contractNumber) {
      return `${customerName} - ${contract.contractNumber}`;
    }

    if (customerName) {
      return customerName;
    }

    return contract.contractNumber || 'Unknown Contract';
  }

  // Helper method to get object display name
  getObjectDisplayName(object: any): string {
    if (!object) return '';
    return object.name || 'Unknown Location';
  }

  // Helper method to get employee display name
  getEmployeeDisplayName(employee: any): string {
    if (!employee) return '';

    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}${
        employee.position ? ' - ' + employee.position : ''
      }`;
    }

    if (employee.name) {
      return `${employee.name}${
        employee.position ? ' - ' + employee.position : ''
      }`;
    }

    return 'Unknown Employee';
  }

  // Manual time input methods
  onTimeInput(event: any, field: string): void {
    let value = event.target.value;

    // Auto-format time as user types
    value = this.formatTimeInput(value);

    // Update the form control with formatted value
    this.scheduleForm.get(field)?.setValue(value, { emitEvent: false });

    // Update cursor position after formatting
    setTimeout(() => {
      event.target.value = value;
    }, 0);

    // Update duration if both times are valid
    if (
      this.isValidTimeFormat(this.scheduleForm.get('startTime')?.value) &&
      this.isValidTimeFormat(this.scheduleForm.get('endTime')?.value)
    ) {
      this.updateEstimatedDuration();
    }
  }

  formatTimeInput(value: string): string {
    // Remove any non-digit characters except colon
    value = value.replace(/[^\d:]/g, '');

    // Auto-add colon after 2 digits
    if (value.length === 2 && !value.includes(':')) {
      value = value + ':';
    }

    // Limit to HH:MM format
    if (value.length > 5) {
      value = value.substring(0, 5);
    }

    return value;
  }

  validateTimeFormat(field: string): void {
    const control = this.scheduleForm.get(field);
    const value = control?.value;

    if (value && !this.isValidTimeFormat(value)) {
      control?.setErrors({ invalidTime: true });
    } else {
      // Remove invalidTime error if it exists, but keep other errors
      const errors = control?.errors;
      if (errors) {
        delete errors['invalidTime'];
        control?.setErrors(Object.keys(errors).length === 0 ? null : errors);
      }
    }
  }

  isValidTimeFormat(time: string): boolean {
    if (!time) return false;

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
