import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  ChangePasswordRequest,
  UpdateProfileRequest 
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getAccessToken();
    const user = this.getStoredUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    try {
      // Clear local storage first
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      
      // Update subjects
      this.currentUserSubject.next(null);
      this.isAuthenticatedSubject.next(false);
      
      // Navigate to login page
      this.router.navigate(['/login']).then(() => {
        // After navigation, try to notify the server
        this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
          error: (error) => {
            console.error('Error during server logout:', error);
          }
        });
      });
    } catch (error) {
      console.error('Error during logout:', error);
      // Ensure we navigate to login even if there's an error
      this.router.navigate(['/login']);
    }
  }

  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      return throwError('No refresh token available');
    }

    const request: RefreshTokenRequest = { refreshToken };
    
    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh-token`, request)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setTokens(response.data.accessToken, response.data.refreshToken);
          }
        }),
        catchError(error => {
          this.clearAuthData();
          return throwError(error);
        })
      );
  }

  getProfile(): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.get<{ success: boolean; data: { user: User } }>(`${this.apiUrl}/profile`)
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            this.storeUser(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  updateProfile(profileData: UpdateProfileRequest): Observable<{ success: boolean; data: { user: User } }> {
    return this.http.put<{ success: boolean; data: { user: User } }>(`${this.apiUrl}/profile`, profileData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            this.storeUser(response.data.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  changePassword(passwordData: ChangePasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(`${this.apiUrl}/change-password`, passwordData)
      .pipe(catchError(this.handleError));
  }

  private setAuthData(authData: { user: User; accessToken: string; refreshToken: string }): void {
    this.setTokens(authData.accessToken, authData.refreshToken);
    this.storeUser(authData.user);
    this.currentUserSubject.next(authData.user);
    this.isAuthenticatedSubject.next(true);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private storeUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem('currentUser');
    return userJson ? JSON.parse(userJson) : null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
    }
    
    return throwError(errorMessage);
  };
} 