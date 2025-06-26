import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { EmployeeContract } from '../models/employee-contract.model';
import { environment } from 'src/environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class EmployeeContractService {
  private apiUrl = '${environment.apiUrl}/employee-contracts';
  private contractsSubject = new BehaviorSubject<EmployeeContract[]>([]);
  contracts$ = this.contractsSubject.asObservable();

  readonly contractTypes = [
    'Full-time',
    'Part-time',
    'Temporary',
    'Contract'
  ];

  readonly paymentFrequencies = [
    'Weekly',
    'Bi-weekly',
    'Monthly'
  ];

  readonly scheduleTypes = [
    'Fixed',
    'Flexible'
  ];

  readonly documentTypes = [
    'Contract Agreement',
    'NDA',
    'Benefits Documentation',
    'Performance Reviews',
    'Amendments'
  ];

  readonly statusTypes = [
    'Active',
    'Expired',
    'Terminated'
  ];

  constructor(private http: HttpClient) {
    // Load contracts from API on service initialization
    this.loadContracts();
  }

  private loadContracts(): void {
    this.getContracts().subscribe();
  }

  getContracts(): Observable<EmployeeContract[]> {
    console.log('📡 Fetching employee contracts from API:', this.apiUrl);
    
    return this.http.get<EmployeeContract[] | {contracts: EmployeeContract[], total: number}>(`${this.apiUrl}`).pipe(
      map(response => {
        // Handle both direct array and paginated responses
        if (Array.isArray(response)) {
          return response;
        } else if (response && (response as any).contracts) {
          return (response as any).contracts;
        } else {
          return [];
        }
      }),
      tap(contracts => {
        console.log('✅ Employee contracts loaded from API:', contracts.length);
        this.contractsSubject.next(contracts);
      })
    );
  }

  getContract(id: string): Observable<EmployeeContract> {
    console.log('📡 Fetching employee contract from API:', id);
    return this.http.get<EmployeeContract>(`${this.apiUrl}/${id}`).pipe(
      tap(contract => {
        console.log('✅ Employee contract loaded from API:', contract.employeeId);
      })
    );
  }

  createContract(contract: Omit<EmployeeContract, '_id' | 'createdAt' | 'updatedAt'>): Observable<EmployeeContract> {
    console.log('📡 Creating employee contract via API:', contract);
    return this.http.post<EmployeeContract>(this.apiUrl, contract).pipe(
      tap(newContract => {
        console.log('✅ Employee contract created via API:', newContract._id);
        // Refresh the contracts list
        this.loadContracts();
      })
    );
  }

  updateContract(id: string, contract: Partial<EmployeeContract>): Observable<EmployeeContract> {
    console.log('📡 Updating employee contract via API:', id, contract);
    return this.http.put<EmployeeContract>(`${this.apiUrl}/${id}`, contract).pipe(
      tap(updatedContract => {
        console.log('✅ Employee contract updated via API:', updatedContract._id);
        // Refresh the contracts list
        this.loadContracts();
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
      })
    );
  }

  getActiveContracts(): Observable<EmployeeContract[]> {
    return this.getContracts().pipe(
      map(contracts => contracts.filter(contract => contract.status === 'Active'))
    );
  }

  getExpiredContracts(): Observable<EmployeeContract[]> {
    return this.getContracts().pipe(
      map(contracts => contracts.filter(contract => contract.status === 'Expired'))
    );
  }

  getContractsByEmployee(employeeId: string): Observable<EmployeeContract[]> {
    console.log('📡 Fetching contracts by employee from API:', employeeId);
    return this.http.get<EmployeeContract[]>(`${this.apiUrl}/employee/${employeeId}`).pipe(
      tap(contracts => {
        console.log('✅ Employee contracts by employee loaded from API:', contracts.length);
      })
    );
  }

  terminateContract(id: string, reason: string, notes: string): Observable<EmployeeContract> {
    const terminationData = {
      status: 'Terminated' as const,
      terminationDetails: {
        date: new Date(),
        reason: reason,
        notes: notes
      }
    };
    return this.updateContract(id, terminationData);
  }

  renewContract(id: string, newEndDate?: Date): Observable<EmployeeContract> {
    const renewalData = {
      status: 'Active' as const,
      endDate: newEndDate,
      terminationDetails: undefined
    };
    return this.updateContract(id, renewalData);
  }
} 
