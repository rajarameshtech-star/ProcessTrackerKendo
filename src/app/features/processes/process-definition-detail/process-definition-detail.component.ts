
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GridModule } from '@progress/kendo-angular-grid';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ProcessDefinitionService } from '../../../core/services/process-definition.service';
import { ProcessFieldService } from '../../../core/services/process-field.service';
import { ProcessDefinitionProjectMappingService } from '../../../core/services/process-definition-project-mapping.service';
import { ProjectService } from '../../../core/services/project.service';
import { NotificationService } from '../../../core/services/notification.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { process as kendoProcess, State } from '@progress/kendo-data-query';

@Component({
   selector: 'app-process-definition-detail',
   standalone: true,
   imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, GridModule, ButtonModule, IconsModule, DialogsModule, InputsModule, DropDownsModule, LoadingStateComponent, EmptyStateComponent],
   template: `
    <div class="breadcrumb mb-4">
       <a routerLink="/processes">Processes</a>
       <kendo-icon name="chevron-right" class="mx-2"></kendo-icon>
       <span>{{ process?.processName || 'Loading...' }}</span>
    </div>

    <app-loading-state *ngIf="loading"></app-loading-state>

    <div *ngIf="!loading && process" class="layout-wrapper">
      <div class="header-section">
         <div style="flex: 1;">
            <div class="title-row">
               <h1 class="main-title">{{process.processName}}</h1>
               <span class="active-pill" [class.inactive]="!process.active">{{process.active ? 'Active' : 'Inactive'}}</span>
            </div>
            <div class="ref-number monospaced">{{process.formCode || process.processCode}} &nbsp;&middot;&nbsp; {{process.description}}</div>
         </div>
         <div class="header-actions">
            <button kendoButton icon="folder-open" fillMode="flat" (click)="showMapProject = !showMapProject">Map Projects</button>
         </div>
      </div>

      <div class="main-grid">
         <div class="workspace-col">
            <div class="section-container">
               <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
                  <h3 class="section-head" style="margin:0;">Process Fields</h3>
                  <button kendoButton themeColor="primary" icon="plus" fillMode="flat" (click)="openFieldCreate()">Add Field</button>
               </div>
               
               <kendo-grid [data]="fieldsData" [sortable]="false" *ngIf="fields.length > 0">
                  <kendo-grid-column field="sortOrder" title="Order" [width]="80"></kendo-grid-column>
                  <kendo-grid-column field="label" title="Label"></kendo-grid-column>
                  <kendo-grid-column field="fieldName" title="Field Name" [width]="200"></kendo-grid-column>
                  <kendo-grid-column title="Type" [width]="150">
                     <ng-template kendoGridCellTemplate let-dataItem>
                         <span class="type-badge">{{getFieldTypeName(dataItem.fieldType)}}</span>
                     </ng-template>
                  </kendo-grid-column>
                  <kendo-grid-column title="Required" [width]="100">
                     <ng-template kendoGridCellTemplate let-dataItem>
                         <span [style.color]="dataItem.isRequired ? '#10b981' : '#6c757d'" style="font-weight: 500;">
                             {{dataItem.isRequired ? 'Yes' : 'No'}}
                         </span>
                     </ng-template>
                  </kendo-grid-column>
                  <kendo-grid-column title="Actions" [width]="180">
                     <ng-template kendoGridCellTemplate let-dataItem>
                        <button kendoButton fillMode="flat" (click)="openFieldEdit(dataItem)" themeColor="primary">Edit</button>
                        <button kendoButton fillMode="flat" themeColor="error" (click)="confirmFieldDelete(dataItem)">Delete</button>
                     </ng-template>
                  </kendo-grid-column>
               </kendo-grid>
               
               <app-empty-state *ngIf="fields.length === 0" icon="table" title="No fields defined" description="Build the metadata contract for this process." actionLabel="Add Process Field" (action)="openFieldCreate()"></app-empty-state>
            </div>
         </div>
         
         <div class="properties-col">
            <div class="prop-panel">
               <div style="display:flex; justify-content:space-between; align-items: center; margin-bottom: 16px;">
                 <h3 class="section-head" style="margin: 0;">Available in Projects</h3>
                 <button kendoButton icon="plus" fillMode="flat" (click)="showMapProject = !showMapProject"></button>
               </div>
               
               <div *ngIf="showMapProject" class="mb-4 pt-form p-3" style="background: white; border-radius: 4px; border: 1px solid #dee2e6;">
                  <label>Add to project</label>
                  <kendo-dropdownlist [data]="unmappedProjects" textField="name" valueField="id" [valuePrimitive]="true" [(ngModel)]="projectToMap" style="width: 100%; margin-bottom: 8px;"></kendo-dropdownlist>
                  <div style="display: flex; gap: 8px;">
                     <button kendoButton (click)="showMapProject = false; projectToMap = null">Cancel</button>
                     <button kendoButton themeColor="primary" [disabled]="!projectToMap" (click)="mapProject()">Map</button>
                  </div>
               </div>

               <div class="prop-list">
                  <div class="prop-item" *ngFor="let map of projectMappings">
                     <div style="display:flex; justify-content:space-between; width: 100%; align-items:center;">
                        <span class="prop-value" style="font-weight: 500;">{{getProjectName(map.projectId)}}</span>
                        <button kendoButton icon="x" fillMode="flat" size="small" themeColor="error" (click)="unmapProject(map.projectId)"></button>
                     </div>
                  </div>
                  <div class="prop-item text-center muted-text" *ngIf="projectMappings.length === 0">
                     Not mapped to any projects.<br>Service Items cannot use this process.
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- Field Editor Modal -->
    <kendo-dialog *ngIf="isFieldEditorOpen" title="Process Field" (close)="closeFieldEditor()" [width]="700">
      <form [formGroup]="fieldForm" (ngSubmit)="saveField()" class="pt-form">
         <div class="form-row split-2">
            <div><label>Field Name (API key)</label><kendo-textbox formControlName="fieldName"></kendo-textbox>
                 <small class="error-msg" *ngIf="fieldForm.get('fieldName')?.touched && fieldForm.get('fieldName')?.invalid">Field name is required.</small></div>
            <div><label>UI Label</label><kendo-textbox formControlName="label"></kendo-textbox>
                 <small class="error-msg" *ngIf="fieldForm.get('label')?.touched && fieldForm.get('label')?.invalid">Label is required.</small></div>
         </div>
         <div class="form-row split-2">
            <div><label>Field Type</label><kendo-dropdownlist formControlName="fieldType" [data]="fieldTypes" textField="text" valueField="value" [valuePrimitive]="true"></kendo-dropdownlist></div>
            <div><label>Sort Order</label><kendo-numerictextbox formControlName="sortOrder" [min]="0" [autoCorrect]="true"></kendo-numerictextbox></div>
         </div>
         
         <div class="form-row split-2">
            <div style="display:flex; align-items:center; gap: 8px; margin-top: 24px;">
               <input type="checkbox" formControlName="isRequired" kendoCheckBox/> <label style="margin:0;">Required field</label>
            </div>
            <div style="display:flex; align-items:center; gap: 8px; margin-top: 24px;">
               <input type="checkbox" formControlName="isActive" kendoCheckBox/> <label style="margin:0;">Active</label>
            </div>
         </div>

         <div class="separator">Advanced</div>

         <div class="form-row split-2" *ngIf="fieldForm.get('fieldType')?.value === 0 || fieldForm.get('fieldType')?.value === 7">
            <div><label>Placeholder text</label><kendo-textbox formControlName="placeholder"></kendo-textbox></div>
            <div><label>Default Value</label><kendo-textbox formControlName="defaultValue"></kendo-textbox></div>
         </div>

         <div class="form-row" *ngIf="fieldForm.get('fieldType')?.value === 6">
            <label>Dropdown Options JSON</label>
            <textarea kendoTextArea formControlName="optionsJson" placeholder='["Option 1", "Option 2"] or [{"label":"L","value":1}]' [rows]="4"></textarea>
            <small style="color:#6c757d">Enter a valid JSON array.</small>
         </div>

      </form>
      <kendo-dialog-actions>
         <button kendoButton (click)="closeFieldEditor()" [disabled]="saving">Cancel</button>
         <button kendoButton themeColor="primary" (click)="saveField()" [disabled]="fieldForm.invalid || saving">Save Field</button>
      </kendo-dialog-actions>
    </kendo-dialog>

    <kendo-dialog *ngIf="fieldToDelete" title="Delete Field?" (close)="fieldToDelete = null" [minWidth]="300">
        <p>This action affects all process records missing this field definition.</p>
        <p style="font-weight: 500;">{{fieldToDelete.label}} ({{fieldToDelete.fieldName}})</p>
        <kendo-dialog-actions>
            <button kendoButton (click)="fieldToDelete = null">Cancel</button>
            <button kendoButton themeColor="primary" (click)="deleteField()">Delete</button>
        </kendo-dialog-actions>
    </kendo-dialog>
  `,
   styles: [`
    .mb-4 { margin-bottom: 16px; } .mx-2 { margin: 0 8px; } .mt-2 { margin-top: 8px; } .p-3 { padding: 12px; }
    .breadcrumb { font-size: 0.875rem; margin-bottom: 16px; }
    .layout-wrapper { display: flex; flex-direction: column; gap: 24px; }
    .header-section { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #dee2e6; }
    .title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .main-title { margin: 0; font-size: 1.5rem; font-weight: 600; }
    .monospaced { font-family: monospace; }
    .header-actions { display: flex; gap: 8px; }
    .main-grid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: flex-start; }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
    .active-pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500; background: #dcfce7; color: #166534; }
    .active-pill.inactive { background: #fee2e2; color: #991b1b; }
    .type-badge { font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 500;}
    .separator { margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 1px solid #dee2e6; font-weight: 600; font-size: 0.875rem; }
    .error-msg { color: #dc2626; display: block; margin-top: 4px; }
  `]
})
export class ProcessDefinitionDetailComponent implements OnInit {
   private route = inject(ActivatedRoute); private svc = inject(ProcessDefinitionService); private fieldSvc = inject(ProcessFieldService); private mapSvc = inject(ProcessDefinitionProjectMappingService); private projSvc = inject(ProjectService); private ns = inject(NotificationService); private fb = inject(FormBuilder);

   loading = true; processId: string | null = null; process: any;
   fields: any[] = []; fieldsData: any[] = [];
   projectMappings: any[] = []; allProjects: any[] = []; unmappedProjects: any[] = [];

   fieldTypes = [{ text: 'Text', value: 0 }, { text: 'Number', value: 1 }, { text: 'Decimal', value: 2 }, { text: 'Boolean', value: 3 }, { text: 'Date', value: 4 }, { text: 'Date & Time', value: 5 }, { text: 'Select', value: 6 }, { text: 'Url', value: 7 }];

   isFieldEditorOpen = false; fieldForm!: FormGroup; saving = false; editingFieldId: string | null = null;
   fieldToDelete: any = null;

   showMapProject = false; projectToMap: string | null = null;

   ngOnInit() {
      this.processId = this.route.snapshot.paramMap.get('id');
      if (this.processId) this.loadData();
   }

   loadData() {
      this.loading = true;
      forkJoin({
         process: this.svc.getProcessDefinition(this.processId!),
         fields: this.fieldSvc.getProcessFields(this.processId!).pipe(catchError(() => of([]))),
         mappings: this.mapSvc.getByProcessDefinition(this.processId!).pipe(catchError(() => of([]))),
         projects: this.projSvc.getProjects().pipe(catchError(() => of([])))
      }).subscribe(data => {
         this.process = data.process;
         this.fields = data.fields.map((f: any) => ({ ...f, isRequired: f.required !== undefined ? f.required : f.isRequired }));
         this.fieldsData = [...this.fields].sort((a, b) => a.sortOrder - b.sortOrder);
         this.projectMappings = data.mappings;
         this.allProjects = data.projects;
         this.updateUnmappedProjects();
         this.loading = false;
      });
   }

   updateUnmappedProjects() {
      const mappedIds = this.projectMappings.map(m => m.projectId);
      this.unmappedProjects = this.allProjects.filter(p => !mappedIds.includes(p.id));
   }

   getFieldTypeName(v: number) { return this.fieldTypes.find(t => t.value === v)?.text || 'Unknown'; }
   getProjectName(id: string) { return this.allProjects.find(p => p.id === id)?.name || id; }

   openFieldCreate() {
      this.editingFieldId = null;
      this.initFieldForm(null);
      this.isFieldEditorOpen = true;
   }
   openFieldEdit(field: any) {
      this.editingFieldId = field.id;
      this.initFieldForm(field);
      this.isFieldEditorOpen = true;
   }
   initFieldForm(field: any) {
      this.fieldForm = this.fb.group({
         fieldName: [field?.fieldName || '', [Validators.required, Validators.maxLength(50)]],
         label: [field?.label || '', [Validators.required, Validators.maxLength(100)]],
         fieldType: [field?.fieldType ?? 0, Validators.required],
         sortOrder: [field?.sortOrder ?? (this.fields.length * 10), Validators.required],
         isRequired: [field?.isRequired ?? field?.required ?? false],
         isActive: [field?.isActive ?? true],
         placeholder: [field?.placeholder || ''],
         defaultValue: [field?.defaultValue || ''],
         optionsJson: [field?.optionsJson || '']
      });
   }
   closeFieldEditor() { this.isFieldEditorOpen = false; }
   saveField() {
      if (this.fieldForm.invalid) return;
      this.saving = true;
      const baseObj = this.editingFieldId ? this.fields.find(f => f.id === this.editingFieldId) || {} : { id: 0 };

      const payload: any = {
         ...baseObj,
         ...this.fieldForm.value,
         processDefinitionId: Number(this.processId),
         required: this.fieldForm.value.isRequired
      };

      if (this.editingFieldId) {
         payload.id = Number(this.editingFieldId);
         this.fieldSvc.updateProcessField(this.editingFieldId, payload).subscribe({
            next: () => { this.ns.success('Field updated.'); this.loadData(); this.closeFieldEditor(); this.saving = false; },
            error: () => { this.ns.error('Failed to update field.'); this.saving = false; }
         });
      } else {
         this.fieldSvc.createProcessField(payload).subscribe({
            next: () => { this.ns.success('Field created.'); this.loadData(); this.closeFieldEditor(); this.saving = false; },
            error: () => { this.ns.error('Failed to create field.'); this.saving = false; }
         });
      }
   }

   confirmFieldDelete(f: any) { this.fieldToDelete = f; }
   deleteField() {
      this.fieldSvc.deleteProcessField(this.fieldToDelete.id).subscribe({
         next: () => { this.ns.success('Field deleted'); this.fieldToDelete = null; this.loadData(); },
         error: () => { this.ns.error('Failed to delete field'); this.fieldToDelete = null; }
      });
   }

   mapProject() {
      if (!this.projectToMap) return;
      this.mapSvc.createMapping({ processDefinitionId: this.processId!, projectId: this.projectToMap }).subscribe({
         next: () => { this.ns.success('Project mapped.'); this.showMapProject = false; this.projectToMap = null; this.loadData(); },
         error: () => { this.ns.error('Failed mapping'); }
      });
   }
   unmapProject(projectId: string) {
      this.mapSvc.deleteMapping(this.processId!, projectId).subscribe({
         next: () => { this.ns.success('Mapping removed.'); this.loadData(); },
         error: () => { this.ns.error('Failed removing mapping'); }
      });
   }
}
