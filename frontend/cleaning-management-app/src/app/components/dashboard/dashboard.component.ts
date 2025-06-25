import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  DashboardService,
  DashboardStats,
} from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/auth.model';

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

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  loading = true;
  timeFilter: 'week' | 'month' = 'week';
  currentUser: User | null = null;

  // Real data from database
  totalEmployees = 0;
  activeContracts = 0;
  totalLocations = 0;
  todaysTasks = 0;

  recentActivities: Activity[] = [];
  upcomingTasks: Task[] = [];

  // Performance metrics
  completionRate = 0;
  averageRating = 0;
  totalRevenue = 0;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.currentUser = this.authService.getCurrentUser();
    
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  loadDashboardData(): void {
    this.loading = true;
    this.dashboardService.getDashboardStats(this.timeFilter).subscribe({
      next: (stats: DashboardStats) => {
        this.totalEmployees = stats.totalEmployees;
        this.activeContracts = stats.activeContracts;
        this.totalLocations = stats.totalLocations;
        this.todaysTasks = stats.todaysTasks;
        this.recentActivities = stats.recentActivities;
        this.upcomingTasks = stats.upcomingTasks;
        this.completionRate = stats.performance.completionRate;
        this.averageRating = stats.performance.averageRating;
        this.totalRevenue = stats.performance.totalRevenue;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.loading = false;
        // Keep static data as fallback
        this.setFallbackData();
      },
    });
  }

  private setFallbackData(): void {
    this.totalEmployees = 0;
    this.activeContracts = 0;
    this.totalLocations = 0;
    this.todaysTasks = 0;
    this.completionRate = 0;
    this.averageRating = 0;
    this.totalRevenue = 0;

    this.recentActivities = [
      {
        icon: 'info',
        type: 'info',
        title: 'Unable to load recent activities',
        time: 'Just now',
      },
    ];

    this.upcomingTasks = [];
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sq-XK', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // New methods for time filter and view all functionality
  viewAllActivities(): void {
    this.router.navigate(['/activities']); // You'll need to create this route and component
  }
}
