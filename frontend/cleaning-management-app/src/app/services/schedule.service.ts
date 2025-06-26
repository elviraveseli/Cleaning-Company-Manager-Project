import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { Schedule, ScheduleFormData } from '../models/schedule.model';

export interface ScheduleResponse {
  schedules: Schedule[];
  totalPages: number;
  currentPage: number;
  totalSchedules: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = `${environment.apiUrl}/schedules`; // Updated to use environment variable

  constructor(private http: HttpClient) {}

  getSchedules(page: number = 1, limit: number = 20): Observable<ScheduleResponse> {
    return this.http.get<ScheduleResponse>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getScheduleById(id: string): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.apiUrl}/${id}`);
  }

  createSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.post<Schedule>(this.apiUrl, schedule);
  }

  updateSchedule(schedule: Partial<Schedule>): Observable<Schedule> {
    return this.http.put<Schedule>(`${this.apiUrl}/${schedule._id}`, schedule);
  }

  deleteSchedule(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  // Additional methods for handling drag and drop
  updateScheduleDate(scheduleId: string, newDate: Date): Observable<Schedule> {
    return this.http.patch<Schedule>(`${this.apiUrl}/${scheduleId}/date`, { scheduledDate: newDate });
  }

  assignEmployeeToSchedule(scheduleId: string, employeeId: string): Observable<Schedule> {
    return this.http.post<Schedule>(`${this.apiUrl}/${scheduleId}/employees`, { employeeId });
  }

  removeEmployeeFromSchedule(scheduleId: string, employeeId: string): Observable<Schedule> {
    return this.http.delete<Schedule>(`${this.apiUrl}/${scheduleId}/employees/${employeeId}`);
  }

  // Method to handle contract assignment
  assignContractToSchedule(scheduleId: string, contractId: string): Observable<Schedule> {
    return this.http.patch<Schedule>(`${this.apiUrl}/${scheduleId}/contract`, { contractId });
  }

  // Method to create invoice for schedule
  createInvoiceForSchedule(scheduleId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${scheduleId}/invoice`, {});
  }
} 
