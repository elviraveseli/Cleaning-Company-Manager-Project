export interface ObjectLocation {
  _id: string;
  customerId: string; // Reference to the customer who owns this object
  name: string;
  type:
    | 'Office'
    | 'Residential'
    | 'Commercial'
    | 'Industrial'
    | 'Healthcare'
    | 'Educational'
    | 'Other';
  address: {
    street: string;
    city: string;
    municipality: string;
    country: string;
  };
  contactPerson: {
    name: string;
    phone: string;
    email?: string;
  };
  size?: {
    area: number;
    unit: 'sqm' | 'sqft';
  };
  floors: number;
  rooms: number;
  specialRequirements: (
    | 'Eco-friendly Products'
    | '24/7 Access'
    | 'Security Clearance'
    | 'Special Equipment'
    | 'Hazardous Materials'
    | 'EU Standards Compliance'
  )[];
  cleaningFrequency: 'Daily' | 'Weekly' | 'Bi-weekly' | 'Monthly' | 'As Needed';
  estimatedCleaningTime: number; // in hours
  status: 'Active' | 'Inactive' | 'Under Maintenance';
  notes?: string;
  photos?: {
    fileName: string;
    uploadDate: Date;
  }[];
  fullAddress?: string; // virtual field
  createdAt: Date;
  updatedAt: Date;
}

export interface ObjectStats {
  total: number;
  active: number;
  inactive: number;
  underMaintenance: number;
  byType: { [key: string]: number };
  byCity: { [key: string]: number };
  totalArea: number;
  averageCleaningTime: number;
}

export interface ObjectFilters {
  search?: string;
  status?: string;
  type?: string;
  city?: string;
}
