import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';

// Auth Components
import { LoginComponent } from './components/auth/login/login.component';

// Dashboard Component
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Employee Routes
import { EmployeeListComponent } from './components/employees/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './components/employees/employee-detail/employee-detail.component';
import { EmployeeFormComponent } from './components/employees/employee-form/employee-form.component';

// Employee Contract Routes
import { EmployeeContractListComponent } from './components/employee-contracts/employee-contract-list/employee-contract-list.component';
import { EmployeeContractDetailComponent } from './components/employee-contracts/employee-contract-detail/employee-contract-detail.component';
import { EmployeeContractFormComponent } from './components/employee-contracts/employee-contract-form/employee-contract-form.component';

// Customer Routes
import { CustomerListComponent } from './components/customers/customer-list/customer-list.component';
import { CustomerDetailComponent } from './components/customers/customer-detail/customer-detail.component';
import { CustomerFormComponent } from './components/customers/customer-form/customer-form.component';

// Object Routes
import { ObjectListComponent } from './components/objects/object-list/object-list.component';
import { ObjectDetailComponent } from './components/objects/object-detail/object-detail.component';
import { ObjectFormComponent } from './components/objects/object-form/object-form.component';

// Customer Contract Routes
import { CustomerContractListComponent } from './components/customer-contracts/customer-contract-list/customer-contract-list.component';
import { CustomerContractDetailComponent } from './components/customer-contracts/customer-contract-detail/customer-contract-detail.component';
import { CustomerContractFormComponent } from './components/customer-contracts/customer-contract-form/customer-contract-form.component';

// Schedule Routes
import { ScheduleListComponent } from './components/schedules/schedule-list/schedule-list.component';
import { ScheduleDetailComponent } from './components/schedules/schedule-detail/schedule-detail.component';

// Invoice Routes
import { InvoiceListComponent } from './components/invoices/invoice-list/invoice-list.component';
import { InvoiceDetailComponent } from './components/invoices/invoice-detail/invoice-detail.component';

const routes: Routes = [
  // Auth routes (public)
  { path: 'login', component: LoginComponent },

  // Default redirect (no canActivate here)
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Protected routes
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },

  // Employee routes
  {
    path: 'employees',
    component: EmployeeListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'employees/new',
    component: EmployeeFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'employees/edit/:id',
    component: EmployeeFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'employees/:id',
    component: EmployeeDetailComponent,
    canActivate: [AuthGuard],
  },

  // Employee Contract routes
  {
    path: 'employee-contracts',
    component: EmployeeContractListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'employee-contracts/new',
    component: EmployeeContractFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'employee-contracts/edit/:id',
    component: EmployeeContractFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'employee-contracts/:id',
    component: EmployeeContractDetailComponent,
    canActivate: [AuthGuard],
  },

  // Customer routes
  {
    path: 'customers',
    component: CustomerListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customers/new',
    component: CustomerFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customers/edit/:id',
    component: CustomerFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customers/:id',
    component: CustomerDetailComponent,
    canActivate: [AuthGuard],
  },

  // Object routes
  { path: 'objects', component: ObjectListComponent, canActivate: [AuthGuard] },
  {
    path: 'objects/new',
    component: ObjectFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'objects/:id/edit',
    component: ObjectFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'objects/:id',
    component: ObjectDetailComponent,
    canActivate: [AuthGuard],
  },

  // Customer Contract routes
  {
    path: 'customer-contracts',
    component: CustomerContractListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customer-contracts/new',
    component: CustomerContractFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customer-contracts/:id/edit',
    component: CustomerContractFormComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'customer-contracts/:id',
    component: CustomerContractDetailComponent,
    canActivate: [AuthGuard],
  },

  // Schedule routes
  {
    path: 'schedules',
    component: ScheduleListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'schedules/:id',
    component: ScheduleDetailComponent,
    canActivate: [AuthGuard],
  },

  // Invoice routes
  {
    path: 'invoices',
    component: InvoiceListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invoices/new',
    component: InvoiceDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invoices/:id/edit',
    component: InvoiceDetailComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'invoices/:id',
    component: InvoiceDetailComponent,
    canActivate: [AuthGuard],
  },

  // Catch all route - redirect to login if not authenticated
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
