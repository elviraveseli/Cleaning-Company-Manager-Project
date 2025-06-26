import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { EmployeeContract } from '../models/employee-contract.model';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class EmployeeContractService {
  private apiUrl = `${environment.apiUrl}/employee-contracts`;
  private contractsSubject = new BehaviorSubject<EmployeeContract[]>([]);
  contracts$ = this.contractsSubject.asObservable();

  readonly contractTypes = ['Full-time', 'Part-time', 'Temporary', 'Contract'];

  readonly paymentFrequencies = ['Weekly', 'Bi-weekly', 'Monthly'];

  readonly scheduleTypes = ['Fixed', 'Flexible'];

  readonly documentTypes = [
    'Contract Agreement',
    'NDA',
    'Benefits Documentation',
    'Performance Reviews',
    'Amendments',
  ];

  readonly statusTypes = ['Active', 'Expired', 'Terminated'];

  constructor(private http: HttpClient) {
    // Load contracts from API on service initialization
    this.loadContracts();
  }

  private loadContracts(): void {
    this.getContracts().subscribe();
  }

  getContracts(): Observable<EmployeeContract[]> {
    console.log('📡 Fetching employee contracts from API:', this.apiUrl);

    // Add a timestamp parameter to prevent caching issues
    const params = new HttpParams().set('_t', Date.now().toString());

    return this.http
      .get<
        EmployeeContract[] | { contracts: EmployeeContract[]; total: number }
      >(`${this.apiUrl}`, { params })
      .pipe(
        map((response) => {
          // Handle both direct array and paginated responses
          if (Array.isArray(response)) {
            return response;
          } else if (response && (response as any).contracts) {
            return (response as any).contracts;
          } else {
            return [];
          }
        }),
        tap((contracts) => {
          console.log(
            '✅ Employee contracts loaded from API:',
            contracts.length
          );
          this.contractsSubject.next(contracts);
        }),
        catchError((error) => {
          console.error('❌ Error fetching employee contracts:', error);
          // Log more detailed error information
          console.error('Error details:', error.status, error.statusText, error.message);
          console.error('API URL:', this.apiUrl);
          // Return empty array instead of failing
          this.contractsSubject.next([]);
          return of([]);
        })
      );
  }

  getContract(id: string): Observable<EmployeeContract> {
    console.log('📡 Fetching employee contract from API:', id);
    
    // Add a timestamp parameter to prevent caching issues
    const params = new HttpParams().set('_t', Date.now().toString());
    
    return this.http.get<EmployeeContract>(`${this.apiUrl}/${id}`, { params }).pipe(
      tap((contract) => {
        console.log(
          '✅ Employee contract loaded from API:',
          contract.employeeId
        );
      }),
      catchError((error) => {
        console.error(`❌ Error fetching employee contract ${id}:`, error);
        console.error('Error details:', error.status, error.statusText, error.message);
        console.error('API URL:', `${this.apiUrl}/${id}`);
        return throwError(() => new Error(`Failed to load contract: ${error.message || error}`));
      })
    );
  }

  createContract(
    contract: Omit<EmployeeContract, '_id' | 'createdAt' | 'updatedAt'>
  ): Observable<EmployeeContract> {
    console.log('📡 Creating employee contract via API:', contract);
    
    // Ensure we have all required fields before sending to API
    if (!contract.employeeId || !contract.contractType || !contract.startDate) {
      console.error('❌ Missing required fields for employee contract');
      return throwError(() => new Error('Missing required fields for employee contract'));
    }
    
    return this.http.post<EmployeeContract>(this.apiUrl, contract).pipe(
      tap((newContract) => {
        console.log('✅ Employee contract created via API:', newContract._id);
        // Refresh the contracts list
        this.loadContracts();
      }),
      catchError((error) => {
        console.error('❌ Error creating employee contract:', error);
        console.error('Error details:', error.status, error.statusText);
        console.error('Request payload:', JSON.stringify(contract, null, 2));
        return throwError(() => new Error('Error creating contract: ' + (error.error?.message || error.message || 'Unknown error')));
      })
    );
  }

  updateContract(
    id: string,
    contract: Partial<EmployeeContract>
  ): Observable<EmployeeContract> {
    console.log('📡 Updating employee contract via API:', id, contract);
    return this.http
      .put<EmployeeContract>(`${this.apiUrl}/${id}`, contract)
      .pipe(
        tap((updatedContract) => {
          console.log(
            '✅ Employee contract updated via API:',
            updatedContract._id
          );
          // Refresh the contracts list
          this.loadContracts();
        }),
        catchError((error) => {
          console.error(`❌ Error updating employee contract ${id}:`, error);
          console.error('Error details:', error.status, error.statusText);
          console.error('Request payload:', JSON.stringify(contract, null, 2));
          return throwError(() => new Error('Error updating contract: ' + (error.error?.message || error.message || 'Unknown error')));
        })
      );
  }

  deleteContract(id: string): Observable<void> {
    console.log('📡 Deleting employee contract via API:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Employee contract deleted via API:', id);
        // Refresh the contracts list
        this.loadContracts();
      }),
      catchError((error) => {
        console.error(`❌ Error deleting employee contract ${id}:`, error);
        console.error('Error details:', error.status, error.statusText);
        return throwError(() => new Error('Error deleting contract: ' + (error.error?.message || error.message || 'Unknown error')));
      })
    );
  }

  getActiveContracts(): Observable<EmployeeContract[]> {
    console.log('📡 Fetching active employee contracts');
    return this.getContracts().pipe(
      map((contracts) =>
        contracts.filter((contract) => contract.status === 'Active')
      ),
      tap(contracts => console.log('✅ Active contracts loaded:', contracts.length))
    );
  }

  getExpiredContracts(): Observable<EmployeeContract[]> {
    console.log('📡 Fetching expired employee contracts');
    return this.getContracts().pipe(
      map((contracts) =>
        contracts.filter((contract) => contract.status === 'Expired')
      ),
      tap(contracts => console.log('✅ Expired contracts loaded:', contracts.length))
    );
  }

  getContractsByEmployee(employeeId: string): Observable<EmployeeContract[]> {
    console.log('📡 Fetching contracts by employee from API:', employeeId);
    
    // Add a timestamp parameter to prevent caching issues
    const params = new HttpParams().set('_t', Date.now().toString());
    
    // First try the specific endpoint
    return this.http
      .get<EmployeeContract[]>(`${this.apiUrl}/employee/${employeeId}`, { params })
      .pipe(
        tap((contracts) => {
          console.log(
            '✅ Employee contracts by employee loaded from API:',
            contracts.length
          );
        }),
        catchError((error) => {
          console.error(`❌ Error fetching contracts for employee ${employeeId} from specific endpoint:`, error);
          console.log('🔄 Falling back to filtering all contracts...');
          
          // Fallback: get all contracts and filter client-side
          return this.getContracts().pipe(
            map(contracts => contracts.filter(contract => contract.employeeId === employeeId)),
            tap(contracts => console.log('✅ Filtered contracts by employee:', contracts.length))
          );
        })
      );
  }

  terminateContract(
    id: string,
    reason: string,
    notes: string
  ): Observable<EmployeeContract> {
    const terminationData = {
      status: 'Terminated' as const,
      terminationDetails: {
        date: new Date(),
        reason: reason,
        notes: notes,
      },
    };
    return this.updateContract(id, terminationData);
  }

  renewContract(id: string, newEndDate?: Date): Observable<EmployeeContract> {
    const renewalData = {
      status: 'Active' as const,
      endDate: newEndDate,
      terminationDetails: undefined,
    };
    return this.updateContract(id, renewalData);
  }
}
