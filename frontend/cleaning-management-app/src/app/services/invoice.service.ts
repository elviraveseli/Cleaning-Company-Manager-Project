import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Invoice, 
  InvoiceListQuery, 
  InvoiceListResponse, 
  PaymentUpdate, 
  CreateInvoiceFromContract,
  InvoiceStats 
} from '../models/invoice.model';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private apiUrl = `${environment.apiUrl}/invoices`;

  constructor(private http: HttpClient) {}

  // Get HTTP headers with auth token if available
  private getHttpHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  // Handle HTTP errors
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // If it's an auth error, you might want to redirect to login
      if (error.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        // You might want to redirect to login page here
      }
      
      // Return a safe result or throw the error
      throw error;
    };
  }

  // Get all invoices with pagination and filtering
  getInvoices(query?: InvoiceListQuery): Observable<InvoiceListResponse> {
    let params = new HttpParams();
    
    if (query) {
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.search) params = params.set('search', query.search);
      if (query.status) params = params.set('status', query.status);
      if (query.dateFrom) params = params.set('dateFrom', query.dateFrom);
      if (query.dateTo) params = params.set('dateTo', query.dateTo);
    }

    return this.http.get<InvoiceListResponse>(this.apiUrl, { 
      params, 
      headers: this.getHttpHeaders() 
    }).pipe(
      catchError(this.handleError<InvoiceListResponse>('getInvoices'))
    );
  }

  // Get single invoice by ID
  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/${id}`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice>('getInvoiceById'))
    );
  }

  // Create new invoice
  createInvoice(invoice: Partial<Invoice>): Observable<Invoice> {
    console.log('Creating invoice with data:', invoice);
    
    return this.http.post<Invoice>(this.apiUrl, invoice, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice>('createInvoice'))
    );
  }

  // Update existing invoice
  updateInvoice(invoice: Partial<Invoice>): Observable<Invoice> {
    console.log('Updating invoice with data:', invoice);
    
    return this.http.put<Invoice>(`${this.apiUrl}/${invoice._id}`, invoice, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice>('updateInvoice'))
    );
  }

  // Delete invoice
  deleteInvoice(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<{ message: string }>('deleteInvoice'))
    );
  }

  // Mark invoice as paid
  markAsPaid(invoiceId: string, paymentData: any): Observable<Invoice> {
    return this.http.post<Invoice>(`${this.apiUrl}/${invoiceId}/mark-paid`, paymentData, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice>('markAsPaid'))
    );
  }

  // Send invoice via email
  sendInvoiceEmail(invoiceId: string, emailData: any): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/${invoiceId}/send-email`, emailData, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<{ message: string }>('sendInvoiceEmail'))
    );
  }

  // Generate invoice number
  generateInvoiceNumber(): Observable<{ invoiceNumber: string }> {
    return this.http.get<{ invoiceNumber: string }>(`${this.apiUrl}/generate-number`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<{ invoiceNumber: string }>('generateInvoiceNumber'))
    );
  }

  // Get invoice statistics
  getInvoiceStats(): Observable<InvoiceStats> {
    return this.http.get<InvoiceStats>(`${this.apiUrl}/stats`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<InvoiceStats>('getInvoiceStats'))
    );
  }

  // Get invoices by customer
  getInvoicesByCustomer(customerId: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/customer/${customerId}`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice[]>('getInvoicesByCustomer'))
    );
  }

  // Get invoices by contract
  getInvoicesByContract(contractId: string): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/contract/${contractId}`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice[]>('getInvoicesByContract'))
    );
  }

  // Calculate totals for invoice services
  calculateTotals(services: any[], taxRate: number = 0, discount: number = 0) {
    const subtotal = services.reduce((sum, service) => {
      return sum + (service.quantity * service.unitPrice);
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100
    };
  }

  // Legacy methods for compatibility
  updatePayment(invoiceId: string, payment: PaymentUpdate): Observable<Invoice> {
    return this.markAsPaid(invoiceId, payment);
  }

  createInvoiceFromContract(contractData: CreateInvoiceFromContract): Observable<Invoice> {
    return this.createInvoice(contractData);
  }

  exportInvoicePDF(invoiceId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${invoiceId}/pdf`, { 
      responseType: 'blob',
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Blob>('exportInvoicePDF'))
    );
  }

  markAsSent(invoiceId: string): Observable<Invoice> {
    return this.http.patch<Invoice>(`${this.apiUrl}/${invoiceId}/mark-sent`, {}, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice>('markAsSent'))
    );
  }

  getOverdueInvoices(): Observable<Invoice[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.http.get<Invoice[]>(`${this.apiUrl}/overdue?date=${today}`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice[]>('getOverdueInvoices'))
    );
  }

  getRecentInvoices(limit: number = 10): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(`${this.apiUrl}/recent?limit=${limit}`, {
      headers: this.getHttpHeaders()
    }).pipe(
      catchError(this.handleError<Invoice[]>('getRecentInvoices'))
    );
  }
} 