
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GridModule } from '@progress/kendo-angular-grid';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { RouterModule, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ProcessDefinitionService } from '../../../core/services/process-definition.service';
import { NotificationService } from '../../../core/services/notification.service';
import { process, State } from '@progress/kendo-data-query';

@Component({
  selector: 'app-process-definition-list',
  standalone: true,
  imports: [CommonModule, FormsModule, GridModule, ButtonModule, InputsModule, DropDownsModule, DialogsModule, RouterModule, PageHeaderComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Processes" subtitle="Define the operational processes tracked by your organization.">
      <button kendoButton themeColor="primary" icon="plus" (click)="openCreate()">New Process</button>
    </app-page-header>
    
    <div class="toolbar" *ngIf="!loading">
      <kendo-textbox placeholder="Search processes..." [style.width.px]="250" [(ngModel)]="searchTerm" (valueChange)="applyFilters()"></kendo-textbox>
      <kendo-dropdownlist [data]="[{text: 'All', value: null}, {text: 'Active', value: true}, {text: 'Inactive', value: false}]" textField="text" valueField="value" [valuePrimitive]="true" [(ngModel)]="activeFilter" (valueChange)="applyFilters()" [style.width.px]="150"></kendo-dropdownlist>
    </div>

    <app-loading-state *ngIf="loading"></app-loading-state>
    
    <div class="grid-container" *ngIf="!loading && gridView && gridView.data.length > 0">
      <kendo-grid [data]="gridView" [sortable]="true" [sort]="state.sort || []" (dataStateChange)="dataStateChange($event)">
        <kendo-grid-column field="processCode" title="Code" [width]="150">
          <ng-template kendoGridCellTemplate let-dataItem>
             <a class="ref-link monospaced" [routerLink]="['/processes', dataItem.id]">{{dataItem.processCode || dataItem.formCode}}</a>
          </ng-template>
        </kendo-grid-column>
        <kendo-grid-column field="processName" title="Process Name" [width]="250">
           <ng-template kendoGridCellTemplate let-dataItem>
             <span style="font-weight: 500; color: #212529;">{{dataItem.processName || 'Unnamed Process'}}</span>
           </ng-template>
        </kendo-grid-column>
        <kendo-grid-column field="description" title="Description"></kendo-grid-column>
        <kendo-grid-column title="Status" [width]="100">
           <ng-template kendoGridCellTemplate let-dataItem>
             <span class="active-pill" [class.inactive]="!dataItem.active">{{dataItem.active ? 'Active' : 'Inactive'}}</span>
           </ng-template>
        </kendo-grid-column>
        <kendo-grid-column title="Actions" [width]="150" [sortable]="false">
          <ng-template kendoGridCellTemplate let-dataItem>
             <div style="display: flex; gap: 8px;">
               <button kendoButton title="Open" fillMode="flat" themeColor="primary" [routerLink]="['/processes', dataItem.id]">
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
    
    <app-empty-state *ngIf="!loading && gridView && gridView.data.length === 0" icon="slider-vertical" title="No processes found" description="Create a process to begin customizing your data models." actionLabel="New Process" (action)="openCreate()"></app-empty-state>

    <!-- Create Dialog -->
    <kendo-dialog *ngIf="showCreate" title="New Process" (close)="closeCreate()" [width]="500">
      <div class="pt-form">
         <div class="form-row">
            <label>Process Code</label>
            <kendo-textbox [(ngModel)]="creation.processCode"></kendo-textbox>
         </div>
         <div class="form-row">
            <label>Process Name</label>
            <kendo-textbox [(ngModel)]="creation.processName"></kendo-textbox>
         </div>
         <div class="form-row">
            <label>Description</label>
            <kendo-textbox [(ngModel)]="creation.description"></kendo-textbox>
         </div>
      </div>
      <kendo-dialog-actions>
         <button kendoButton (click)="closeCreate()" [disabled]="saving">Cancel</button>
         <button kendoButton themeColor="primary" (click)="saveCreate()" [disabled]="!creation.processName || !creation.processCode || saving">Create</button>
      </kendo-dialog-actions>
    </kendo-dialog>

    <kendo-dialog *ngIf="itemToDelete" title="Delete Process?" (close)="cancelDelete()" [minWidth]="300">
        <p>This action cannot be undone and will affect all related Service Items.</p>
        <p style="font-weight: 500; margin-top: 16px;">{{itemToDelete.processCode || itemToDelete.formCode}}<br>{{itemToDelete.processName}}</p>
        <kendo-dialog-actions>
            <button kendoButton (click)="cancelDelete()">Cancel</button>
            <button kendoButton themeColor="primary" (click)="deleteItem()">Delete</button>
        </kendo-dialog-actions>
    </kendo-dialog>
  `,
  styles: [`
    .toolbar { display: flex; gap: 12px; margin-bottom: 24px; align-items: center; background: #ffffff; padding: 16px; border: 1px solid #dee2e6; }
    .ref-link { color: #0058e9; font-weight: 600; }
    .grid-container { border: 1px solid #dee2e6; overflow: hidden; }
    .active-pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; background: #dcfce7; color: #166534; }
    .active-pill.inactive { background: #fee2e2; color: #991b1b; }
  `]
})
export class ProcessDefinitionListComponent implements OnInit {
  private svc = inject(ProcessDefinitionService); private ns = inject(NotificationService); private router = inject(Router);
  loading = true; allItems: any[] = []; filteredItems: any[] = [];
  gridView: import('@progress/kendo-data-query').DataResult | null = null;
  state: State = { skip: 0, take: 50, sort: [] };
  searchTerm = ''; activeFilter: boolean | null = null;
  showCreate = false; itemToDelete: any = null; saving = false;
  creation: any = { processCode: '', processName: '', description: '', active: true, formCode: '' };

  ngOnInit() { this.refreshData(); }

  refreshData() {
    this.loading = true;
    this.svc.getProcessDefinitions().subscribe(data => {
      this.allItems = data.map((d: any) => ({ ...d, processCode: d.formCode || d.processCode || d.formCode })); // map backend inconsistencies if any
      this.applyFilters(); this.loading = false;
    });
  }

  applyFilters() {
    let result = this.allItems;
    if (this.searchTerm) {
      const t = this.searchTerm.toLowerCase();
      result = result.filter(i => (i.processName && i.processName.toLowerCase().includes(t)) || (i.processCode && i.processCode.toLowerCase().includes(t)));
    }
    if (this.activeFilter !== null) result = result.filter(i => i.active === this.activeFilter);
    this.filteredItems = result; this.loadGridData();
  }

  loadGridData() { this.gridView = process(this.filteredItems, this.state); }
  dataStateChange(state: State) { this.state = state; this.loadGridData(); }

  openCreate() { this.showCreate = true; this.creation = { processCode: '', processName: '', description: '', active: true }; }
  closeCreate() { this.showCreate = false; }
  saveCreate() {
    this.saving = true;
    // Map processCode to formCode for backend compatibility if they haven't run migration
    const payload = { ...this.creation, formCode: this.creation.processCode };
    this.svc.createProcessDefinition(payload).subscribe({
      next: (res) => { this.ns.success('Created.'); this.showCreate = false; this.saving = false; if (res.id) this.router.navigate(['/processes', res.id]); else this.refreshData(); },
      error: () => { this.ns.error('Failed creation.'); this.saving = false; }
    });
  }

  confirmDelete(item: any) { this.itemToDelete = item; }
  cancelDelete() { this.itemToDelete = null; }
  deleteItem() {
    this.svc.deleteProcessDefinition(this.itemToDelete.id).subscribe({
      next: () => { this.ns.success('Deleted'); this.itemToDelete = null; this.refreshData(); },
      error: () => { this.ns.error('Failed to delete'); this.itemToDelete = null; }
    });
  }
}
