import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ObjectLocation,
  ObjectStats,
  ObjectFilters,
} from '../models/object.model';

@Injectable({
  providedIn: 'root',
})
export class ObjectService {
  private apiUrl = '/api/objects';
  private objectsSubject = new BehaviorSubject<ObjectLocation[]>([]);
  objects$ = this.objectsSubject.asObservable();

  // Predefined options for dropdowns
  readonly objectTypes = [
    'Office',
    'Residential',
    'Commercial',
    'Industrial',
    'Healthcare',
    'Educational',
    'Other',
  ];
  readonly statusTypes = ['Active', 'Inactive', 'Under Maintenance'];
  readonly cleaningFrequencies = [
    'Daily',
    'Weekly',
    'Bi-weekly',
    'Monthly',
    'As Needed',
  ];
  readonly specialRequirements: (
    | 'Eco-friendly Products'
    | '24/7 Access'
    | 'Security Clearance'
    | 'Special Equipment'
    | 'Hazardous Materials'
    | 'EU Standards Compliance'
  )[] = [
    'Eco-friendly Products',
    '24/7 Access',
    'Security Clearance',
    'Special Equipment',
    'Hazardous Materials',
    'EU Standards Compliance',
  ];
  readonly sizeUnits = ['sqm', 'sqft'];

  constructor(private http: HttpClient) {
    // Load objects from API on service initialization
    this.loadObjects();
  }

  private loadObjects(): void {
    this.getObjects().subscribe();
  }

  // Get all objects with optional filtering
  getObjects(filters?: ObjectFilters): Observable<ObjectLocation[]> {
    console.log('📡 Fetching objects from API:', this.apiUrl);

    return this.http
      .get<ObjectLocation[] | { objects: ObjectLocation[]; total: number }>(
        `${this.apiUrl}`
      )
      .pipe(
        map((response) => {
          // Handle both direct array and paginated responses
          if (Array.isArray(response)) {
            return response;
          } else if (response && (response as any).objects) {
            return (response as any).objects;
          } else {
            return [];
          }
        }),
        map((objects: ObjectLocation[]) => {
          // Apply client-side filtering if filters are provided
          if (!filters) return objects;

          return objects.filter((obj: ObjectLocation) => {
            const matchesSearch =
              !filters.search ||
              obj.name.toLowerCase().includes(filters.search.toLowerCase()) ||
              obj.address.city
                .toLowerCase()
                .includes(filters.search.toLowerCase()) ||
              obj.contactPerson.name
                .toLowerCase()
                .includes(filters.search.toLowerCase());

            const matchesStatus =
              !filters.status || obj.status === filters.status;
            const matchesType = !filters.type || obj.type === filters.type;
            const matchesCity =
              !filters.city || obj.address.city === filters.city;

            return matchesSearch && matchesStatus && matchesType && matchesCity;
          });
        }),
        tap((objects) => {
          console.log('✅ Objects loaded from API:', objects.length);
          this.objectsSubject.next(objects);
        })
      );
  }

  // Get object by ID
  getObject(id: string): Observable<ObjectLocation> {
    console.log('📡 Fetching object from API:', id);
    return this.http.get<ObjectLocation>(`${this.apiUrl}/${id}`).pipe(
      tap((object) => {
        console.log('✅ Object loaded from API:', object.name);
      })
    );
  }

  // Create new object
  createObject(
    objectData: Omit<ObjectLocation, '_id' | 'createdAt' | 'updatedAt'>
  ): Observable<ObjectLocation> {
    console.log('📡 Creating object via API:', objectData);
    return this.http.post<ObjectLocation>(this.apiUrl, objectData).pipe(
      tap((newObject) => {
        console.log('✅ Object created via API:', newObject._id);
        // Refresh the objects list
        this.loadObjects();
      })
    );
  }

  // Update object
  updateObject(
    id: string,
    objectData: Partial<ObjectLocation>
  ): Observable<ObjectLocation> {
    console.log('📡 Updating object via API:', id, objectData);
    return this.http
      .put<ObjectLocation>(`${this.apiUrl}/${id}`, objectData)
      .pipe(
        tap((updatedObject) => {
          console.log('✅ Object updated via API:', updatedObject._id);
          // Refresh the objects list
          this.loadObjects();
        })
      );
  }

  // Delete object
  deleteObject(id: string): Observable<void> {
    console.log('📡 Deleting object via API:', id);
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Object deleted via API:', id);
        // Refresh the objects list
        this.loadObjects();
      })
    );
  }

  // Get object statistics
  getObjectStats(): Observable<ObjectStats> {
    return this.getObjects().pipe(
      map((objects) => {
        const stats: ObjectStats = {
          total: objects.length,
          active: objects.filter((obj) => obj.status === 'Active').length,
          inactive: objects.filter((obj) => obj.status === 'Inactive').length,
          underMaintenance: objects.filter(
            (obj) => obj.status === 'Under Maintenance'
          ).length,
          byType: {},
          byCity: {},
          totalArea: 0,
          averageCleaningTime: 0,
        };

        // Calculate type distribution
        this.objectTypes.forEach((type) => {
          stats.byType[type] = objects.filter(
            (obj) => obj.type === type
          ).length;
        });

        // Calculate city distribution
        objects.forEach((obj) => {
          const city = obj.address.city;
          stats.byCity[city] = (stats.byCity[city] || 0) + 1;
        });

        // Calculate total area and average cleaning time
        stats.totalArea = objects.reduce(
          (sum, obj) => sum + (obj.size?.area || 0),
          0
        );
        stats.averageCleaningTime =
          objects.length > 0
            ? objects.reduce((sum, obj) => sum + obj.estimatedCleaningTime, 0) /
              objects.length
            : 0;

        return stats;
      })
    );
  }

  // Get unique cities
  getCities(): Observable<string[]> {
    return this.getObjects().pipe(
      map((objects) => {
        const cities = [...new Set(objects.map((obj) => obj.address.city))];
        return cities.sort();
      })
    );
  }

  // Search objects
  searchObjects(term: string): Observable<ObjectLocation[]> {
    return this.getObjects({ search: term });
  }

  // Export to CSV
  exportToCSV(): Observable<string> {
    return this.getObjects().pipe(
      map((objects) => {
        const headers = [
          'Name',
          'Type',
          'Address',
          'City',
          'Municipality',
          'Contact Person',
          'Phone',
          'Email',
          'Area',
          'Floors',
          'Rooms',
          'Cleaning Frequency',
          'Estimated Time',
          'Status',
          'Notes',
        ];

        const csvContent = [
          headers.join(','),
          ...objects.map((obj) =>
            [
              `"${obj.name}"`,
              `"${obj.type}"`,
              `"${obj.address.street}"`,
              `"${obj.address.city}"`,
              `"${obj.address.municipality || ''}"`,
              `"${obj.contactPerson.name}"`,
              `"${obj.contactPerson.phone}"`,
              `"${obj.contactPerson.email || ''}"`,
              obj.size?.area || 0,
              obj.floors || 0,
              obj.rooms || 0,
              `"${obj.cleaningFrequency}"`,
              obj.estimatedCleaningTime,
              `"${obj.status}"`,
              `"${obj.notes || ''}"`,
            ].join(',')
          ),
        ].join('\n');

        return csvContent;
      })
    );
  }
}
