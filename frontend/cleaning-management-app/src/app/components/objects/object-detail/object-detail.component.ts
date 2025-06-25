import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ObjectService } from '../../../services/object.service';
import { ObjectLocation } from '../../../models/object.model';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-object-detail',
  templateUrl: './object-detail.component.html',
  styleUrls: ['./object-detail.component.scss'],
})
export class ObjectDetailComponent implements OnInit, OnDestroy {
  object: ObjectLocation | null = null;
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private objectService: ObjectService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadObject();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadObject(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Object ID not found';
      return;
    }

    this.loading = true;
    this.objectService
      .getObject(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (object) => {
          this.object = object;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading object:', error);
          this.error = 'Failed to load object details';
          this.loading = false;
        },
      });
  }

  // Navigation methods
  goBack(): void {
    this.router.navigate(['/objects']);
  }

  editObject(): void {
    if (this.object) {
      this.router.navigate(['/objects', this.object._id, 'edit']);
    }
  }

  // Action methods
  deleteObject(): void {
    if (!this.object) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Object',
        message: `Are you sure you want to delete "${this.object.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.objectService.deleteObject(this.object!._id).subscribe({
        next: () => {
            this.snackBar.open(`Object "${this.object!.name}" has been deleted successfully`, 'Close', {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          this.router.navigate(['/objects']);
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

  duplicateObject(): void {
    if (!this.object) return;

    console.log('Duplicating object from detail:', this.object);

    try {
      const duplicatedObject = {
        ...this.object,
        name: `${this.object.name} (Copy)`,
        status: 'Inactive' as const,
      };

      // Remove fields that shouldn't be duplicated
      delete (duplicatedObject as any)._id;
      delete (duplicatedObject as any).createdAt;
      delete (duplicatedObject as any).updatedAt;
      delete (duplicatedObject as any).__v;

      console.log('Creating duplicate object with data:', duplicatedObject);

      this.objectService.createObject(duplicatedObject).subscribe({
        next: (newObject) => {
          console.log('Object duplicated successfully:', newObject);
          alert(
            `Object "${duplicatedObject.name}" duplicated successfully! Redirecting to new object...`
          );
          this.router.navigate(['/objects', newObject._id]);
        },
        error: (error) => {
          console.error('Error duplicating object:', error);
          let errorMessage = 'Error duplicating object. Please try again.';
          if (error.error && error.error.message) {
            errorMessage = `Error: ${error.error.message}`;
          }
          alert(errorMessage);
        },
      });
    } catch (error) {
      console.error('Error preparing object for duplication:', error);
      alert('Error preparing object for duplication. Please try again.');
    }
  }

  createSchedule(): void {
    if (this.object) {
      this.router.navigate(['/schedules/new'], {
        queryParams: { objectId: this.object._id },
      });
    }
  }

  viewSchedules(): void {
    if (this.object) {
      this.router.navigate(['/schedules'], {
        queryParams: { objectId: this.object._id },
      });
    }
  }

  createContract(): void {
    if (this.object) {
      this.router.navigate(['/customer-contracts/new'], {
        queryParams: { objectId: this.object._id },
      });
    }
  }

  viewContracts(): void {
    if (this.object) {
      this.router.navigate(['/customer-contracts'], {
        queryParams: { objectId: this.object._id },
      });
    }
  }

  // Communication methods
  callContact(): void {
    if (this.object?.contactPerson.phone) {
      window.open(`tel:${this.object.contactPerson.phone}`);
    }
  }

  emailContact(): void {
    if (this.object?.contactPerson.email) {
      window.open(`mailto:${this.object.contactPerson.email}`);
    }
  }

  openMaps(): void {
    if (this.object?.fullAddress) {
      const encodedAddress = encodeURIComponent(this.object.fullAddress);
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        '_blank'
      );
    }
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
        return 'status-active';
      case 'Inactive':
        return 'status-inactive';
      case 'Under Maintenance':
        return 'status-maintenance';
      default:
        return 'status-default';
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'Office':
        return 'business';
      case 'Residential':
        return 'home';
      case 'Commercial':
        return 'store';
      case 'Industrial':
        return 'factory';
      case 'Healthcare':
        return 'local_hospital';
      case 'Educational':
        return 'school';
      default:
        return 'location_on';
    }
  }

  formatArea(size?: { area: number; unit: string }): string {
    if (!size) return 'Not specified';
    return `${size.area.toLocaleString()} ${size.unit}`;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatDateTime(date: Date | string): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  hasSpecialRequirements(): boolean {
    return !!(
      this.object?.specialRequirements &&
      this.object.specialRequirements.length > 0
    );
  }

  hasPhotos(): boolean {
    return !!(this.object?.photos && this.object.photos.length > 0);
  }

  canEdit(): boolean {
    return this.object?.status !== 'Under Maintenance';
  }

  canDelete(): boolean {
    return this.object?.status === 'Inactive';
  }
}
