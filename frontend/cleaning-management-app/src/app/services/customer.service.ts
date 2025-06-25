import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Customer } from '../models/customer.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = '/api/customers';
  private customersSubject = new BehaviorSubject<Customer[]>([]);
  customers$ = this.customersSubject.asObservable();

  // Predefined options for dropdowns
  readonly customerTypes = ['Residential', 'Commercial'];
  readonly statusTypes = ['Active', 'Inactive', 'Pending'];
  readonly contactMethods = ['Email', 'Phone', 'Text'];
  readonly paymentMethods = ['Credit Card', 'Bank Transfer', 'Check', 'Cash'];
  readonly billingCycles = ['Weekly', 'Bi-weekly', 'Monthly', 'Quarterly'];
  readonly timePreferences = ['Morning', 'Afternoon', 'Evening', 'Flexible'];
  readonly dayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  readonly referralSources = [
    'Google Search',
    'Social Media',
    'Referral from Friend',
    'Flyers/Advertisements',
    'Website',
    'Yellow Pages',
    'Other'
  ];
  readonly availableTags = [
    'VIP Customer',
    'High Value',
    'Frequent Service',
    'Special Requirements',
    'Pet Owner',
    'Key Access',
    'Elderly Client',
    'New Customer',
    'Seasonal Service',
    'Corporate Account'
  ];

  constructor(private http: HttpClient) {
    // Load customers from API on service initialization
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.getCustomers().subscribe();
  }

  getCustomers(): Observable<Customer[]> {
    console.log('📡 Fetching customers from API:', this.apiUrl);
    
    return this.http.get<Customer[] | {customers: Customer[], total: number}>(`${this.apiUrl}`).pipe(
      map(response => {
        // Handle both direct array and paginated responses
        if (Array.isArray(response)) {
          return response;
        } else if (response && (response as any).customers) {
          return (response as any).customers;
        } else {
          return [];
        }
      }),
      tap(customers => {
        console.log('✅ Customers loaded from API:', customers.length);
        this.customersSubject.next(customers);
      })
    );
  }

  getCustomer(id: string): Observable<Customer> {
    console.log('📡 Fetching customer from API:', id);
    return this.http.get<Customer>(`${this.apiUrl}/${id}`).pipe(
      tap(customer => {
        console.log('✅ Customer loaded from API:', customer.firstName, customer.lastName);
      })
    );
  }

  createCustomer(customerData: Omit<Customer, '_id'>): Observable<Customer> {
    console.log('📡 Creating customer via API:', customerData);
    return this.http.post<Customer>(this.apiUrl, customerData).pipe(
      tap(newCustomer => {
        console.log('✅ Customer created via API:', newCustomer._id);
        // Refresh the customers list
        this.loadCustomers();
      })
    );
  }

  updateCustomer(id: string, customerData: Partial<Customer>): Observable<Customer> {
    console.log('📡 Updating customer via API:', id, customerData);
    return this.http.put<Customer>(`${this.apiUrl}/${id}`, customerData).pipe(
      tap(updatedCustomer => {
        console.log('✅ Customer updated via API:', updatedCustomer._id);
        // Refresh the customers list
        this.loadCustomers();
      })
    );
  }

  deleteCustomer(id: string): Observable<void> {
    console.log('📡 Deleting customer via API:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Customer deleted via API:', id);
        // Refresh the customers list
        this.loadCustomers();
      })
    );
  }

  searchCustomers(query: string): Observable<Customer[]> {
    console.log('📡 Searching customers via API:', query);
    return this.http.get<Customer[]>(`${this.apiUrl}?search=${encodeURIComponent(query)}`).pipe(
      tap(customers => {
        console.log('✅ Customer search results from API:', customers.length);
      })
    );
  }

  getCustomersByType(type: string): Observable<Customer[]> {
    console.log('📡 Fetching customers by type from API:', type);
    return this.http.get<Customer[]>(`${this.apiUrl}/type/${type}`).pipe(
      tap(customers => {
        console.log('✅ Customers by type loaded from API:', customers.length);
      })
    );
  }

  getCustomersByStatus(status: string): Observable<Customer[]> {
    console.log('📡 Fetching customers by status from API:', status);
    return this.http.get<Customer[]>(`${this.apiUrl}/status/${status}`).pipe(
      tap(customers => {
        console.log('✅ Customers by status loaded from API:', customers.length);
      })
    );
  }

  exportCustomers(): Observable<Customer[]> {
    return this.getCustomers();
  }
} 