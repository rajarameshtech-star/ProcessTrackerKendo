
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { IndicatorsModule } from '@progress/kendo-angular-indicators';
import { LayoutModule } from '@progress/kendo-angular-layout';

import { StatusChipComponent } from '../../../shared/status-chip/status-chip.component';
import { PriorityChipComponent } from '../../../shared/priority-chip/priority-chip.component';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { DynamicProcessFormComponent } from '../../../shared/dynamic-process-form/dynamic-process-form.component';

import { ServiceItemService } from '../../../core/services/service-item.service';
import { ApplicationService } from '../../../core/services/application.service';
import { ProcessDefinitionService } from '../../../core/services/process-definition.service';
import { ProcessRecordService } from '../../../core/services/process-record.service';
import { ProcessFieldService } from '../../../core/services/process-field.service';
import { NotificationService } from '../../../core/services/notification.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
   selector: 'app-service-item-detail',
   standalone: true,
   imports: [CommonModule, RouterModule, ButtonModule, IconsModule, DialogsModule, ReactiveFormsModule, InputsModule, DropDownsModule, IndicatorsModule, LayoutModule, StatusChipComponent, PriorityChipComponent, LoadingStateComponent, DatePipe, DynamicProcessFormComponent],
   template: `
    <div class="breadcrumb mb-4">
       <a routerLink="/service-items">Service Items</a>
       <kendo-icon name="chevron-right" class="mx-2"></kendo-icon>
       <span>{{ item?.referenceNumber || 'Loading...' }}</span>
    </div>

    <app-loading-state *ngIf="loading"></app-loading-state>

    <div *ngIf="!loading && item" class="layout-wrapper">
      <div class="header-section">
         <div style="flex: 1;">
            <div class="title-row">
               <h1 class="main-title">{{item.title}}</h1>
               <app-status-chip [status]="item.status"></app-status-chip>
               <app-priority-chip [priority]="item.priority"></app-priority-chip>
            </div>
            <div class="ref-number monospaced">{{item.referenceNumber}} &middot; {{process?.name || ''}}</div>
         </div>
         <div class="header-actions">
            <button kendoButton icon="pencil" (click)="openEdit()">Edit</button>
            <button kendoButton  fillMode="flat">More</button>
         </div>
      </div>

      <div class="main-grid">
         <div class="workspace-col">
            <kendo-tabstrip>
               <kendo-tabstrip-tab title="Overview" [selected]="false">
                  <ng-template kendoTabContent>
                     <div class="tab-pad">
                        <h3>Tracking Details</h3>
                        <p style="color: #6c757d">Service item creation logged successfully. See Process Data tab for operational workflow details.</p>
                     </div>
                  </ng-template>
               </kendo-tabstrip-tab>
               <kendo-tabstrip-tab title="Process Data" [selected]="true">
                  <ng-template kendoTabContent>
                     <div class="tab-pad" *ngIf="!dataLoading && process">
                         
                         <!-- Creation Call to action -->
                         <div *ngIf="!processRecord && !isCreatingData" class="empty-inline text-center">
                             <kendo-icon name="form" size="xlarge" class="mb-2" style="color: #6c757d"></kendo-icon>
                             <h4>Process data hasn't been entered yet</h4>
                             <p>Complete the process information to start tracking this item's progress.</p>
                             <button kendoButton themeColor="primary" class="mt-2 text-center" (click)="isCreatingData = true">Add Process Data</button>
                         </div>
                         
                         <!-- Dynamic Engine Renderer -->
                         <div *ngIf="processRecord || isCreatingData" class="process-workspace">
                            <div class="process-audit-bar" *ngIf="processRecord">
                               Last updated: {{processRecord.modifiedDate ? (processRecord.modifiedDate | date:'medium') : (processRecord.createdDate | date:'medium') || 'Unknown'}}
                            </div>
                         
                            <app-dynamic-process-form 
                               [fields]="processFields" 
                               [initialDataJson]="processRecord ? processRecord.dataJson : null"
                               [saving]="processSaving"
                               (saveData)="onProcessDataSave($event)">
                            </app-dynamic-process-form>
                         </div>
                         
                     </div>
                     <div *ngIf="dataLoading" style="padding: 24px;"><kendo-loader></kendo-loader></div>
                  </ng-template>
               </kendo-tabstrip-tab>
               <kendo-tabstrip-tab title="Activity">
                  <ng-template kendoTabContent>
                     <div class="tab-pad">
                        <em style="color: #6c757d">Activity logs deferred to next iteration.</em>
                     </div>
                  </ng-template>
               </kendo-tabstrip-tab>
            </kendo-tabstrip>
         </div>
         
         <div class="properties-col">
            <div class="prop-panel">
               <h3 class="section-head" style="margin-top: 0;">Properties</h3>
               <div class="prop-list">
                  <div class="prop-item">
                     <span class="prop-label">Application</span>
                     <a [routerLink]="['/applications']" [queryParams]="{projectId: app?.projectId}" class="prop-value link">{{app?.name}}</a>
                  </div>
                  <div class="prop-item">
                     <span class="prop-label">Process</span>
                     <a [routerLink]="['/processes', process?.id]" class="prop-value link">{{process?.name}} <span style="opacity:0.6;font-size:0.75rem;margin-left:4px;">{{process?.processCode || process?.formCode}}</span></a>
                  </div>
                  <div class="prop-item">
                     <span class="prop-label">Status</span>
                     <div class="prop-value"><app-status-chip [status]="item.status"></app-status-chip></div>
                  </div>
                  <div class="prop-item">
                     <span class="prop-label">Priority</span>
                     <div class="prop-value"><app-priority-chip [priority]="item.priority"></app-priority-chip></div>
                  </div>
                  <div class="prop-item">
                     <span class="prop-label">Assigned To</span>
                     <div class="prop-value user-pill" *ngIf="item.assignedTo">
                        <div class="sm-avatar">{{item.assignedTo.charAt(0) | uppercase}}</div>
                        {{item.assignedTo}}
                     </div>
                     <span class="prop-value muted-text" *ngIf="!item.assignedTo">Unassigned</span>
                  </div>
                  <div class="prop-item">
                     <span class="prop-label">Created</span>
                     <span class="prop-value muted-text">{{ (item.createdAt | date:'medium') || '-' }}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- Edit Dialog -->
    <kendo-dialog *ngIf="isEditing" title="Edit Service Item" (close)="closeEdit()" [width]="600">
      <form [formGroup]="editForm" (ngSubmit)="saveEdit()" class="pt-form">
         <div class="form-row">
            <label>Title</label><kendo-textbox formControlName="title"></kendo-textbox>
         </div>
         <div class="form-row split-2">
            <div><label>Status</label><kendo-dropdownlist formControlName="status" [data]="['New','In Progress','Completed','Blocked','Cancelled']"></kendo-dropdownlist></div>
            <div><label>Priority</label><kendo-dropdownlist formControlName="priority" [data]="['Low','Medium','High','Critical']"></kendo-dropdownlist></div>
         </div>
         <div class="form-row">
            <label>Assigned To</label><kendo-textbox formControlName="assignedTo"></kendo-textbox>
         </div>
      </form>
      <kendo-dialog-actions>
         <button kendoButton (click)="closeEdit()" [disabled]="saving">Cancel</button>
         <button kendoButton themeColor="primary" (click)="saveEdit()" [disabled]="editForm.invalid || saving">{{saving ? 'Saving...' : 'Save Changes'}}</button>
      </kendo-dialog-actions>
    </kendo-dialog>
  `,
   styles: [`
    .mb-4 { margin-bottom: 16px; } .mb-2 { margin-bottom: 8px; } .mx-2 { margin: 0 8px; } .mt-2 { margin-top: 8px; }
    .breadcrumb { font-size: 0.875rem; margin-bottom: 16px; }
    .layout-wrapper { display: flex; flex-direction: column; gap: 24px; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #dee2e6; }
    .title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .main-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #212529; }
    .ref-number { font-size: 0.875rem; color: #6c757d; }
    .monospaced { font-family: monospace; }
    .header-actions { display: flex; gap: 8px; }
    
    .main-grid { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: flex-start; }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
    
    .tab-pad { padding: 24px 0; }
    .section-head { margin: 0 0 16px 0; font-size: 1.125rem; font-weight: 600; color: #212529; }
    
    .prop-panel { padding: 16px; border: 1px solid #dee2e6; }
    .prop-list { display: flex; flex-direction: column; gap: 8px; }
    .prop-item { display: flex; flex-direction: column; }
    .prop-label { font-size: 0.875rem; font-weight: 600; color: #495057; margin-bottom: 4px; }
    .prop-value { font-size: 0.875rem; color: #212529; display: flex; align-items: center; }
    .user-pill { display: inline-flex; align-items: center; background: #f8f9fa; padding: 4px 12px; border: 1px solid #dee2e6; font-size: 0.8125rem; }
    .sm-avatar { width: 20px; height: 20px; background: #adb5bd; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; margin-right: 8px; }
    
    .empty-inline { padding: 24px; text-align: center; border: 1px dashed #dee2e6; }
    .text-center { text-align: center; }
    .process-audit-bar { font-size: 0.75rem; color: #6c757d; margin-bottom: 12px; text-align: right; }
  `]
})
export class ServiceItemDetailComponent implements OnInit {
   private route = inject(ActivatedRoute);
   private svc = inject(ServiceItemService);
   private appSvc = inject(ApplicationService);
   private procSvc = inject(ProcessDefinitionService);
   private recSvc = inject(ProcessRecordService);
   private fieldSvc = inject(ProcessFieldService);
   private ns = inject(NotificationService);
   private fb = inject(FormBuilder);

   loading = true; dataLoading = true;
   itemId: string | null = null;
   item: any; app: any; process: any;
   processRecord: any = null; processFields: any[] = [];

   isEditing = false; saving = false; editForm!: FormGroup;
   isCreatingData = false; processSaving = false;

   ngOnInit() {
      this.itemId = this.route.snapshot.paramMap.get('id');
      if (this.itemId) this.loadFullDetails();
   }

   loadFullDetails() {
      this.loading = true;
      this.svc.getServiceItem(this.itemId!).subscribe({
         next: (data) => {
            this.item = data;
            forkJoin({
               app: this.appSvc.getApplications().pipe(catchError(() => of([]))),
               proc: this.procSvc.getProcessDefinitions().pipe(catchError(() => of([])))
            }).subscribe(meta => {
               this.app = meta.app.find((a: any) => a.id === this.item.applicationId);
               this.process = meta.proc.find((p: any) => p.id === this.item.processDefinitionId);
               this.loading = false;
               this.loadProcessData();
            });
         },
         error: () => this.loading = false
      });
   }

   loadProcessData() {
      this.dataLoading = true;
      if (!this.item.processDefinitionId) { this.dataLoading = false; return; }

      forkJoin({
         f: this.fieldSvc.getProcessFields(this.item.processDefinitionId).pipe(catchError(() => of([]))),
         r: this.recSvc.getRecordByServiceItem(this.itemId!).pipe(catchError(() => of(null)))
      }).subscribe(res => {
         this.processFields = res.f.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
         if (res.r) {
            this.processRecord = res.r;
            this.isCreatingData = false;
         }
         this.dataLoading = false;
      });
   }

   onProcessDataSave(jsonPayload: string) {
      this.processSaving = true;
      if (this.processRecord) {
         // Update
         this.recSvc.updateRecord(this.processRecord.id, {
            ...this.processRecord,
            dataJson: jsonPayload,
            modifiedDate: new Date().toISOString(),
            modifiedBy: 'System User'
         }).subscribe({
            next: (updated) => {
               this.ns.success('Process data updated');
               this.processRecord = updated;
               this.processSaving = false;
               this.loadProcessData();
            },
            error: () => { this.ns.error('Failed to update process data'); this.processSaving = false; }
         });
      } else {
         // Create
         this.recSvc.createRecord({
            id: 0,
            serviceItemId: Number(this.itemId),
            processDefinitionId: this.process.id,
            dataJson: jsonPayload,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString(),
            createdBy: 'System User',
            modifiedBy: 'System User'
         }).subscribe({
            next: (created) => {
               this.ns.success('Process data created');
               this.processRecord = created;
               this.processSaving = false;
               this.isCreatingData = false;
               this.loadProcessData();
            },
            error: () => { this.ns.error('Failed to save process data'); this.processSaving = false; }
         });
      }
   }

   openEdit() {
      this.editForm = this.fb.group({
         title: [this.item.title, Validators.required],
         status: [this.item.status, Validators.required],
         priority: [this.item.priority, Validators.required],
         assignedTo: [this.item.assignedTo]
      });
      this.isEditing = true;
   }
   closeEdit() { this.isEditing = false; }
   saveEdit() {
      if (this.editForm.invalid) return;
      this.saving = true;
      this.svc.updateServiceItem(this.itemId!, { ...this.item, ...this.editForm.value }).subscribe({
         next: () => {
            this.ns.success('Updated successfully');
            this.item = { ...this.item, ...this.editForm.value };
            this.saving = false; this.isEditing = false;
         },
         error: () => { this.ns.error('Failed to update'); this.saving = false; }
      });
   }
}
