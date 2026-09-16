
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { ProcessFieldValueComponent } from '../process-field-value/process-field-value.component';

@Component({
   selector: 'app-dynamic-process-form',
   standalone: true,
   imports: [CommonModule, ReactiveFormsModule, InputsModule, DropDownsModule, DateInputsModule, ButtonModule, ProcessFieldValueComponent],
   template: `
    <div *ngIf="mode === 'view'" class="view-mode">
       <div class="completion-bar-container" *ngIf="fields.length > 0">
          <div class="completion-header">
             <span style="font-weight: 500; font-size: 0.875rem;">Process completion</span>
             <span style="font-weight: 600;">{{completionPercentage}}%</span>
          </div>
          <div class="progress-track" [title]="missingRequired + ' required fields need attention'">
             <div class="progress-fill" [style.width.%]="completionPercentage" [class.complete]="completionPercentage === 100"></div>
          </div>
          <div class="completion-footer" *ngIf="missingRequired > 0">
             <span class="warning-text">{{missingRequired}} required fields need attention</span>
          </div>
       </div>

       <div class="data-grid">
          <div class="data-item" *ngFor="let f of fields">
             <div class="data-label">
                {{f.label}}
                <span *ngIf="f.isRequired" class="req-star">*</span>
             </div>
             <div class="data-value" [class.missing]="f.isRequired && !hasValue(f.fieldName)">
                <app-process-field-value [value]="parsedData[f.fieldName]" [fieldType]="f.fieldType"></app-process-field-value>
             </div>
          </div>
       </div>

       <div class="form-actions mt-4">
          <button kendoButton icon="pencil" (click)="toggleEdit()">Edit Process Data</button>
       </div>
    </div>

    <div *ngIf="mode === 'edit'" class="edit-mode">
       <form [formGroup]="form" (ngSubmit)="onSave()" class="pt-form dynamic-form">
          <div class="form-grid">
             <div class="field-container" *ngFor="let f of fields">
                 <label [for]="f.fieldName">{{f.label}} <span *ngIf="f.isRequired" class="req-star">*</span></label>
                 
                 <!-- Text / Number / Decimal / Url -->
                 <ng-container *ngIf="f.fieldType === 0 || f.fieldType === 1 || f.fieldType === 2 || f.fieldType === 7">
                    <kendo-textbox *ngIf="f.fieldType === 0 || f.fieldType === 7" [formControlName]="f.fieldName" [placeholder]="f.placeholder || ''"></kendo-textbox>
                    <kendo-numerictextbox *ngIf="f.fieldType === 1" [formControlName]="f.fieldName" [autoCorrect]="true" [spinners]="false" format="n0"></kendo-numerictextbox>
                    <kendo-numerictextbox *ngIf="f.fieldType === 2" [formControlName]="f.fieldName" [autoCorrect]="true" [spinners]="false"></kendo-numerictextbox>
                 </ng-container>

                 <!-- Boolean -->
                 <ng-container *ngIf="f.fieldType === 3">
                    <kendo-switch [formControlName]="f.fieldName" onLabel="Yes" offLabel="No"></kendo-switch>
                 </ng-container>

                 <!-- Date -->
                 <ng-container *ngIf="f.fieldType === 4">
                    <kendo-datepicker [formControlName]="f.fieldName"></kendo-datepicker>
                 </ng-container>

                 <!-- DateTime -->
                 <ng-container *ngIf="f.fieldType === 5">
                    <kendo-datetimepicker [formControlName]="f.fieldName"></kendo-datetimepicker>
                 </ng-container>

                 <!-- Select -->
                 <ng-container *ngIf="f.fieldType === 6">
                    <kendo-dropdownlist [formControlName]="f.fieldName" [data]="getOptions(f)" [defaultItem]="'Select item...'"></kendo-dropdownlist>
                 </ng-container>

                 <small class="error-msg" *ngIf="form.get(f.fieldName)?.invalid && form.get(f.fieldName)?.touched">
                    <ng-container *ngIf="form.get(f.fieldName)?.errors?.['required']">{{f.label}} is required.</ng-container>
                    <ng-container *ngIf="form.get(f.fieldName)?.errors?.['maxlength']">Must be at most {{f.maxLength}} characters.</ng-container>
                    <ng-container *ngIf="form.get(f.fieldName)?.errors?.['pattern'] && f.fieldType === 7">Please enter a valid URL.</ng-container>
                 </small>
             </div>
          </div>

          <div class="form-actions mt-4 form-action-bar">
             <button kendoButton type="button" (click)="cancelEdit()">Cancel</button>
             <button kendoButton themeColor="primary" type="submit" [disabled]="form.invalid || saving">Save Data</button>
          </div>
       </form>
    </div>
  `,
   styles: [`
    .req-star { color: #dc2626; margin-left: 2px; }
    .error-msg { color: #dc2626; display: block; margin-top: 4px; font-size: 0.75rem; }
    .mt-4 { margin-top: 24px; }
    
    .completion-bar-container { background: #f8f9fa; padding: 16px; border: 1px solid #dee2e6; margin-bottom: 24px; }
    .completion-header { display: flex; justify-content: space-between; margin-bottom: 8px; color: #212529; }
    .progress-track { height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; background: #0058e9; transition: width 0.3s ease; }
    .progress-fill.complete { background: #10b981; }
    .completion-footer { margin-top: 8px; font-size: 0.75rem; }
    .warning-text { color: #b45309; font-weight: 500; }
    
    .data-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
    .data-item { display: flex; flex-direction: column; }
    .data-label { font-size: 0.75rem; font-weight: 600; color: #6c757d; text-transform: uppercase; margin-bottom: 6px; }
    .data-value { font-size: 0.9rem; color: #212529; min-height: 24px; display:flex; align-items:center; }
    .data-value.missing { border-radius: 4px; border: 1px dashed #fcd34d; background: #fffbeb; padding: 4px 8px; margin-left: -8px; }
    
    .dynamic-form { background: #ffffff; padding: 16px; border: 1px solid #dee2e6; }
    
    .form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
    .field-container label { font-size: 0.875rem; font-weight: 500; margin-bottom: 6px; color: #212529; display: block; }
    .req-mark { color: #dc3545; margin-left: 4px; }
    .error-msg { font-size: 0.75rem; color: #dc3545; margin-top: 4px; display: block; }
    
    kendo-datepicker, kendo-datetimepicker, kendo-dropdownlist, kendo-numerictextbox, kendo-textbox { width: 100%; }
    
    .form-action-bar { display: flex; justify-content: flex-end; gap: 12px; padding-top: 16px; border-top: 1px solid #dee2e6; }
  `]
})
export class DynamicProcessFormComponent implements OnInit, OnChanges {
   @Input() fields: any[] = [];
   @Input() initialDataJson: string | null = null;
   @Input() saving = false;
   @Output() saveData = new EventEmitter<string>();

   mode: 'view' | 'edit' = 'view';
   parsedData: Record<string, any> = {};
   form!: FormGroup;

   completionPercentage = 0;
   missingRequired = 0;

   constructor(private fb: FormBuilder) { }

   ngOnInit() {
      this.parseData();
      if (!this.initialDataJson) this.mode = 'edit';
      this.buildForm();
   }

   ngOnChanges(changes: SimpleChanges) {
      if (changes['fields'] || changes['initialDataJson']) {
         this.parseData();
         this.buildForm();
      }
   }

   parseData() {
      if (this.initialDataJson) {
         try { this.parsedData = JSON.parse(this.initialDataJson); } catch (e) { this.parsedData = {}; }
      } else {
         this.parsedData = {};
      }
      this.calculateCompletion();
   }

   hasValue(key: string): boolean {
      const v = this.parsedData[key];
      return v !== null && v !== undefined && v !== '';
   }

   calculateCompletion() {
      const requiredFields = this.fields.filter(f => f.isRequired && f.isActive);
      if (requiredFields.length === 0) {
         this.completionPercentage = 100;
         this.missingRequired = 0;
         return;
      }

      let completed = 0;
      for (const rf of requiredFields) {
         if (this.hasValue(rf.fieldName)) completed++;
      }
      this.missingRequired = requiredFields.length - completed;
      this.completionPercentage = Math.round((completed / requiredFields.length) * 100);
   }

   buildForm() {
      const group: any = {};
      this.fields.filter(f => f.isActive).forEach(f => {
         const validators = [];
         if (f.isRequired) validators.push(Validators.required);
         if (f.maxLength) validators.push(Validators.maxLength(f.maxLength));
         if (f.minLength) validators.push(Validators.minLength(f.minLength));
         if (f.fieldType === 7) {
            // simple url regex
            validators.push(Validators.pattern(/^(http|https):\/\/.*$/));
         }

         let val = this.parsedData[f.fieldName];

         // Default value provisioning
         if (val === undefined || val === null) {
            if (f.defaultValue) {
               val = f.defaultValue;
               if (f.fieldType === 1 || f.fieldType === 2) val = Number(val);
               if (f.fieldType === 3) val = (val === 'true' || val === '1');
               if (f.fieldType === 4 || f.fieldType === 5) val = new Date(val);
            } else {
               val = null;
               if (f.fieldType === 3) val = false;
            }
         } else {
            // Transform strings back to Date objects for editors
            if ((f.fieldType === 4 || f.fieldType === 5) && typeof val === 'string') {
               val = new Date(val);
            }
         }

         group[f.fieldName] = new FormControl(val, validators);
      });
      this.form = this.fb.group(group);
   }

   getOptions(field: any): string[] {
      if (!field.optionsJson) return [];
      try { return JSON.parse(field.optionsJson); } catch (e) { return []; }
   }

   toggleEdit() {
      this.mode = 'edit';
   }

   cancelEdit() {
      if (!this.initialDataJson) {
         // If we're canceling creation, there's nowhere to go but up in the parent.
         // But we just revert form.
         this.form.reset();
      } else {
         this.mode = 'view';
         this.buildForm(); // revert values
      }
   }

   onSave() {
      if (this.form.invalid) {
         this.form.markAllAsTouched();
         return;
      }
      const raw = { ...this.form.value };

      // Format dates specifically for .NET and MS SQL
      this.fields.forEach(f => {
         const val = raw[f.fieldName];
         if ((f.fieldType === 4 || f.fieldType === 5) && val) {
            const d = new Date(val);
            if (!isNaN(d.getTime())) {
               const y = d.getFullYear();
               const m = String(d.getMonth() + 1).padStart(2, '0');
               const day = String(d.getDate()).padStart(2, '0');
               const h = String(d.getHours()).padStart(2, '0');
               const min = String(d.getMinutes()).padStart(2, '0');
               const s = String(d.getSeconds()).padStart(2, '0');

               if (f.fieldType === 4) {
                  raw[f.fieldName] = `${y}-${m}-${day}`;
               } else {
                  raw[f.fieldName] = `${y}-${m}-${day}T${h}:${min}:${s}`;
               }
            }
         }
      });

      const finalJSON = JSON.stringify(raw);
      this.saveData.emit(finalJSON);
   }
}
