import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Material Design Imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';

// Third-party modules

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Auth Components
import { LoginComponent } from './components/auth/login/login.component';

// Other Components
import { EmployeeListComponent } from './components/employees/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './components/employees/employee-detail/employee-detail.component';
import { EmployeeContractListComponent } from './components/employee-contracts/employee-contract-list/employee-contract-list.component';
import { EmployeeContractDetailComponent } from './components/employee-contracts/employee-contract-detail/employee-contract-detail.component';
import { EmployeeContractFormComponent } from './components/employee-contracts/employee-contract-form/employee-contract-form.component';
import { CustomerListComponent } from './components/customers/customer-list/customer-list.component';
import { CustomerDetailComponent } from './components/customers/customer-detail/customer-detail.component';
import { CustomerFormComponent } from './components/customers/customer-form/customer-form.component';
import { ObjectListComponent } from './components/objects/object-list/object-list.component';
import { ObjectDetailComponent } from './components/objects/object-detail/object-detail.component';
import { ObjectFormComponent } from './components/objects/object-form/object-form.component';
import { CustomerContractListComponent } from './components/customer-contracts/customer-contract-list/customer-contract-list.component';
import { CustomerContractDetailComponent } from './components/customer-contracts/customer-contract-detail/customer-contract-detail.component';
import { CustomerContractFormComponent } from './components/customer-contracts/customer-contract-form/customer-contract-form.component';
import { ScheduleListComponent } from './components/schedules/schedule-list/schedule-list.component';
import { ScheduleDetailComponent } from './components/schedules/schedule-detail/schedule-detail.component';
import { InvoiceListComponent } from './components/invoices/invoice-list/invoice-list.component';
import { InvoiceDetailComponent } from './components/invoices/invoice-detail/invoice-detail.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FooterComponent } from './components/footer/footer.component';
import { EmployeeFormComponent } from './components/employees/employee-form/employee-form.component';
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EmployeeListComponent,
    EmployeeDetailComponent,
    EmployeeContractListComponent,
    EmployeeContractDetailComponent,
    EmployeeContractFormComponent,
    CustomerListComponent,
    CustomerDetailComponent,
    CustomerFormComponent,
    ObjectListComponent,
    ObjectDetailComponent,
    ObjectFormComponent,
    CustomerContractListComponent,
    CustomerContractDetailComponent,
    CustomerContractFormComponent,
    ScheduleListComponent,
    ScheduleDetailComponent,
    InvoiceListComponent,
    InvoiceDetailComponent,
    DashboardComponent,
    FooterComponent,
    EmployeeFormComponent,
    ConfirmDialogComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    CommonModule,
    DragDropModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatBadgeModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatTabsModule,
    MatRadioModule,
    MatCheckboxModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatExpansionModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
