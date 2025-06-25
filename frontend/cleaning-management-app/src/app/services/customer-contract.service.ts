import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  CustomerContract,
  CustomerContractStats,
  CustomerContractFilters,
  CustomerOption,
  ObjectOption,
  EmployeeOption,
} from '../models/customer-contract.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerContractService {
  private apiUrl = '/api/customer-contracts';
  private contractsSubject = new BehaviorSubject<CustomerContract[]>([]);
  contracts$ = this.contractsSubject.asObservable();

  // Form options
  readonly contractTypes = ['One-time', 'Recurring', 'Long-term', 'Emergency'];
  readonly billingFrequencies = [
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'Quarterly',
    'Annually',
    'Due on Receipt',
  ];
  readonly paymentTerms = [
    'Within 10 days',
    'Within 20 days',
    'Within 30 days',
    'Within 45 days',
    'Immediate Payment',
    'In advance',
  ];
  readonly statusTypes = [
    'Active',
    'Expired',
    'Terminated',
    'Suspended',
    'Pending',
  ];
  readonly serviceFrequencies = [
    'Daily',
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'As Needed',
  ];

  constructor(private http: HttpClient) {
    this.loadContracts();
  }

  private loadContracts(): void {
    this.getContracts().subscribe({
      next: (contracts) => this.contractsSubject.next(contracts),
      error: (error) => {
        console.error('Error loading contracts:', error);
        this.contractsSubject.next([]);
      },
    });
  }

  getContracts(
    filters?: CustomerContractFilters
  ): Observable<CustomerContract[]> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.status) params = params.set('status', filters.status);
      if (filters.contractType)
        params = params.set('contractType', filters.contractType);
    }

    // Add populate parameter to ensure objects are included
    params = params.set('populate', 'objects');

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map((response) => {
        // Handle both paginated and non-paginated responses
        let contracts = [];
        if (response.contracts) {
          contracts = response.contracts;
        } else if (Array.isArray(response)) {
          contracts = response;
        }
        console.log('Loaded contracts with objects:', contracts);
        return contracts;
      }),
      tap((contracts) => this.contractsSubject.next(contracts)),
      catchError((error) => {
        console.error('Error fetching contracts:', error);
        return throwError(() => error);
      })
    );
  }

  getContract(id: string): Observable<CustomerContract> {
    return this.http.get<CustomerContract>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Error fetching contract:', error);
        return throwError(() => error);
      })
    );
  }

  createContract(
    contractData: Omit<CustomerContract, '_id' | 'createdAt' | 'updatedAt'>
  ): Observable<CustomerContract> {
    // Generate contract number if not provided
    if (!contractData.contractNumber) {
      contractData.contractNumber = this.generateContractNumber();
    }

    return this.http.post<CustomerContract>(this.apiUrl, contractData).pipe(
      tap(() => this.loadContracts()), // Refresh the contracts list
      catchError((error) => {
        console.error('Error creating contract:', error);
        return throwError(() => error);
      })
    );
  }

  updateContract(
    id: string,
    contractData: Partial<CustomerContract>
  ): Observable<CustomerContract> {
    return this.http
      .put<CustomerContract>(`${this.apiUrl}/${id}`, contractData)
      .pipe(
        tap(() => this.loadContracts()), // Refresh the contracts list
        catchError((error) => {
          console.error('Error updating contract:', error);
          return throwError(() => error);
        })
      );
  }

  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadContracts()), // Refresh the contracts list
      catchError((error) => {
        console.error('Error deleting contract:', error);
        return throwError(() => error);
      })
    );
  }

  getContractStats(): Observable<CustomerContractStats> {
    return this.getContracts().pipe(
      map((contracts) => {
        const stats: CustomerContractStats = {
          total: contracts.length,
          active: contracts.filter((c) => c.status === 'Active').length,
          pending: contracts.filter((c) => c.status === 'Pending').length,
          expired: contracts.filter((c) => c.status === 'Expired').length,
          terminated: contracts.filter((c) => c.status === 'Terminated').length,
          suspended: contracts.filter((c) => c.status === 'Suspended').length,
          totalRevenue: contracts.reduce(
            (sum, c) => sum + (c.totalAmount || 0),
            0
          ),
          averageContractValue: 0,
        };

        stats.averageContractValue =
          stats.total > 0 ? stats.totalRevenue / stats.total : 0;
        return stats;
      }),
      catchError((error) => {
        console.error('Error calculating stats:', error);
        return throwError(() => error);
      })
    );
  }

  // Get options for dropdowns
  getCustomerOptions(): Observable<CustomerOption[]> {
    return this.http.get<any[]>('/api/customers').pipe(
      map((customers) =>
        customers.map((customer) => ({
          _id: customer._id,
          name:
            customer.fullName || `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
        }))
      ),
      catchError((error) => {
        console.error('Error fetching customer options:', error);
        return throwError(() => error);
      })
    );
  }

  getCustomerObjects(customerId: string): Observable<ObjectOption[]> {
    return this.http.get<any[]>(`/api/objects?customerId=${customerId}`).pipe(
      map((objects) =>
        objects.map((obj) => ({
          _id: obj._id,
          name: obj.name,
          address: obj.address,
          type: obj.type || 'Unknown',
        }))
      ),
      catchError((error) => {
        console.error('Error fetching customer objects:', error);
        return throwError(() => error);
      })
    );
  }

  getObjectOptions(): Observable<ObjectOption[]> {
    return this.http.get<any[]>('/api/objects').pipe(
      map((objects) =>
        objects.map((obj) => ({
          _id: obj._id,
          name: obj.name,
          address: obj.address,
          type: obj.type || 'Unknown',
        }))
      ),
      catchError((error) => {
        console.error('Error fetching object options:', error);
        return throwError(() => error);
      })
    );
  }

  getEmployeeOptions(): Observable<EmployeeOption[]> {
    return this.http.get<any[]>('/api/employees').pipe(
      map((employees) =>
        employees.map((emp) => ({
          _id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          position: emp.position,
          specialties: emp.specialties || [],
        }))
      ),
      catchError((error) => {
        console.error('Error fetching employee options:', error);
        return throwError(() => error);
      })
    );
  }

  // Email functionality
  sendContractEmail(contractId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${contractId}/send-email`, {}).pipe(
      catchError((error) => {
        console.error('Error sending contract email:', error);
        return throwError(() => error);
      })
    );
  }

  testEmailConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test/email-config`).pipe(
      catchError((error) => {
        console.error('Error testing email config:', error);
        return throwError(() => error);
      })
    );
  }

  // Export functionality
  exportToCSV(): Observable<string> {
    return this.getContracts().pipe(
      map((contracts) => {
        const headers = [
          'Contract Number',
          'Customer Name',
          'Customer Email',
          'Contract Type',
          'Status',
          'Start Date',
          'End Date',
          'Total Amount',
          'Billing Frequency',
        ];

        const rows = contracts.map((contract) => [
          contract.contractNumber || '',
          contract.customer?.name || '',
          contract.customer?.email || '',
          contract.contractType || '',
          contract.status || '',
          contract.startDate
            ? new Date(contract.startDate).toLocaleDateString()
            : '',
          contract.endDate
            ? new Date(contract.endDate).toLocaleDateString()
            : '',
          contract.totalAmount?.toString() || '0',
          contract.billingFrequency || '',
        ]);

        return [headers, ...rows]
          .map((row) => row.map((field) => `"${field}"`).join(','))
          .join('\n');
      }),
      catchError((error) => {
        console.error('Error exporting to CSV:', error);
        return throwError(() => error);
      })
    );
  }

  private generateContractNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `CC-${year}-${timestamp}`;
  }

  // Legacy methods for backward compatibility
  getCustomerContracts(): Observable<any[]> {
    return this.getContracts();
  }

  getCustomerContract(id: string): Observable<any> {
    return this.getContract(id);
  }

  createCustomerContract(contract: any): Observable<any> {
    return this.createContract(contract);
  }

  updateCustomerContract(id: string, contract: any): Observable<any> {
    return this.updateContract(id, contract);
  }

  deleteCustomerContract(id: string): Observable<any> {
    return this.deleteContract(id);
  }
}
