import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface WorkingDay {
  day: string;
  from: string;
  to: string;
  duration?: number; // Made optional since it will be calculated
}

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  profileImage?: string;
  hourlyRate: number;
  hireDate: Date;
  address: string;
  city: string;
  municipality: string; // Kosovo municipalities instead of state
  nationality: 'Kosovo Citizen' | 'EU Citizen' | 'Non-EU Citizen';
  personalNumber?: string; // Kosovo personal ID number
  workPermit?: {
    type: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'Not Required';
    number?: string;
    issueDate?: Date;
    expiryDate?: Date;
    issuingAuthority?: string;
  };
  residencePermit?: {
    type: 'Temporary' | 'Permanent' | 'EU Long-term' | 'Not Required';
    number?: string;
    expiryDate?: Date;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents: {
    type: string;
    number: string;
    expiryDate: Date;
  }[];
  skills: string[];
  notes: string;
  workingDays: WorkingDay[];
  department: string;
  employmentType: string;
  certifications: string[];
  languages: string[];
  availability: string;
  paymentInfo: {
    bankName: string;
    accountNumber: string;
    iban: string; // Kosovo IBAN instead of routing number
    accountType: string;
  };
  healthInsurance: {
    provider:
      | 'Kosovo Health Insurance Fund'
      | 'Private Insurance'
      | 'EU Insurance'
      | 'Other';
    policyNumber: string;
    validUntil: Date;
  };
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private apiUrl = '/api/employees'; // Use relative URL for proxy
  private employeesSubject = new BehaviorSubject<Employee[]>([]);
  employees$ = this.employeesSubject.asObservable();
  private storageKey = 'cleaning_employees';

  // Predefined lists for dropdowns
  readonly positions = [
    'Cleaner',
    'Senior Cleaner',
    'Team Lead',
    'Supervisor',
    'Manager',
    'Administrator',
  ];

  readonly departments = [
    'Residential Cleaning',
    'Commercial Cleaning',
    'Special Projects',
    'Maintenance',
    'Administration',
  ];

  readonly employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Temporary',
    'Seasonal',
  ];

  readonly availableSkills = [
    'General Cleaning',
    'Floor Care',
    'Window Cleaning',
    'Carpet Cleaning',
    'Pressure Washing',
    'Deep Cleaning',
    'Sanitization',
    'Equipment Operation',
    'Team Leadership',
    'Customer Service',
    'Green Cleaning',
    'HVAC Cleaning',
    'Post-Construction Cleaning',
    'Biohazard Cleaning'
  ];

  readonly languages = [
    'Albanian',
    'Serbian',
    'English',
    'German',
    'Italian',
    'French',
    'Turkish',
    'Bosnian',
    'Croatian',
    'Macedonian',
    'Other',
  ];

  readonly certifications = [
    'Kosovo Health & Safety',
    'First Aid & CPR',
    'Green Cleaning',
    'Equipment Operation',
    'Supervisor Training',
    'Chemical Safety',
    'EU Safety Standards',
    'ISO Cleaning Standards',
  ];

  readonly availabilityOptions = [
    'Weekdays Only',
    'Weekends Only',
    'All Days',
    'Morning Shift',
    'Afternoon Shift',
    'Evening Shift',
    'Night Shift',
    'Flexible',
  ];

  readonly accountTypes = ['Checking', 'Savings'];

  // Kosovo-specific constants
  readonly municipalities = [
    'Pristina',
    'Mitrovica',
    'Peja',
    'Prizren',
    'Gjilan',
    'Ferizaj',
    'Gjakova',
    'Podujeva',
    'Suhareka',
    'Malisheva',
    'Vushtrri',
    'Drenas',
    'Rahovec',
    'Lipjan',
    'Kamenica',
    'Viti',
    'Obiliq',
    'Fushe Kosova',
    'Kllokot',
    'Novoberde',
    'Kacanik',
    'Hani i Elezit',
    'Mamusa',
    'Junik',
    'Decan',
    'Istog',
    'Klina',
    'Skenderaj',
    'Leposavic',
    'Zubin Potok',
    'Zvecan',
    'Mitrovica North',
    'Dragash',
    'Shtime',
    'Shterpce',
    'Ranillug',
    'Gracanica',
  ];

  readonly kosovoNationalities = [
    'Kosovo Citizen',
    'EU Citizen',
    'Non-EU Citizen',
  ];

  readonly kosovoBanks = [
    'ProCredit Bank',
    'TEB Bank',
    'NLB Bank',
    'BKT Bank',
    'Raiffeisen Bank',
    'Other',
  ];

  readonly healthInsuranceProviders = [
    'Kosovo Health Insurance Fund',
    'Private Insurance',
    'EU Insurance',
    'Other',
  ];

  // Default mock data for demonstration
  private defaultEmployees: Employee[] = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@cleaning.com',
      phone: '+383-44-123-456',
      position: 'Senior Cleaner',
      status: 'Active',
      hourlyRate: 18,
      hireDate: new Date('2023-01-15'),
      address: '123 Main St',
      city: 'Pristina',
      municipality: 'Pristina',
      nationality: 'Kosovo Citizen',
      personalNumber: '1234567890',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+383-44-123-457',
      },
      documents: [
        {
          type: 'Kosovo ID Card',
          number: '123456789',
          expiryDate: new Date('2025-01-15'),
        },
      ],
      skills: [
        'Pastrimi i Përgjithshëm',
        'Pastrimi i Dyshemeve',
        'Pastrimi i Dritareve',
      ],
      notes: 'Reliable employee with excellent attention to detail',
      workingDays: [
        {
          day: 'Monday',
          from: '9:00 AM',
          to: '5:00 PM',
          duration: 8,
        },
      ],
      department: 'Residential Cleaning',
      employmentType: 'Full-time',
      certifications: ['Kosovo Health & Safety', 'First Aid & CPR'],
      languages: ['Albanian', 'English'],
      availability: 'Weekdays Only',
      paymentInfo: {
        bankName: 'ProCredit Bank',
        accountNumber: '1234567890',
        iban: 'XK21 1234 5678 9012 3456',
        accountType: 'Checking',
      },
      healthInsurance: {
        provider: 'Kosovo Health Insurance Fund',
        policyNumber: 'HI123456',
        validUntil: new Date('2024-12-31'),
      },
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@cleaning.com',
      phone: '+1-555-0234',
      position: 'Cleaner',
      status: 'Active',
      hourlyRate: 15,
      hireDate: new Date('2023-03-20'),
      address: '456 Oak Ave',
      city: 'Springfield',
      municipality: 'Pristina',
      emergencyContact: {
        name: 'Mike Smith',
        relationship: 'Brother',
        phone: '+1-555-0235',
      },
      documents: [
        {
          type: 'ID',
          number: 'DL789012',
          expiryDate: new Date('2025-03-20'),
        },
      ],
      skills: ['Pastrimi i Përgjithshëm', 'Pastrimi i Thellë', 'Dezinfektimi'],
      notes: 'Detail-oriented with great customer service skills',
      workingDays: [
        {
          day: 'Tuesday',
          from: '8:00 AM',
          to: '4:00 PM',
          duration: 8,
        },
      ],
      department: 'Commercial Cleaning',
      employmentType: 'Full-time',
      certifications: ['First Aid & CPR'],
      languages: ['English'],
      availability: 'Flexible',
      paymentInfo: {
        bankName: 'Community Bank',
        accountNumber: '****5678',
        iban: 'XK05****9012',
        accountType: 'Checking',
      },
      nationality: 'Kosovo Citizen',
      healthInsurance: {
        provider: 'Kosovo Health Insurance Fund',
        policyNumber: 'KHIF-2023-001',
        validUntil: new Date('2024-12-31'),
      },
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@cleaning.com',
      phone: '+1-555-0345',
      position: 'Team Lead',
      status: 'Active',
      hourlyRate: 22,
      hireDate: new Date('2022-11-10'),
      address: '789 Pine St',
      city: 'Springfield',
      municipality: 'Pristina',
      emergencyContact: {
        name: 'Lisa Johnson',
        relationship: 'Wife',
        phone: '+1-555-0346',
      },
      documents: [
        {
          type: 'ID',
          number: 'DL345678',
          expiryDate: new Date('2025-11-10'),
        },
      ],
      skills: ['Team Leadership', 'Equipment Operation', 'Quality Control'],
      notes: 'Experienced team leader with excellent organizational skills',
      workingDays: [
        {
          day: 'Wednesday',
          from: '7:00 AM',
          to: '3:00 PM',
          duration: 8,
        },
      ],
      department: 'Special Projects',
      employmentType: 'Full-time',
      certifications: [
        'OSHA Safety',
        'Supervisor Training',
        'Equipment Operation',
      ],
      languages: ['English', 'Spanish'],
      availability: 'All Days',
      paymentInfo: {
        bankName: 'Regional Bank',
        accountNumber: '****3456',
        iban: 'XK05****7890',
        accountType: 'Checking',
      },
      nationality: 'Kosovo Citizen',
      healthInsurance: {
        provider: 'Kosovo Health Insurance Fund',
        policyNumber: 'KHIF-2023-002',
        validUntil: new Date('2024-12-31'),
      },
    },
    {
      _id: '4',
      firstName: 'Sarah',
      lastName: 'Wilson',
      email: 'sarah.wilson@cleaning.com',
      phone: '+1-555-0456',
      position: 'Specialist',
      status: 'Active',
      hourlyRate: 20,
      hireDate: new Date('2023-05-01'),
      address: '321 Elm Dr',
      city: 'Springfield',
      municipality: 'Pristina',
      emergencyContact: {
        name: 'Tom Wilson',
        relationship: 'Father',
        phone: '+1-555-0457',
      },
      documents: [
        {
          type: 'ID',
          number: 'DL901234',
          expiryDate: new Date('2025-05-01'),
        },
      ],
      skills: ['Biohazard Cleaning', 'HVAC Cleaning', 'Green Cleaning'],
      notes: 'Specialist in healthcare and biohazard cleaning',
      workingDays: [
        {
          day: 'Thursday',
          from: '6:00 AM',
          to: '2:00 PM',
          duration: 8,
        },
      ],
      department: 'Healthcare',
      employmentType: 'Full-time',
      certifications: [
        'Biohazard Handling',
        'Infection Control',
        'Chemical Safety',
      ],
      languages: ['English'],
      availability: 'Morning Shift',
      paymentInfo: {
        bankName: 'First National Bank',
        accountNumber: '****9012',
        iban: 'XK05****3456',
        accountType: 'Savings',
      },
      nationality: 'Kosovo Citizen',
      healthInsurance: {
        provider: 'Kosovo Health Insurance Fund',
        policyNumber: 'KHIF-2023-003',
        validUntil: new Date('2024-12-31'),
      },
    },
    {
      _id: '5',
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@cleaning.com',
      phone: '+1-555-0567',
      position: 'Cleaner',
      status: 'Active',
      hourlyRate: 16,
      hireDate: new Date('2023-08-15'),
      address: '654 Maple Ln',
      city: 'Springfield',
      municipality: 'Pristina',
      emergencyContact: {
        name: 'Alex Davis',
        relationship: 'Spouse',
        phone: '+1-555-0568',
      },
      documents: [
        {
          type: 'ID',
          number: 'DL567890',
          expiryDate: new Date('2025-08-15'),
        },
      ],
      skills: ['Carpet Cleaning', 'Window Cleaning', 'Customer Service'],
      notes: 'Newer employee with great potential and attitude',
      workingDays: [
        {
          day: 'Friday',
          from: '10:00 AM',
          to: '6:00 PM',
          duration: 8,
        },
      ],
      department: 'Residential Cleaning',
      employmentType: 'Part-time',
      certifications: ['First Aid & CPR'],
      languages: ['English', 'French'],
      availability: 'Afternoon Shift',
      paymentInfo: {
        bankName: 'Community Bank',
        accountNumber: '****6789',
        iban: 'XK05****0123',
        accountType: 'Checking',
      },
      nationality: 'Kosovo Citizen',
      healthInsurance: {
        provider: 'Kosovo Health Insurance Fund',
        policyNumber: 'KHIF-2023-004',
        validUntil: new Date('2024-12-31'),
      },
    },
  ];

  constructor(private http: HttpClient) {
    this.loadEmployees();
  }

  private loadEmployees(): void {
    const storedEmployees = this.getStoredEmployees();
    console.log(
      'Loading employees:',
      storedEmployees.length,
      'employees found'
    );
    this.employeesSubject.next(storedEmployees);
  }

  private getStoredEmployees(): Employee[] {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const employees = JSON.parse(stored);
        // Convert date strings back to Date objects
        return employees.map((emp: any) => ({
          ...emp,
          hireDate: new Date(emp.hireDate),
          documents:
            emp.documents?.map((doc: any) => ({
              ...doc,
              expiryDate: new Date(doc.expiryDate),
            })) || [],
        }));
      }
    } catch (error) {
      console.error('Error loading employees from localStorage:', error);
    }

    // If no stored data or error, return default employees and save them
    this.saveEmployees(this.defaultEmployees);
    return this.defaultEmployees;
  }

  private saveEmployees(employees: Employee[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(employees));
    } catch (error) {
      console.error('Error saving employees to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Calculate duration between two time strings
  calculateDuration(from: string, to: string): number {
    const fromTime = this.parseTime(from);
    const toTime = this.parseTime(to);

    if (fromTime && toTime) {
      let duration = toTime - fromTime;
      if (duration < 0) {
        duration += 24; // Handle overnight shifts
      }
      return Math.round(duration * 100) / 100; // Round to 2 decimal places
    }
    return 0;
  }

  private parseTime(timeStr: string): number | null {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours + minutes / 60;
  }

  getEmployees(): Observable<Employee[]> {
    console.log('📡 Fetching employees from API:', this.apiUrl);

    // Try to get from API first, fallback to localStorage if API fails
    return this.http
      .get<Employee[] | { employees: Employee[]; total: number }>(
        `${this.apiUrl}`
      )
      .pipe(
        map((response) => {
          // Handle both direct array and paginated responses
          if (Array.isArray(response)) {
            console.log('📦 Received direct array response');
            return response;
          } else if (response && (response as any).employees) {
            console.log('📦 Received paginated response');
            return (response as any).employees;
          } else {
            console.log('📦 Received unknown response format');
            return [];
          }
        }),
        tap((employees) => {
          console.log('✅ Employees loaded from API:', employees.length);
          this.employeesSubject.next(employees);
          // Also save to localStorage as backup
          this.saveEmployees(employees);
        }),
        catchError((error) => {
          console.error('❌ API failed, falling back to localStorage:', error);
          console.error('🔍 Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
          });
          const employees = this.getStoredEmployees();
          this.employeesSubject.next(employees);
          return of(employees);
        })
      );
  }

  getEmployee(id: string): Observable<Employee> {
    // Try to get from API first, fallback to localStorage if API fails
    return this.http.get<Employee>(`${this.apiUrl}/${id}`).pipe(
      tap((employee) => {
        console.log(
          'Employee loaded from API:',
          employee.firstName,
          employee.lastName
        );
      }),
      catchError((error) => {
        console.warn('API failed, falling back to localStorage:', error);
        const employees = this.getStoredEmployees();
        const employee = employees.find((e) => e._id === id);
        if (!employee) {
          throw new Error('Employee not found');
        }
        return of(employee);
      })
    );
  }

  createEmployee(employee: Omit<Employee, '_id'>): Observable<Employee> {
    console.log('🚀 Creating employee:', employee.firstName, employee.lastName);
    console.log('📡 API URL:', this.apiUrl);

    // Calculate duration for working days
    const employeeData = {
      ...employee,
      workingDays: employee.workingDays.map((day) => ({
        ...day,
        duration: this.calculateDuration(day.from, day.to),
      })),
    };

    console.log('📤 Sending employee data to API:', employeeData);

    // Try to create via API first, fallback to localStorage if API fails
    return this.http.post<Employee>(this.apiUrl, employeeData).pipe(
      tap((newEmployee) => {
        console.log(
          '✅ Employee created via API successfully:',
          newEmployee.firstName,
          newEmployee.lastName
        );
        console.log('📊 Employee saved to database with ID:', newEmployee._id);
        // Update local data
        const employees = this.getStoredEmployees();
        employees.push(newEmployee);
        this.saveEmployees(employees);
        this.employeesSubject.next(employees);
      }),
      catchError((error) => {
        console.error('❌ API call failed:', error);
        console.error('🔍 Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
        });
        console.warn('🔄 Falling back to localStorage storage');

        // Fallback to localStorage
        const employees = this.getStoredEmployees();
        const newEmployee: Employee = {
          ...employeeData,
          _id: this.generateId(),
        };

        employees.push(newEmployee);
        this.saveEmployees(employees);
        this.employeesSubject.next(employees);
        console.log(
          '💾 Employee created locally (not in database):',
          newEmployee.firstName,
          newEmployee.lastName,
          'Total employees:',
          employees.length
        );
        return of(newEmployee);
      })
    );
  }

  updateEmployee(
    id: string,
    employee: Partial<Employee>
  ): Observable<Employee> {
    console.log('🔄 Updating employee with ID:', id);
    console.log('📡 API URL:', `${this.apiUrl}/${id}`);

    // Calculate duration for working days if they are being updated
    const employeeData = { ...employee };
    if (employee.workingDays) {
      employeeData.workingDays = employee.workingDays.map((day) => ({
        ...day,
        duration: this.calculateDuration(day.from, day.to),
      }));
    }

    console.log('📤 Sending update data to API:', employeeData);

    // Try to update via API first, fallback to localStorage if API fails
    return this.http.put<Employee>(`${this.apiUrl}/${id}`, employeeData).pipe(
      tap((updatedEmployee) => {
        console.log(
          '✅ Employee updated via API successfully:',
          updatedEmployee.firstName,
          updatedEmployee.lastName
        );
        console.log(
          '📊 Employee updated in database with ID:',
          updatedEmployee._id
        );
        // Update local data
        const employees = this.getStoredEmployees();
        const index = employees.findIndex((e) => e._id === id);
        if (index !== -1) {
          employees[index] = updatedEmployee;
          this.saveEmployees(employees);
          this.employeesSubject.next(employees);
        }
      }),
      catchError((error) => {
        console.error('❌ API update failed:', error);
        console.error('🔍 Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message,
        });
        console.warn('🔄 Falling back to localStorage update');

        // Fallback to localStorage
        const employees = this.getStoredEmployees();
        const index = employees.findIndex((e) => e._id === id);

        if (index === -1) {
          throw new Error('Employee not found');
        }

        employees[index] = { ...employees[index], ...employeeData };
        this.saveEmployees(employees);
        this.employeesSubject.next(employees);
        console.log(
          '💾 Employee updated locally (not in database):',
          employees[index].firstName,
          employees[index].lastName
        );
        return of(employees[index]);
      })
    );
  }

  deleteEmployee(id: string): Observable<void> {
    // Try to delete via API first, fallback to localStorage if API fails
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => {
        console.log('Employee deleted via API:', response.message);
        // Update local data
        const employees = this.getStoredEmployees();
        const index = employees.findIndex((e) => e._id === id);
        if (index !== -1) {
          const deletedEmployee = employees[index];
          employees.splice(index, 1);
          this.saveEmployees(employees);
          this.employeesSubject.next(employees);
          console.log(
            'Employee removed from local storage:',
            deletedEmployee.firstName,
            deletedEmployee.lastName
          );
        }
      }),
      map(() => void 0), // Convert response to void
      catchError((error) => {
        console.warn('API failed, falling back to localStorage:', error);
        // Fallback to localStorage
        const employees = this.getStoredEmployees();
        const index = employees.findIndex((e) => e._id === id);

        if (index === -1) {
          throw new Error('Employee not found');
        }

        const deletedEmployee = employees[index];
        employees.splice(index, 1);
        this.saveEmployees(employees);
        this.employeesSubject.next(employees);
        console.log(
          'Employee deleted locally:',
          deletedEmployee.firstName,
          deletedEmployee.lastName,
          'Remaining employees:',
          employees.length
        );
        return of(void 0);
      })
    );
  }

  // Utility method to clear all data (for testing)
  clearAllEmployees(): void {
    localStorage.removeItem(this.storageKey);
    this.employeesSubject.next([]);
  }
}
