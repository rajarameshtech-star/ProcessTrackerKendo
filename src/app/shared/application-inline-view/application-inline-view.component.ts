import { Component, Input, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { GridModule } from '@progress/kendo-angular-grid';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { StatusChipComponent } from '../status-chip/status-chip.component';
import { PriorityChipComponent } from '../priority-chip/priority-chip.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { LoadingStateComponent } from '../loading-state/loading-state.component';

import { ApplicationService } from '../../core/services/application.service';
import { ServiceItemService } from '../../core/services/service-item.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
   selector: 'app-application-inline-view',
   standalone: true,
   imports: [CommonModule, RouterModule, GridModule, ButtonModule, StatusChipComponent, PriorityChipComponent, EmptyStateComponent, LoadingStateComponent],
   template: `
    <app-loading-state *ngIf="loading"></app-loading-state>

    <div *ngIf="!loading && app" class="inline-app-container">
       <div class="inline-header">
          <div>
            <h3 class="app-title">{{app.name}}</h3>
            <p class="app-desc">{{app.description || 'Application domain boundary'}}</p>
          </div>
          <button kendoButton themeColor="primary" (click)="router.navigate(['/service-items/create'])">New Service Item</button>
       </div>

       <div class="grid-container" *ngIf="serviceItems.length > 0">
         <kendo-grid [data]="serviceItems">
           <kendo-grid-column field="referenceNumber" title="Ref" [width]="130">
              <ng-template kendoGridCellTemplate let-dataItem>
                 <a [routerLink]="['/service-items', dataItem.id]" class="ref-link">{{dataItem.referenceNumber}}</a>
              </ng-template>
           </kendo-grid-column>
           <kendo-grid-column field="title" title="Title"></kendo-grid-column>
           <kendo-grid-column title="Status" [width]="140">
              <ng-template kendoGridCellTemplate let-dataItem><app-status-chip [status]="dataItem.status"></app-status-chip></ng-template>
           </kendo-grid-column>
           <kendo-grid-column title="Priority" [width]="120">
              <ng-template kendoGridCellTemplate let-dataItem><app-priority-chip [priority]="dataItem.priority"></app-priority-chip></ng-template>
           </kendo-grid-column>
           <kendo-grid-column title="Action" [width]="90">
              <ng-template kendoGridCellTemplate let-dataItem>
                 <button kendoButton title="Open" fillMode="flat" themeColor="primary" [routerLink]="['/service-items', dataItem.id]">
                    <span class="material-icons">visibility</span>
                 </button>
              </ng-template>
           </kendo-grid-column>
         </kendo-grid>
       </div>
       
       <app-empty-state *ngIf="serviceItems.length === 0" icon="description" title="No service items" description="This application has no active work items." actionLabel="Create Service Item" (action)="router.navigate(['/service-items/create'])"></app-empty-state>
    </div>
  `,
   styles: [`
    .inline-app-container { background: #f8f9fa; padding: 24px; border: 1px solid #dee2e6; margin-top: 16px; }
    .inline-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
    .app-title { margin: 0 0 4px 0; font-size: 1.25rem; font-weight: 600; color: #212529; }
    .app-desc { margin: 0; font-size: 0.875rem; color: #6c757d; }
    .grid-container { overflow: hidden; border: 1px solid #dee2e6; background: white; }
    .ref-link { color: #0058e9; font-family: monospace; font-weight: 500; font-size: 0.85rem; text-decoration: none; }
    .ref-link:hover { text-decoration: underline; }
  `]
})
export class ApplicationInlineViewComponent implements OnChanges {
   @Input() appId!: string | number;

   router = inject(Router);
   private appSvc = inject(ApplicationService);
   private itemSvc = inject(ServiceItemService);

   loading = false;
   app: any = null;
   serviceItems: any[] = [];

   ngOnChanges(changes: SimpleChanges) {
      if (changes['appId'] && this.appId) {
         this.loadData();
      }
   }

   loadData() {
      this.loading = true;
      forkJoin({
         app: this.appSvc.getApplication(this.appId.toString()),
         items: this.itemSvc.getServiceItems(this.appId.toString()).pipe(catchError(() => of([])))
      }).subscribe(data => {
         this.app = data.app;
         this.serviceItems = data.items;
         this.loading = false;
      });
   }
}
