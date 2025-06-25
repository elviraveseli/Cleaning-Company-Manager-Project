import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface CustomerObject {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    municipality: string;
    country: string;
  };
  type: string;
}

interface DialogData {
  customer: {
    name: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      municipality: string;
      country: string;
    };
  };
  objects: CustomerObject[];
}

@Component({
  selector: 'app-customer-details-dialog',
  template: `
    <h2 mat-dialog-title>Customer Details</h2>
    <mat-dialog-content>
      <div class="customer-info">
        <h3>{{ data.customer.name }}</h3>
        <p><strong>Email:</strong> {{ data.customer.email }}</p>
        <p><strong>Phone:</strong> {{ data.customer.phone }}</p>
        <div *ngIf="data.customer.address">
          <p><strong>Address:</strong></p>
          <p>
            {{ data.customer.address.street }}<br>
            {{ data.customer.address.city }}, {{ data.customer.address.municipality }}<br>
            {{ data.customer.address.country }}
          </p>
        </div>
      </div>

      <div class="objects-list" *ngIf="data.objects.length > 0">
        <h3>Customer Objects</h3>
        <mat-list>
          <mat-list-item *ngFor="let object of data.objects">
            <mat-icon matListItemIcon>{{ getObjectIcon(object.type) }}</mat-icon>
            <div matListItemTitle>{{ object.name }}</div>
            <div matListItemLine>{{ object.address.street }}, {{ object.address.city }}</div>
          </mat-list-item>
        </mat-list>
      </div>
      <p *ngIf="data.objects.length === 0" class="no-objects">No objects found for this customer.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .customer-info {
      margin-bottom: 24px;
    }
    .customer-info h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
    }
    .objects-list {
      margin-top: 24px;
    }
    .objects-list h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
    }
    .no-objects {
      color: #666;
      font-style: italic;
    }
    mat-list-item {
      margin-bottom: 8px;
    }
  `]
})
export class CustomerDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CustomerDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  getObjectIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'house':
      case 'residential':
        return 'home';
      case 'office':
      case 'commercial':
        return 'business';
      case 'apartment':
        return 'apartment';
      case 'store':
        return 'storefront';
      default:
        return 'location_on';
    }
  }
} 