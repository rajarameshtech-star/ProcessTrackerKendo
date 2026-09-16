
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridModule } from '@progress/kendo-angular-grid';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { StatusChipComponent } from '../../../shared/status-chip/status-chip.component';
import { PriorityChipComponent } from '../../../shared/priority-chip/priority-chip.component';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ServiceItemService } from '../../../core/services/service-item.service';
import { ApplicationService } from '../../../core/services/application.service';
import { ProcessDefinitionService } from '../../../core/services/process-definition.service';
import { NotificationService } from '../../../core/services/notification.service';
import { process, State } from '@progress/kendo-data-query';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-service-item-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GridModule, ButtonModule, InputsModule, DropDownsModule, DialogsModule, RouterModule, PageHeaderComponent, StatusChipComponent, PriorityChipComponent, LoadingStateComponent, EmptyStateComponent, DatePipe],
  template: ` 
    <app-page-header title="Service Items" subtitle="Track operational work, ownership, priority and process progress."> 
      <button kendoButton themeColor="primary" routerLink="/service-items/create" icon="plus">New Service Item</button> 
    </app-page-header> 
    <div class="toolbar" *ngIf="!loading"> 
      <kendo-textbox placeholder="Search service items..." [style.width.px]="250" [(ngModel)]="searchTerm" (valueChange)="applyFilters()"></kendo-textbox>
      <kendo-dropdownlist [data]="applications" textField="name" valueField="id" [valuePrimitive]="true" [defaultItem]="{name: 'All applications', id: null}" [(ngModel)]="selectedAppId" (valueChange)="onAppChanged($event)"></kendo-dropdownlist>
      <kendo-dropdownlist [data]="processes" textField="processName" valueField="id" [valuePrimitive]="true" [defaultItem]="{processName: 'All processes', id: null}" [(ngModel)]="selectedProcessId" (valueChange)="applyFilters()"></kendo-dropdownlist>
      <kendo-dropdownlist [data]="statuses" [defaultItem]="'All statuses'" [(ngModel)]="selectedStatus" (valueChange)="applyFilters()"></kendo-dropdownlist>
      <kendo-dropdownlist [data]="priorities" [defaultItem]="'All priorities'" [(ngModel)]="selectedPriority" (valueChange)="applyFilters()"></kendo-dropdownlist>
      <button kendoButton fillMode="flat" (click)="clearFilters()">Clear filters</button>
    </div> 
    <app-loading-state *ngIf="loading"></app-loading-state> 
    
    <div class="grid-container" *ngIf="!loading && gridView && gridView.data.length > 0">
      <kendo-grid 
          [data]="gridView"
          [sortable]="true"
          [sort]="state.sort || []"
          [pageable]="true"
          [pageSize]="state.take || 10"
          [skip]="state.skip || 0"
          (dataStateChange)="dataStateChange($event)">
        <kendo-grid-column field="referenceNumber" title="Reference" [width]="150">
          <ng-template kendoGridCellTemplate let-dataItem>
             <a class="ref-link monospaced" [routerLink]="['/service-items', dataItem.id]">{{dataItem.referenceNumber}}</a>
          </ng-template>
        </kendo-grid-column> 
        <kendo-grid-column field="title" title="Title" [width]="300">
           <ng-template kendoGridCellTemplate let-dataItem>
             <div style="font-weight: 500; color: #212529;">{{dataItem.title}}</div>
           </ng-template>
        </kendo-grid-column> 
        <kendo-grid-column field="applicationId" title="Application" [width]="180">
           <ng-template kendoGridCellTemplate let-dataItem>
             <span class="muted-text">{{getAppName(dataItem.applicationId)}}</span>
           </ng-template>
        </kendo-grid-column>
        <kendo-grid-column field="processDefinitionId" title="Process" [width]="180">
           <ng-template kendoGridCellTemplate let-dataItem>
             <span class="muted-text">{{getProcessName(dataItem.processDefinitionId)}}</span>
           </ng-template>
        </kendo-grid-column>
        <kendo-grid-column title="Status" [width]="140"> 
          <ng-template kendoGridCellTemplate let-dataItem><app-status-chip [status]="dataItem.status"></app-status-chip></ng-template> 
        </kendo-grid-column> 
        <kendo-grid-column title="Priority" [width]="120"> 
           <ng-template kendoGridCellTemplate let-dataItem><app-priority-chip [priority]="dataItem.priority"></app-priority-chip></ng-template> 
        </kendo-grid-column> 
        <kendo-grid-column field="assignedTo" title="Assigned To" [width]="180">
           <ng-template kendoGridCellTemplate let-dataItem>
             <div style="display: flex; align-items: center;">
                <div *ngIf="dataItem.assignedTo" class="sm-avatar">{{dataItem.assignedTo.charAt(0) | uppercase}}</div>
                <span class="muted-text">{{dataItem.assignedTo || 'Unassigned'}}</span>
             </div>
           </ng-template>
        </kendo-grid-column> 
        <kendo-grid-column field="updatedAt" title="Updated" [width]="140">
           <ng-template kendoGridCellTemplate let-dataItem>
             <span class="muted-text">{{dataItem.updatedAt | date:'mediumDate'}}</span>
           </ng-template>
        </kendo-grid-column>
        <kendo-grid-column title="Actions" [width]="100" [sortable]="false">
          <ng-template kendoGridCellTemplate let-dataItem>
             <div style="display: flex; gap: 8px;">
                <button kendoButton title="Open" fillMode="flat" themeColor="primary" [routerLink]="['/service-items', dataItem.id]">
                   <span class="material-icons">open_in_new</span>
                </button>
                <button kendoButton title="Delete" fillMode="flat" themeColor="error" (click)="confirmDelete(dataItem)">
                   <span class="material-icons">delete</span>
                </button>
             </div>
          </ng-template>
        </kendo-grid-column>
      </kendo-grid> 
    </div>

    <app-empty-state *ngIf="!loading && gridView && gridView.data.length === 0" icon="file" title="No service items found" description="Adjust your filters or create a new service item." actionLabel="Create Service Item" (action)="goToCreate()"></app-empty-state> 

    <kendo-dialog *ngIf="itemToDelete" title="Delete Service Item?" (close)="cancelDelete()" [minWidth]="300">
        <p>This action cannot be undone.</p>
        <p style="font-weight: 500; margin-top: 16px;">{{itemToDelete.referenceNumber}}<br>{{itemToDelete.title}}</p>
        <kendo-dialog-actions>
            <button kendoButton (click)="cancelDelete()">Cancel</button>
            <button kendoButton themeColor="primary" (click)="deleteItem()">Delete</button>
        </kendo-dialog-actions>
    </kendo-dialog>
  `,
  styles: [` 
    .toolbar { display: flex; gap: 12px; margin-bottom: 24px; align-items: center; flex-wrap: wrap; background: #ffffff; padding: 16px; border: 1px solid #dee2e6; } 
    .ref-link { color: #0058e9; font-weight: 500; }
    .sm-avatar { width: 24px; height: 24px; border-radius: 50%; background: #6c757d; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; margin-right: 8px; }
    .grid-container { border: 1px solid #dee2e6; overflow: hidden; }
  `]
})
export class ServiceItemListComponent implements OnInit {
  private svc = inject(ServiceItemService);
  private appSvc = inject(ApplicationService);
  private processSvc = inject(ProcessDefinitionService);
  private ns = inject(NotificationService);
  private router = inject(Router);

  loading = true;
  allItems: any[] = [];
  filteredItems: any[] = [];
  gridView: import('@progress/kendo-data-query').DataResult | null = null;
  state: State = { skip: 0, take: 10, sort: [] };

  applications: any[] = [];
  processes: any[] = [];
  statuses = ['New', 'In Progress', 'Completed', 'Blocked', 'Cancelled'];
  priorities = ['Low', 'Medium', 'High', 'Critical'];

  searchTerm = '';
  selectedAppId: string | null = null;
  selectedProcessId: string | null = null;
  selectedStatus: string | null = 'All statuses';
  selectedPriority: string | null = 'All priorities';

  appMap: Record<string, string> = {};
  processMap: Record<string, string> = {};

  itemToDelete: any = null;

  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      if (params['applicationId']) {
        // If the select expects numeric IDs specifically depending on data maps, parse if needed, but string works usually
        this.selectedAppId = params['applicationId'];
      }
      this.refreshData();
    });
  }

  refreshData() {
    this.loading = true;
    forkJoin({
      items: this.selectedAppId ? this.svc.getServiceItems(this.selectedAppId).pipe(catchError(() => of([]))) : this.svc.getServiceItems().pipe(catchError(() => of([]))),
      apps: this.selectedAppId ? of(this.applications) : this.appSvc.getApplications().pipe(catchError(() => of([]))),
      processes: this.processes.length > 0 ? of(this.processes) : this.processSvc.getProcessDefinitions().pipe(catchError(() => of([])))
    }).subscribe(data => {
      this.applications = data.apps;
      this.processes = data.processes;
      this.applications.forEach(a => this.appMap[a.id] = a.name);
      this.processes.forEach(p => this.processMap[p.id] = p.processName);
      this.allItems = data.items;
      this.applyFilters();
      this.loading = false;
    });
  }

  onAppChanged(appId: string | null) {
    this.refreshData();
  }

  applyFilters() {
    let result = this.allItems;
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(i => (i.title && i.title.toLowerCase().includes(term)) || (i.referenceNumber && i.referenceNumber.toLowerCase().includes(term)) || (i.assignedTo && i.assignedTo.toLowerCase().includes(term)));
    }
    if (this.selectedProcessId) {
      result = result.filter(i => i.processDefinitionId === this.selectedProcessId);
    }
    if (this.selectedStatus && this.selectedStatus !== 'All statuses') {
      result = result.filter(i => i.status === this.selectedStatus);
    }
    if (this.selectedPriority && this.selectedPriority !== 'All priorities') {
      result = result.filter(i => i.priority === this.selectedPriority);
    }
    this.filteredItems = result;
    this.loadGridData();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedAppId = null;
    this.selectedProcessId = null;
    this.selectedStatus = 'All statuses';
    this.selectedPriority = 'All priorities';
    this.refreshData();
  }

  loadGridData() {
    this.gridView = process(this.filteredItems, this.state);
  }

  dataStateChange(state: State) {
    this.state = state;
    this.loadGridData();
  }

  getAppName(id: string) { return this.appMap[id] || id; }
  getProcessName(id: string) { return this.processMap[id] || id; }

  confirmDelete(item: any) { this.itemToDelete = item; }
  cancelDelete() { this.itemToDelete = null; }
  deleteItem() {
    this.svc.deleteServiceItem(this.itemToDelete.id).subscribe({
      next: () => {
        this.ns.success('Deleted successfully.');
        this.itemToDelete = null;
        this.refreshData();
      },
      error: () => { this.ns.error('Failed to delete item.'); this.itemToDelete = null; }
    });
  }

  goToCreate() { this.router.navigate(['/service-items/create']); }
} 
