
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { GridModule } from '@progress/kendo-angular-grid';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { StatusChipComponent } from '../../../shared/status-chip/status-chip.component';
import { PriorityChipComponent } from '../../../shared/priority-chip/priority-chip.component';
import { ApplicationService } from '../../../core/services/application.service';
import { ProjectService } from '../../../core/services/project.service';
import { ServiceItemService } from '../../../core/services/service-item.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

@Component({
   selector: 'app-application-detail',
   standalone: true,
   imports: [CommonModule, RouterModule, ReactiveFormsModule, ButtonModule, IconsModule, DialogsModule, InputsModule, GridModule, LoadingStateComponent, EmptyStateComponent, StatusChipComponent, PriorityChipComponent,],
   template: `
    <div class="breadcrumb mb-4">
       <a routerLink="/projects">Projects</a>
       <kendo-icon name="chevron-right" class="mx-2"></kendo-icon>
       <a *ngIf="project" [routerLink]="['/projects', project.id]">{{project.name}}</a>
       <kendo-icon name="chevron-right" class="mx-2" *ngIf="project"></kendo-icon>
       <span>{{ app?.name || 'Loading...' }}</span>
    </div>

    <app-loading-state *ngIf="loading"></app-loading-state>

    <div *ngIf="!loading && app" class="layout-wrapper">
      <div class="header-section">
         <div style="flex: 1;">
            <div class="title-row">
               <h1 class="main-title">{{app.name}}</h1>
            </div>
            <div class="ref-number">{{app.description || 'Application boundary domain'}}</div>
         </div>
         <div class="header-actions">
            <button kendoButton themeColor="primary" icon="plus" (click)="router.navigate(['/service-items/create'])">New Service Item</button>
            <button kendoButton (click)="openEdit()">Edit App</button>
         </div>
      </div>

      <div class="main-section">
         <h3 class="section-head">Service Items</h3>
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
             <kendo-grid-column title="Assigned To" [width]="180">
                <ng-template kendoGridCellTemplate let-dataItem>
                   <span class="muted-text">{{dataItem.assignedTo || 'Unassigned'}}</span>
                </ng-template>
             </kendo-grid-column>
             <kendo-grid-column title="Action" [width]="90">
                <ng-template kendoGridCellTemplate let-dataItem>
                   <button kendoButton fillMode="flat" themeColor="primary" [routerLink]="['/service-items', dataItem.id]">Open</button>
                </ng-template>
             </kendo-grid-column>
           </kendo-grid>
         </div>
         <app-empty-state *ngIf="serviceItems.length === 0" icon="parameter-header" title="No service items" description="Start managing work inside this application domain." actionLabel="Create Service Item" (action)="router.navigate(['/service-items/create'])"></app-empty-state>
      </div>
    </div>
    
    <kendo-dialog *ngIf="isEditing" title="Edit Application" (close)="closeEdit()" [width]="500">
      <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="pt-form">
         <div class="form-row">
            <label>Name</label><kendo-textbox formControlName="name"></kendo-textbox>
         </div>
         <div class="form-row">
            <label>Description</label><textarea kendoTextArea formControlName="description"></textarea>
         </div>
      </form>
      <kendo-dialog-actions>
         <button kendoButton (click)="closeEdit()" [disabled]="saving">Cancel</button>
         <button kendoButton themeColor="primary" (click)="saveEdit()" [disabled]="editForm.invalid || saving">Save Changes</button>
      </kendo-dialog-actions>
    </kendo-dialog>
  `,
   styles: [`
    .mb-4 { margin-bottom: 24px; } .mx-2 { margin: 0 8px; }
    .breadcrumb { font-size: 0.875rem; margin-bottom: 16px; }
    .layout-wrapper { display: flex; flex-direction: column; gap: 32px; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #dee2e6; }
    .title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .main-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #212529; }
    .ref-number { font-size: 0.875rem; color: #6c757d; }
    .header-actions { display: flex; gap: 8px; }
    
    .section-head { margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #212529; }
    .grid-container { overflow: hidden; border: 1px solid #dee2e6; }
    .ref-link { color: #0058e9; font-family: monospace; font-weight: 500; font-size: 0.85rem; }
  `]
})
export class ApplicationDetailComponent implements OnInit {
   router = inject(Router); private route = inject(ActivatedRoute); private appSvc = inject(ApplicationService); private projSvc = inject(ProjectService); private itemSvc = inject(ServiceItemService); private ns = inject(NotificationService); private fb = inject(FormBuilder); private rv = inject(RecentlyViewedService);
   loading = true; appId: string | null = null; app: any; project: any;
   serviceItems: any[] = [];
   editForm!: FormGroup; isEditing = false; saving = false;

   ngOnInit() {
      this.appId = this.route.snapshot.paramMap.get('id');
      if (this.appId) this.loadFull();
   }

   loadFull() {
      this.loading = true;
      forkJoin({
         app: this.appSvc.getApplication(this.appId!),
         items: this.itemSvc.getServiceItems(this.appId!).pipe(catchError(() => of([])))
      }).subscribe(data => {
         this.app = data.app;
         this.rv.add({ id: this.app.id, type: 'Application', title: this.app.name, url: '/applications/' + this.app.id });
         this.serviceItems = data.items;

         if (this.app.projectId) {
            this.projSvc.getProject(this.app.projectId).subscribe(p => {
               this.project = p;
               this.loading = false;
            });
         } else {
            this.loading = false;
         }
      });
   }

   openEdit() {
      this.editForm = this.fb.group({ name: [this.app.name, Validators.required], description: [this.app.description] });
      this.isEditing = true;
   }
   closeEdit() { this.isEditing = false; }
   saveEdit() {
      if (this.editForm.invalid) return; this.saving = true;
      this.appSvc.updateApplication(this.appId!, this.editForm.value).subscribe({
         next: () => { this.ns.success('Application updated.'); this.app = { ...this.app, ...this.editForm.value }; this.isEditing = false; this.saving = false; },
         error: () => { this.ns.error('Failed to update.'); this.saving = false; }
      });
   }
}
