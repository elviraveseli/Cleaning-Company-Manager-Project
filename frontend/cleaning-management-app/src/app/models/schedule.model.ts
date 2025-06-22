export interface Schedule {
  _id?: string;
  object: string | ObjectInfo; // ObjectId reference or populated object
  employees: EmployeeAssignment[];
  customerContract?: string | CustomerContractInfo; // ObjectId reference or populated contract
  scheduledDate: Date | string;
  startTime: string;
  endTime: string;
  estimatedDuration: number; // in hours
  actualDuration?: number; // in hours
  status: ScheduleStatus;
  priority: SchedulePriority;
  cleaningType: CleaningType;
  tasks?: Task[];
  notes?: string;
  customerFeedback?: CustomerFeedback;
  photos?: Photo[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface EmployeeAssignment {
  employee: string | EmployeeInfo; // ObjectId reference or populated employee
  role: EmployeeRole;
}

export interface ObjectInfo {
  _id: string;
  name: string;
  address?: string;
  type?: string;
}

export interface EmployeeInfo {
  _id: string;
  firstName: string;
  lastName: string;
  position: string;
  email?: string;
  phone?: string;
}

export interface CustomerContractInfo {
  _id: string;
  contractNumber: string;
  customer: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  serviceType: string;
  status: string;
}

export interface Task {
  name: string;
  description?: string;
  completed: boolean;
  completedBy?: string | EmployeeInfo;
  completedAt?: Date | string;
}

export interface CustomerFeedback {
  rating: number; // 1-5
  comments?: string;
  date: Date | string;
}

export interface Photo {
  fileName: string;
  uploadDate: Date | string;
}

export type ScheduleStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';

export type SchedulePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type CleaningType = 'Regular' | 'Deep Clean' | 'Move-in/Move-out' | 'Emergency' | 'Special Event';

export type EmployeeRole = 'Primary' | 'Secondary' | 'Supervisor';

// Helper interfaces for form handling
export interface ScheduleFormData {
  object: ObjectInfo;
  employees: EmployeeInfo[];
  customerContract?: CustomerContractInfo;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  estimatedDuration: number;
  status: ScheduleStatus;
  priority: SchedulePriority;
  cleaningType: CleaningType;
  notes?: string;
}

// Interface for schedule statistics
export interface ScheduleStats {
  todayCount: number;
  weeklyRevenue: number;
  availableEmployees: number;
  scheduledEmployees: number;
  completionRate: number;
} 