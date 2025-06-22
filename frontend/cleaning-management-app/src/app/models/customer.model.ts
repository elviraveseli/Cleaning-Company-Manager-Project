export interface Customer {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Virtual field from backend
  name?: string; // For compatibility with components expecting 'name' field
  email: string;
  phone: string;
  address: string;
  city: string;
  municipality: string;
  company?: string;
  nipt?: string; // Kosovo tax identification number (9 digits)
  customerType:
    | 'Residential'
    | 'Individual Business'
    | 'General Partnership'
    | 'Limited Partnership'
    | 'Limited Liability Company'
    | 'Joint Stock Company';
  status: 'Active' | 'Inactive' | 'Pending';
  preferredContactMethod: 'Email' | 'Phone' | 'Text' | 'WhatsApp';
  notes: string;
  registrationDate: Date;
  lastServiceDate?: Date;
  totalContracts: number;
  totalRevenue: number;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  billingAddress?: {
    address: string;
    city: string;
    municipality: string;
    sameAsService: boolean;
  };
  paymentInfo?: {
    preferredMethod:
      | 'Bank Transfer'
      | 'Cash'
      | 'ProCredit Bank'
      | 'TEB Bank'
      | 'NLB Bank'
      | 'BKT Bank'
      | 'Raiffeisen Bank';
    billingCycle: 'Weekly' | 'Bi-weekly' | 'Monthly' | 'Quarterly';
    autoPayEnabled: boolean;
    bankAccount?: {
      bankName:
        | 'ProCredit Bank'
        | 'TEB Bank'
        | 'NLB Bank'
        | 'BKT Bank'
        | 'Raiffeisen Bank'
        | 'Other';
      accountNumber: string;
      iban?: string; // Kosovo IBAN format
    };
  };
  servicePreferences?: {
    timePreference: 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';
    dayPreference: string[];
    specialInstructions: string;
    keyAccess: boolean;
    petInstructions?: string;
  };
  referralSource?: string;
  tags: string[];
}

// Kosovo municipalities list for use in forms
export const KOSOVO_MUNICIPALITIES = [
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

// Kosovo banks list for payment methods
export const KOSOVO_BANKS = [
  'ProCredit Bank',
  'TEB Bank',
  'NLB Bank',
  'BKT Bank',
  'Raiffeisen Bank',
  'Other',
];

// Kosovo business types
export const KOSOVO_BUSINESS_TYPES = [
  'Residential',
  'Individual Business',
  'General Partnership',
  'Limited Partnership',
  'Limited Liability Company',
  'Joint Stock Company',
];

// Kosovo media/referral sources
export const KOSOVO_REFERRAL_SOURCES = [
  'Google Search',
  'Facebook',
  'Instagram',
  'Referral from Friend',
  'Flyers/Advertisements',
  'Website',
  'Telegrafi',
  'Express',
  'Koha Ditore',
  'RTK',
  'Other',
];
