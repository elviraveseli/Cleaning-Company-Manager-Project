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
  paymentTerms: 'Net 15' | 'Net 30' | 'Net 60' | 'Due on Receipt';
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
  address: string;
  type: string;
}

export interface EmployeeOption {
  _id: string;
  name: string;
  position: string;
  specialties: string[];
}
