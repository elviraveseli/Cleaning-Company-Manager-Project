import { Component, ViewChild, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { User } from './models/auth.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Cleaning Management System';
  
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser$: Observable<User | null>;
  isAuthenticated$: Observable<boolean>;
  isSignaturePage$: Observable<boolean>;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthenticated$ = this.authService.isAuthenticated$;
    
    // Detect if we're on the signature page
    this.isSignaturePage$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).url.includes('/contracts/') && (event as NavigationEnd).url.includes('/sign')),
      // Start with current URL
      startWith(this.router.url.includes('/contracts/') && this.router.url.includes('/sign'))
    );
  }

  ngOnInit(): void {
    // Check if user is authenticated and load profile if needed
    if (this.authService.isAuthenticated() && this.authService.getAccessToken()) {
      this.authService.getProfile().subscribe({
        error: (error) => {
          console.error('Error loading user profile:', error);
          // If profile loading fails, user might need to login again
          this.authService.logout();
        }
      });
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
