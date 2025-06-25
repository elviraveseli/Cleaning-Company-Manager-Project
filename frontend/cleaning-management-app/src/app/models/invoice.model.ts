export interface Invoice {
  _id?: string;
  invoiceNumber: string;
  objectId?: string;
  customerContract: string | CustomerContractInfo;
  customer: CustomerInfo;
  issueDate: Date | string;
  dueDate: Date | string;
  services: InvoiceService[];
  currency: 'EUR'; // Kosovo uses Euro
  subtotal: number;
  taxRate: 0 | 8 | 18; // Kosovo VAT rates: 0% (exempt), 8% (reduced), 18% (standard)
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  remainingBalance?: number; // Virtual field
  formattedAmount?: string; // Virtual field in Euro format
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: Date | string;
  bankTransferDetails?: BankTransferDetails;
  notes?: string;
  terms?: string;
  attachments?: InvoiceAttachment[];
  taxCompliance?: TaxCompliance;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  nipt?: string; // Kosovo business tax identification number
  address?: CustomerAddress;
}

export interface CustomerAddress {
  street?: string;
  city?: string;
  municipality?: string; // Kosovo municipalities instead of state
  country?: string;
}

// Kosovo bank transfer details
export interface BankTransferDetails {
  bankName: Extract<PaymentMethod, 
    | PaymentMethodEnum.ProCreditBank 
    | PaymentMethodEnum.TEBBank 
    | PaymentMethodEnum.NLBBank 
    | PaymentMethodEnum.BKTBank 
    | PaymentMethodEnum.RaiffeisenBank> | 'Other';
  accountNumber?: string;
  iban?: string; // Kosovo IBAN format
  reference?: string;
}

// Kosovo tax compliance
export interface TaxCompliance {
  vatRegistered: boolean;
  vatNumber?: string; // Same as NIPT for VAT registered businesses
  fiscalVerificationCode?: string;
}

export interface CustomerContractInfo {
  _id: string;
  contractNumber: string;
  customer: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    nipt?: string;
  };
  objects?: any[];
  services?: any[];
}

export interface InvoiceService {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceAttachment {
  fileName: string;
  uploadDate: Date | string;
}

export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Paid'
  | 'Overdue'
  | 'Cancelled'
  | 'Partially Paid';

// Kosovo payment methods
export enum PaymentMethodEnum {
  Cash = 'Cash',
  BankTransfer = 'Bank Transfer',
  ProCreditBank = 'ProCredit Bank',
  TEBBank = 'TEB Bank',
  NLBBank = 'NLB Bank',
  BKTBank = 'BKT Bank',
  RaiffeisenBank = 'Raiffeisen Bank',
  OnlinePayment = 'Online Payment'
}

export type PaymentMethod = `${PaymentMethodEnum}`;

// Helper interfaces for forms and operations
export interface InvoiceFormData {
  customerContract: CustomerContractInfo;
  customer: CustomerInfo;
  dueDate: Date;
  services: InvoiceService[];
  taxRate: 0 | 8 | 18;
  discount: number;
  notes?: string;
  terms?: string;
  bankTransferDetails?: BankTransferDetails;
  taxCompliance?: TaxCompliance;
}

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  dateFrom?: string;
  dateTo?: string;
  municipality?: string; // Filter by Kosovo municipality
  nipt?: string; // Filter by business NIPT
}

export interface InvoiceListResponse {
  invoices: Invoice[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface PaymentUpdate {
  paidAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  bankTransferDetails?: BankTransferDetails;
}

// Interface for invoice statistics
export interface InvoiceStats {
  totalInvoices: number;
  totalRevenue: number;
  paidInvoices: number;
  overdue: number;
  pending: number;
  averageInvoiceValue: number;
  revenueByMunicipality: { [municipality: string]: number };
  vatCollected: number; // Total VAT collected
}

// Interface for creating invoice from contract
export interface CreateInvoiceFromContract {
  contractId: string;
  dueDate: Date;
  services: InvoiceService[];
  taxRate?: 0 | 8 | 18;
  discount?: number;
  notes?: string;
  bankTransferDetails?: BankTransferDetails;
}

// Kosovo-specific constants
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

export const KOSOVO_VAT_RATES = [
  { value: 0, label: '0% (Exempt)' },
  { value: 8, label: '8% (Reduced Rate)' },
  { value: 18, label: '18% (Standard Rate)' },
];

export const KOSOVO_BANKS = [
  'ProCredit Bank',
  'TEB Bank',
  'NLB Bank',
  'BKT Bank',
  'Raiffeisen Bank',
  'Other',
];

export const KOSOVO_PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank Transfer',
  'ProCredit Bank',
  'TEB Bank',
  'NLB Bank',
  'BKT Bank',
  'Raiffeisen Bank',
  'Online Payment',
];
