import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  constructor(private http: HttpClient) {}

  getDashboardStats(timeFilter: 'week' | 'month' = 'week'): Observable<DashboardStats> {
    const params = new HttpParams().set('timeFilter', timeFilter);
    
    // Use the optimized dashboard endpoint with time filter
    return this.http.get<any>('/api/dashboard/stats', { params }).pipe(
      map((data) => {
        return {
          totalEmployees: data.totalEmployees,
          activeContracts: data.activeContracts,
          totalLocations: data.totalLocations,
          todaysTasks: data.todaysTasks,
          recentActivities: data.recentActivities,
          upcomingTasks: data.upcomingTasks,
          performance: data.performance,
        };
      })
    );
  }
}
