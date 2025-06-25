import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InvoiceService } from '../../../services/invoice.service';
import { Invoice, PaymentMethod, PaymentMethodEnum } from '../../../models/invoice.model';

@Component({
  selector: 'app-invoice-payment',
  template: `
    <div class="payment-container" *ngIf="!loading">
      <mat-card class="payment-card" *ngIf="invoice">
        <mat-card-header>
          <mat-card-title>Invoice Payment</mat-card-title>
          <mat-card-subtitle>Invoice #{{ invoice.invoiceNumber }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="invoice-details">
            <h3>Invoice Details</h3>
            <p><strong>Customer:</strong> {{ invoice.customer.name }}</p>
            <p><strong>Issue Date:</strong> {{ invoice.issueDate | date }}</p>
            <p><strong>Due Date:</strong> {{ invoice.dueDate | date }}</p>
            <p><strong>Amount:</strong> €{{ invoice.totalAmount.toFixed(2) }}</p>
            <p><strong>Status:</strong> {{ invoice.status }}</p>
          </div>

          <div class="payment-section" *ngIf="invoice.status !== 'Paid'">
            <h3>Payment Options</h3>
            <mat-form-field appearance="outline">
              <mat-label>Payment Method</mat-label>
              <mat-select [(ngModel)]="selectedPaymentMethod">
                <mat-option [value]="PaymentMethodEnum.Cash">Cash</mat-option>
                <mat-option [value]="PaymentMethodEnum.BankTransfer">Bank Transfer</mat-option>
                <mat-option [value]="PaymentMethodEnum.ProCreditBank">ProCredit Bank</mat-option>
                <mat-option [value]="PaymentMethodEnum.TEBBank">TEB Bank</mat-option>
                <mat-option [value]="PaymentMethodEnum.NLBBank">NLB Bank</mat-option>
                <mat-option [value]="PaymentMethodEnum.BKTBank">BKT Bank</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="confirmPayment()" [disabled]="!selectedPaymentMethod">
              Confirm Payment
            </button>
          </div>

          <div class="payment-complete" *ngIf="invoice.status === 'Paid'">
            <mat-icon color="primary">check_circle</mat-icon>
            <h3>Payment Complete</h3>
            <p>Thank you for your payment!</p>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="error-card" *ngIf="error">
        <mat-card-content>
          <mat-icon color="warn">error</mat-icon>
          <h3>Invalid Payment Link</h3>
          <p>This payment link is invalid or has expired.</p>
        </mat-card-content>
      </mat-card>
    </div>

    <div class="loading-container" *ngIf="loading">
      <mat-spinner diameter="40"></mat-spinner>
      <span>Verifying payment link...</span>
    </div>
  `,
  styles: [`
    .payment-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
    }

    .payment-card, .error-card {
      margin-bottom: 1rem;
    }

    .invoice-details {
      margin-bottom: 2rem;
    }

    .payment-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .payment-complete {
      text-align: center;
      color: #4caf50;
      margin: 2rem 0;
    }

    .payment-complete mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .error-card {
      text-align: center;
      color: #f44336;
    }

    .error-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 1rem;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 4rem;
    }
  `]
})
export class InvoicePaymentComponent implements OnInit {
  loading = true;
  error = false;
  invoice: Invoice | null = null;
  selectedPaymentMethod: PaymentMethod | null = null;
  protected readonly PaymentMethodEnum = PaymentMethodEnum;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private invoiceService: InvoiceService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!invoiceId || !token) {
      this.loading = false;
      this.error = true;
      return;
    }

    this.invoiceService.verifyPaymentToken(invoiceId, token).subscribe({
      next: (response) => {
        if (response.valid && response.invoice) {
          this.invoice = response.invoice;
          this.error = false;
        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error verifying payment token:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  confirmPayment() {
    if (!this.invoice?._id) return;

    this.loading = true;
    this.invoiceService.markAsPaid(this.invoice._id).subscribe({
      next: (updatedInvoice) => {
        this.invoice = updatedInvoice;
        this.loading = false;
        this.snackBar.open('Payment confirmed successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        console.error('Error confirming payment:', error);
        this.loading = false;
        this.snackBar.open('Error confirming payment. Please try again.', 'Close', {
          duration: 5000
        });
      }
    });
  }
} 