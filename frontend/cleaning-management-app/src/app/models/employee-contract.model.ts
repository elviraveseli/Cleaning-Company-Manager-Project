export interface EmployeeContract {
  _id: string;
  employeeId: string;
  contractType: 'Full-time' | 'Part-time' | 'Temporary' | 'Contract';
  startDate: Date;
  endDate?: Date;
  salary: number;
  paymentFrequency: 'Weekly' | 'Bi-weekly' | 'Monthly';
  benefits: string[];
  workingHours: {
    weeklyHours: number;
    scheduleType: 'Fixed' | 'Flexible';
  };
  leaveEntitlement: {
    annualLeave: number;
    sickLeave: number;
    paidHolidays: number;
  };
  probationPeriod?: {
    duration: number; // in months
    endDate: Date;
  };
  documents: {
    type: string;
    name: string;
    url: string;
    uploadDate: Date;
  }[];
  terms: string[];
  status: 'Active' | 'Expired' | 'Terminated';
  createdAt: Date;
  updatedAt: Date;
  terminationDetails?: {
    date: Date;
    reason: string;
    notes: string;
  };
} 