import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { RouterModule, Router } from '@angular/router';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { DynamicProcessFormComponent } from '../../../shared/dynamic-process-form/dynamic-process-form.component';

import { ApplicationService } from '../../../core/services/application.service';
import { ProcessDefinitionService } from '../../../core/services/process-definition.service';
import { ServiceItemService } from '../../../core/services/service-item.service';
import { ProcessFieldService } from '../../../core/services/process-field.service';
import { ProcessRecordService } from '../../../core/services/process-record.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProcessDefinitionProjectMappingService } from '../../../core/services/process-definition-project-mapping.service';

@Component({
  selector: 'app-service-item-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputsModule, DropDownsModule, ButtonModule, RouterModule, PageHeaderComponent, DynamicProcessFormComponent],
  template: `
    <div class="max-w-3xl">
      <app-page-header title="New Service Item" subtitle="Create a new process tracking record."></app-page-header>
      
      <form [formGroup]="form" class="pt-form">
        <div class="form-row split-2">
          <div>
             <label>Application</label>
             <kendo-dropdownlist formControlName="applicationId" [data]="applications" textField="name" valueField="id" [valuePrimitive]="true" (valueChange)="onApplicationChange($event)"></kendo-dropdownlist>
          </div>
          <div>
             <label>Process</label>
             <kendo-dropdownlist formControlName="processDefinitionId" [data]="filteredProcesses" textField="processName" valueField="id" [valuePrimitive]="true" [disabled]="!form.get('applicationId')?.value || loadingProcesses" (valueChange)="onProcessChange($event)"></kendo-dropdownlist>
          </div>
        </div>
        <div class="form-row">
          <label>Title</label><kendo-textbox formControlName="title"></kendo-textbox>
        </div>
        <div class="form-row split-3">
          <div><label>Reference Number</label><kendo-textbox formControlName="referenceNumber"></kendo-textbox></div>
          <div><label>Status</label><kendo-dropdownlist formControlName="status" [data]="['New','In Progress','Resolved']"></kendo-dropdownlist></div>
          <div><label>Priority</label><kendo-dropdownlist formControlName="priority" [data]="['Low','Medium','High']"></kendo-dropdownlist></div>
        </div>
        <div class="form-row split-2">
          <div><label>Assigned To</label><kendo-textbox formControlName="assignedTo"></kendo-textbox></div>
        </div>
      </form>

      <div class="dynamic-section" *ngIf="dynamicFields.length > 0">
         <h3 class="section-head">Process Requirements</h3>
         <app-dynamic-process-form 
            #dynamicForm
            [fields]="dynamicFields" 
            [initialDataJson]="null"
            [saving]="submitting"
            (saveData)="onDynamicFormSubmit($event)">
         </app-dynamic-process-form>
      </div>

      <div class="form-actions mt-4">
        <button kendoButton type="button" routerLink="/service-items">Cancel</button>
        <button kendoButton themeColor="primary" (click)="submitAll()" [disabled]="form.invalid || submitting">Submit Form</button>
      </div>

    </div>
  `,
  styles: [`
    .max-w-3xl { max-width: 800px; padding: 24px; border: 1px solid #dee2e6; }
    label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 0.875rem; }
    .mt-4 { margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid #dee2e6; padding-top: 16px; }
    .dynamic-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid #dee2e6; }
    .section-head { margin: 0 0 16px; font-size: 1.1rem; color: #212529; }
    /* Hide the inner save buttons of the dynamic form since we handle it externally */
    ::ng-deep .dynamic-form .form-actions { display: none !important; }
  `]
})
export class ServiceItemCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private appService = inject(ApplicationService);
  private processDefinitionService = inject(ProcessDefinitionService);
  private svcService = inject(ServiceItemService);
  private mappingService = inject(ProcessDefinitionProjectMappingService);
  private fieldSvc = inject(ProcessFieldService);
  private recSvc = inject(ProcessRecordService);
  private router = inject(Router);
  private ns = inject(NotificationService);

  @ViewChild('dynamicForm') dynamicFormComponent!: DynamicProcessFormComponent;

  form: FormGroup;
  applications: any[] = [];
  allProcesses: any[] = [];
  filteredProcesses: any[] = [];
  dynamicFields: any[] = [];

  submitting = false;
  loadingProcesses = false;

  constructor() {
    this.form = this.fb.group({
      applicationId: ['', Validators.required],
      processDefinitionId: ['', Validators.required],
      title: ['', [Validators.required, Validators.maxLength(200)]],
      referenceNumber: ['', [Validators.required, Validators.maxLength(50)]],
      status: ['New', [Validators.required, Validators.maxLength(50)]],
      priority: ['Medium', [Validators.required, Validators.maxLength(50)]],
      assignedTo: ['', Validators.maxLength(100)]
    });
  }

  ngOnInit() {
    this.appService.getApplications().subscribe(apps => this.applications = apps);
    this.processDefinitionService.getProcessDefinitions().subscribe(f => this.allProcesses = f);
  }

  onApplicationChange(appId: string) {
    this.form.patchValue({ processDefinitionId: '' });
    this.filteredProcesses = [];
    this.dynamicFields = [];
    if (!appId) return;

    const selectedApp = this.applications.find(a => a.id === appId);
    if (!selectedApp || !selectedApp.projectId) {
      this.filteredProcesses = this.allProcesses;
      return;
    }

    this.loadingProcesses = true;
    this.mappingService.getByProject(selectedApp.projectId).subscribe({
      next: (mappings) => {
        const allowedProcessIds = mappings.map(m => m.processDefinitionId);
        this.filteredProcesses = this.allProcesses.filter(p => allowedProcessIds.includes(p.id));
        this.loadingProcesses = false;
      },
      error: () => {
        this.filteredProcesses = this.allProcesses;
        this.loadingProcesses = false;
      }
    });
  }

  onProcessChange(procId: string) {
    this.dynamicFields = [];
    if (!procId) return;
    this.fieldSvc.getProcessFields(procId).subscribe(fields => {
      this.dynamicFields = fields.sort((a: any, b: any) => a.sortOrder - b.sortOrder);
    });
  }

  submitAll() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.dynamicFields.length > 0 && this.dynamicFormComponent) {
      if (this.dynamicFormComponent.form.invalid) {
        this.dynamicFormComponent.form.markAllAsTouched();
        this.ns.error('Please fill out all required process fields.');
        return;
      }
      // This will emit to onDynamicFormSubmit which continues the chain
      this.dynamicFormComponent.onSave();
    } else {
      // No dynamic fields attached, just create the ServiceItem
      this.createServiceItem(null);
    }
  }

  onDynamicFormSubmit(jsonPayload: string) {
    this.createServiceItem(jsonPayload);
  }

  private createServiceItem(processDataJson: string | null) {
    this.submitting = true;
    this.svcService.createServiceItem(this.form.value).subscribe({
      next: (createdItem) => {
        if (processDataJson && createdItem.id) {
          // Chain Process Data persistence
          this.recSvc.createRecord({
            id: 0,
            serviceItemId: Number(createdItem.id),
            processDefinitionId: Number(this.form.value.processDefinitionId),
            dataJson: processDataJson,
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString(),
            createdBy: this.form.value.assignedTo || 'System User',
            modifiedBy: this.form.value.assignedTo || 'System User'
          }).subscribe({
            next: () => {
              this.ns.success('Service Item & Process Data created.');
              this.router.navigate(['/service-items', createdItem.id]);
            },
            error: () => {
              this.ns.success('Item created, but failed to save Process Data.');
              this.router.navigate(['/service-items', createdItem.id]);
            }
          });
        } else {
          this.ns.success('Service Item created.');
          if (createdItem.id) this.router.navigate(['/service-items', createdItem.id]);
          else this.router.navigate(['/service-items']);
        }
      },
      error: () => {
        this.ns.error('Failed to create service item.');
        this.submitting = false;
      }
    });
  }
}
