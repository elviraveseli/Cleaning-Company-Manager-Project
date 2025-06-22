import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalEmployees: number;
  activeContracts: number;
  totalLocations: number;
  todaysTasks: number;
  recentActivities: Activity[];
  upcomingTasks: Task[];
  performance: {
    completionRate: number;
    averageRating: number;
    totalRevenue: number;
  };
}

interface Activity {
  icon: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  time: string;
}

interface Task {
  title: string;
  time: string;
  date: string;
  location: string;
  status: 'pending' | 'completed' | 'in-progress';
  statusIcon: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000/api'}`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<DashboardStats> {
    const employees$ = this.http.get<any[]>(`${this.apiUrl}/employees`);
    const contracts$ = this.http.get<any[]>(
      `${this.apiUrl}/customer-contracts`
    );
    const locations$ = this.http.get<any[]>(`${this.apiUrl}/objects`);
    const schedules$ = this.http.get<any[]>(`${this.apiUrl}/schedules`);
    const invoices$ = this.http.get<any[]>(`${this.apiUrl}/invoices`);

    return forkJoin({
      employees: employees$,
      contracts: contracts$,
      locations: locations$,
      schedules: schedules$,
      invoices: invoices$,
    }).pipe(
      map((data) => {
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];

        // Filter today's schedules
        const todaysSchedules = data.schedules.filter((schedule) => {
          const scheduleDate = new Date(schedule.date)
            .toISOString()
            .split('T')[0];
          return scheduleDate === todayString;
        });

        // Generate recent activities from real data
        const recentActivities: Activity[] = [];

        // Add recent employees
        const recentEmployees = data.employees
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.startDate).getTime() -
              new Date(a.createdAt || a.startDate).getTime()
          )
          .slice(0, 2);

        recentEmployees.forEach((employee) => {
          recentActivities.push({
            icon: 'person_add',
            type: 'success',
            title: `New employee ${employee.firstName} ${employee.lastName} added`,
            time: this.getTimeAgo(employee.createdAt || employee.startDate),
          });
        });

        // Add recent contracts
        const recentContracts = data.contracts
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.startDate).getTime() -
              new Date(a.createdAt || a.startDate).getTime()
          )
          .slice(0, 2);

        recentContracts.forEach((contract) => {
          recentActivities.push({
            icon: 'assignment',
            type: 'info',
            title: `New contract signed - ${contract.contractNumber}`,
            time: this.getTimeAgo(contract.createdAt || contract.startDate),
          });
        });

        // Add recent completed schedules
        const recentCompletedSchedules = data.schedules
          .filter((schedule) => schedule.status === 'completed')
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.date).getTime() -
              new Date(a.updatedAt || a.date).getTime()
          )
          .slice(0, 2);

        recentCompletedSchedules.forEach((schedule) => {
          recentActivities.push({
            icon: 'cleaning_services',
            type: 'success',
            title: `Cleaning task completed at ${
              schedule.objectName || 'Location'
            }`,
            time: this.getTimeAgo(schedule.updatedAt || schedule.date),
          });
        });

        // Add recent invoices
        const recentInvoices = data.invoices
          .filter((invoice) => invoice.status === 'paid')
          .sort(
            (a, b) =>
              new Date(b.updatedAt || b.issueDate).getTime() -
              new Date(a.updatedAt || a.issueDate).getTime()
          )
          .slice(0, 1);

        recentInvoices.forEach((invoice) => {
          recentActivities.push({
            icon: 'payment',
            type: 'success',
            title: `Invoice #${invoice.invoiceNumber} paid`,
            time: this.getTimeAgo(invoice.updatedAt || invoice.issueDate),
          });
        });

        // Generate upcoming tasks from schedules
        const upcomingTasks: Task[] = data.schedules
          .filter((schedule) => {
            const scheduleDate = new Date(schedule.date);
            return scheduleDate >= today && schedule.status !== 'completed';
          })
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          )
          .slice(0, 5)
          .map((schedule) => ({
            title: schedule.task || 'Cleaning Service',
            time: schedule.time || '09:00 AM',
            date: this.formatDate(schedule.date),
            location: schedule.objectName || 'Location TBD',
            status: schedule.status || 'pending',
            statusIcon: this.getStatusIcon(schedule.status || 'pending'),
          }));

        // Calculate performance metrics from real data
        const completedSchedules = data.schedules.filter(
          (schedule) => schedule.status === 'completed'
        );
        const totalSchedules = data.schedules.length;
        const completionRate =
          totalSchedules > 0
            ? Math.round((completedSchedules.length / totalSchedules) * 100)
            : 0;

        // Calculate total revenue from paid invoices
        const totalRevenue = data.invoices
          .filter((invoice) => invoice.status === 'paid')
          .reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);

        // Calculate average rating (placeholder - would need customer feedback data)
        // For now, calculate based on completion rate and contract renewals
        const averageRating = Math.min(5, Math.max(1, completionRate / 20 + 1));

        return {
          totalEmployees: data.employees.length,
          activeContracts: data.contracts.filter((c) => c.status === 'active')
            .length,
          totalLocations: data.locations.length,
          todaysTasks: todaysSchedules.length,
          recentActivities: recentActivities.slice(0, 5),
          upcomingTasks,
          performance: {
            completionRate,
            averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            totalRevenue,
          },
        };
      })
    );
  }

  private getTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  }

  private formatDate(date: string | Date): string {
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return d.toLocaleDateString();
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'check_circle';
      case 'in-progress':
        return 'play_arrow';
      case 'pending':
      default:
        return 'schedule';
    }
  }
}
