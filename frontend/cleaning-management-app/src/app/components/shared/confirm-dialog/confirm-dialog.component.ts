import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <mat-icon [ngClass]="getIconClass()">{{ getIcon() }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-stroked-button (click)="onCancel()" class="cancel-button">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button mat-raised-button [color]="data.confirmColor || 'primary'" (click)="onConfirm()" class="confirm-button">
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 0;
      max-width: 450px;
      min-width: 350px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 24px 24px 16px 24px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 16px;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        
        &.warn-icon {
          color: #f44336;
        }
        
        &.primary-icon {
          color: #2196f3;
        }
        
        &.accent-icon {
          color: #ff9800;
        }
      }

      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
        flex: 1;
      }
    }

    mat-dialog-content {
      padding: 0 24px 16px 24px;
      
      p {
        margin: 0;
        color: #666;
        line-height: 1.5;
        font-size: 16px;
      }
    }

    mat-dialog-actions {
      padding: 16px 24px 24px 24px;
      margin: 0;
      gap: 12px;
      
      .cancel-button {
        min-width: 80px;
        border: 2px solid #e0e0e0;
        color: #666;
        
        &:hover {
          border-color: #bdbdbd;
          background-color: #f5f5f5;
        }
      }
      
      .confirm-button {
        min-width: 80px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.confirmColor) {
      case 'warn':
        return 'warning';
      case 'accent':
        return 'help';
      case 'primary':
      default:
        return 'info';
    }
  }

  getIconClass(): string {
    switch (this.data.confirmColor) {
      case 'warn':
        return 'warn-icon';
      case 'accent':
        return 'accent-icon';
      case 'primary':
      default:
        return 'primary-icon';
    }
  }
} 