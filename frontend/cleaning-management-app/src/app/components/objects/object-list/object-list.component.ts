import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ObjectService } from '../../../services/object.service';
import {
  ObjectLocation,
  ObjectStats,
  ObjectFilters,
} from '../../../models/object.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.scss'],
})
export class ObjectListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Math utility for template
  Math = Math;

  objects: ObjectLocation[] = [];
  filteredObjects: ObjectLocation[] = [];
  dataSource = new MatTableDataSource<ObjectLocation>([]);
  stats: ObjectStats = {
    total: 0,
    active: 0,
    inactive: 0,
    underMaintenance: 0,
    byType: {},
    byCity: {},
    totalArea: 0,
    averageCleaningTime: 0,
  };

  // Table configuration
  displayedColumns: string[] = [
    'name',
    'type',
    'address',
    'contact',
    'size',
    'frequency',
    'estimatedTime',
    'status',
    'actions',
  ];

  // Filters and search
  searchTerm = '';
  selectedStatus = '';
  selectedType = '';
  selectedCity = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];
  totalItems = 0;

  // Available filter options
  statusOptions: string[] = [];
  typeOptions: string[] = [];
  cityOptions: string[] = [];

  // Loading states
  loading = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private objectService: ObjectService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.statusOptions = this.objectService.statusTypes;
    this.typeOptions = this.objectService.objectTypes;
  }

  ngOnInit(): void {
    this.setupSearch();
    this.loadData();
    this.loadCities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchTerm = term;
        this.currentPage = 1;
        this.applyFilters();
      });
  }

  private loadData(): void {
    this.loading = true;

    combineLatest([
      this.objectService.getObjects(),
      this.objectService.getObjectStats(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([objects, stats]) => {
          this.objects = objects;
          this.stats = stats;
          this.dataSource.data = objects;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading objects:', error);
          this.loading = false;
        },
      });
  }

  private loadCities(): void {
    this.objectService
      .getCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe((cities) => {
        this.cityOptions = cities;
      });
  }

  private applyFilters(): void {
    let filteredData = [...this.objects];

    // Apply search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filteredData = filteredData.filter(
        (obj) =>
          obj.name.toLowerCase().includes(searchLower) ||
          obj.address.city.toLowerCase().includes(searchLower) ||
          obj.contactPerson.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (this.selectedStatus) {
      filteredData = filteredData.filter(
        (obj) => obj.status === this.selectedStatus
      );
    }

    // Apply type filter
    if (this.selectedType) {
      filteredData = filteredData.filter(
        (obj) => obj.type === this.selectedType
      );
    }

    // Apply city filter
    if (this.selectedCity) {
      filteredData = filteredData.filter(
        (obj) => obj.address.city === this.selectedCity
      );
    }

    this.filteredObjects = filteredData;
    this.totalItems = filteredData.length;
    this.dataSource.data = filteredData;
  }

  private updatePaginatedData(): void {
    // This method is no longer needed with Material Design paginator
    // The paginator handles this automatically
  }

  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onCityFilterChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    // Material Design paginator handles pagination automatically
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedCity = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  refreshObjects(): void {
    this.loadData();
  }

  // Navigation methods
  viewObject(object: ObjectLocation): void {
    this.router.navigate(['/objects', object._id]);
  }

  editObject(object: ObjectLocation): void {
    this.router.navigate(['/objects', object._id, 'edit']);
  }

  createObject(): void {
    this.router.navigate(['/objects/new']);
  }

  // Action methods
  deleteObject(object: ObjectLocation): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Object',
        message: `Are you sure you want to delete "${object.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
      this.objectService.deleteObject(object._id).subscribe({
        next: () => {
          this.loadData();
            this.snackBar.open(`Object "${object.name}" has been deleted successfully`, 'Close', {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
        },
        error: (error) => {
          console.error('Error deleting object:', error);
            this.snackBar.open('Error deleting object. Please try again.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
      });
    }
    });
  }

  exportToCSV(): void {
    this.objectService.exportToCSV().subscribe((csvContent) => {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `objects_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  // Helper methods
  getStatusIcon(status: string): string {
    switch (status) {
      case 'Active':
        return 'check_circle';
      case 'Inactive':
        return 'cancel';
      case 'Under Maintenance':
        return 'build';
      default:
        return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Active':
        return 'text-green-600';
      case 'Inactive':
        return 'text-red-600';
      case 'Under Maintenance':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('sq-XK', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatArea(size?: { area: number; unit: string }): string {
    if (!size) return 'N/A';
    return `${size.area.toLocaleString()} ${size.unit}`;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get startIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  trackByObjectId(index: number, object: ObjectLocation): string {
    return object._id;
  }

  getPageNumbers(): (number | null)[] {
    const pages: (number | null)[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, this.currentPage + halfVisible);

    // Adjust if we're near the beginning
    if (this.currentPage <= halfVisible) {
      endPage = Math.min(this.totalPages, maxVisiblePages);
    }

    // Adjust if we're near the end
    if (this.currentPage > this.totalPages - halfVisible) {
      startPage = Math.max(1, this.totalPages - maxVisiblePages + 1);
    }

    // Always show first page
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push(null); // Ellipsis
      }
    }

    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    // Always show last page
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        pages.push(null); // Ellipsis
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  // Helper methods for Material Design table
  getObjectInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':
        return 'status-active';
      case 'Inactive':
        return 'status-inactive';
      case 'Under Maintenance':
        return 'status-maintenance';
      default:
        return 'status-default';
    }
  }
}
