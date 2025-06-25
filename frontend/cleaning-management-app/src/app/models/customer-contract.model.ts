export interface CustomerContract {
  _id: string;
  contractNumber: string;
  customerId: string; // Reference to Customer ID
  objectId?: string; // Reference to Object ID (optional)
  customer: {
    _id?: string; // Reference to Customer model
    name: string;
    email: string;
    phone: string;
    address: {
      street?: string;
      city?: string;
      municipality?: string;
      country?: string;
    };
  };
  billingAddress?: {
    sameAsService: boolean;
    address?: string;
    city?: string;
    municipality?: string;
    country?: string;
  };
  selectedObject?: ObjectOption | null;
  objects: string[]; // Array of Object IDs
  assignedEmployees?: string[]; // Array of Employee IDs
  startDate: Date;
  endDate?: Date;
  contractType: 'One-time' | 'Recurring' | 'Long-term' | 'Emergency';
  billingFrequency:
    | 'Weekly'
    | 'Bi-weekly'
    | 'Monthly'
    | 'Quarterly'
    | 'Annually'
    | 'Due on Receipt';
  totalAmount: number;
  currency?: string;
  paymentTerms: 
    | 'Within 10 days'
    | 'Within 20 days'
    | 'Within 30 days'
    | 'Within 45 days'
    | 'Immediate Payment'
    | 'In advance';
  // Payment calculation fields
  paymentCalculation?: {
    paymentTermsText?: string;
    paymentMethod?: string;
    quantityHours?: number;
    hourlyRate?: number;
    totalAmountExcludingVAT?: number;
    vatRate?: number;
    vatAmount?: number;
    totalAmountIncludingVAT?: number;
    rhythmCountByYear?: number;
    totalAnnualizedQuantityHours?: number;
    totalMonthWorkingHours?: number;
    totalAnnualizedContractValue?: number;
    totalMonthlyContractValue?: number;
    employeeHoursPerEngagement?: number;
    numberOfEmployees?: number;
    totalHoursPerEngagement?: number;
  };
  services: {
    name: string;
    description?: string;
    frequency: 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'As Needed';
    price: number;
    workingDaysAndTimes?: {
      day:
        | 'Monday'
        | 'Tuesday'
        | 'Wednesday'
        | 'Thursday'
        | 'Friday'
        | 'Saturday'
        | 'Sunday';
      timeSlots: {
        from: string; // HH:MM format
        to: string; // HH:MM format
        duration: number; // in hours
      }[];
    }[];
  }[];
  servicePreferences?: {
    keyAccess?: boolean;
    petInstructions?: string;
    accessInstructions?: string;
    specialRequests?: string;
  };
  specialRequirements: string[];
  status: 'Active' | 'Expired' | 'Terminated' | 'Suspended' | 'Pending';
  terms?: string;
  notes?: string;
  documents?: {
    fileName: string;
    uploadDate: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerContractStats {
  total: number;
  active: number;
  expired: number;
  terminated: number;
  suspended: number;
  pending: number;
  totalRevenue: number;
  averageContractValue: number;
}

export interface CustomerContractFilters {
  search?: string;
  status?: string;
  contractType?: string;
  customer?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Simplified interfaces for dropdowns and forms
export interface CustomerOption {
  _id: string;
  name: string;
  email: string;
}

export interface ObjectOption {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    municipality: string;
    country: string;
  };
  type: string;
}

export interface EmployeeOption {
  _id: string;
  name: string;
  position: string;
  specialties: string[];
}
