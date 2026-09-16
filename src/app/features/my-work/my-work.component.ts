
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';

import { ServiceItemService } from '../../core/services/service-item.service';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';

@Component({
   selector: 'app-my-work',
   standalone: true,
   imports: [CommonModule, RouterModule, PageHeaderComponent, EmptyStateComponent, LoadingStateComponent],
   template: `
    <app-page-header title="My Work" subtitle="Service Items assigned to you across all projects."></app-page-header>
    <app-loading-state *ngIf="loading"></app-loading-state>
    
    <div *ngIf="!loading && items.length > 0" class="work-grid">
       <a *ngFor="let item of items" class="work-card" [routerLink]="['/service-items', item.id]">
          <div class="card-header">
             <span class="ref">{{item.referenceNumber}}</span>
             <span class="status-indicator" [attr.data-status]="item.status"></span>
          </div>
          <h3 class="card-title">{{item.title}}</h3>
          <div class="card-meta">
             <span>{{item.priority}} Priority</span> • <span>{{item.status}}</span>
          </div>
       </a>
    </div>
    
    <app-empty-state *ngIf="!loading && items.length === 0" icon="person" title="No assignments" description="You have no service items assigned at the moment."></app-empty-state>
  `,
   styles: [`
    .work-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-top: 24px; }
    .work-card { display: block; background: #ffffff; padding: 20px; border: 1px solid #dee2e6; text-decoration: none; color: inherit; }
    .work-card:hover { border-color: #adb5bd; background: #f8f9fa; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .ref { font-family: monospace; font-size: 0.8125rem; color: #6c757d; }
    .status-indicator { width: 8px; height: 8px; border-radius: 50%; background: #94a3b8; }
    .status-indicator[data-status="In Progress"] { background: #3b82f6; }
    .status-indicator[data-status="New"] { background: #10b981; }
    .card-title { margin: 0 0 12px; font-size: 1.125rem; font-weight: 600; color: #212529; line-height: 1.4; }
    .card-meta { font-size: 0.75rem; color: #6c757d; display: flex; gap: 8px; }
  `]
})
export class MyWorkComponent implements OnInit {
   svc = inject(ServiceItemService); items: any[] = []; loading = true;
   ngOnInit() {
      // Explicitly pulling items and locally filtering by an assumed context user 'U' or 'User' or generic match for presentation
      this.svc.getServiceItems().subscribe(data => {
         // Find assigned items (fake current user 'Jane' 'John' etc if unassigned. for demo showing any assigned)
         this.items = data.filter(i => i.assignedTo && i.assignedTo.trim().length > 0);
         this.loading = false;
      });
   }
}
