import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServiceItem } from '../models/service-item.model';
import { environment } from '../../../environments/environment';

import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ServiceItemService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/services`; // user mentioned /services

  getPaginatedServiceItems(queryParams: any): Observable<PaginatedList<ServiceItem>> {
    let params = new HttpParams();
    if (queryParams) {
      Object.keys(queryParams).forEach(k => {
        if (queryParams[k] !== null && queryParams[k] !== undefined && queryParams[k] !== '') {
          params = params.set(k, queryParams[k]);
        }
      });
    }
    return this.http.get<PaginatedList<ServiceItem>>(this.apiUrl, { params });
  }

  getServiceItems(applicationId?: string): Observable<ServiceItem[]> {
    return this.getPaginatedServiceItems(applicationId ? { applicationId, pageSize: 1000 } : { pageSize: 1000 }).pipe(
      map(res => res.items)
    );
  }

  getServiceItem(id: string): Observable<ServiceItem> {
    return this.http.get<ServiceItem>(`${this.apiUrl}/${id}`);
  }
  createServiceItem(item: Partial<ServiceItem>): Observable<ServiceItem> {
    return this.http.post<ServiceItem>(this.apiUrl, item);
  }
  updateServiceItem(id: string, item: Partial<ServiceItem>): Observable<ServiceItem> {
    return this.http.put<ServiceItem>(`${this.apiUrl}/${id}`, item);
  }
  deleteServiceItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}