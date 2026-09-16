
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ApplicationService } from '../../../core/services/application.service';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputsModule, DialogsModule, PageHeaderComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Applications" subtitle="Manage specific applications within your projects.">
      <button kendoButton themeColor="primary" icon="plus" (click)="openCreate()">New Application</button>
    </app-page-header>
    <app-loading-state *ngIf="loading"></app-loading-state>
    <div class="app-grid" *ngIf="!loading && applications.length > 0">
      <div class="item-card clickable-card" *ngFor="let a of applications" (click)="viewServiceItems(a.id)">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
           <div>
              <h4>{{a.name}}</h4>
              <span class="muted-text">Project ID: {{a.projectId || 'None'}}</span>
           </div>
           <button kendoButton title="Open" fillMode="flat" themeColor="primary">
              <span class="material-icons">visibility</span>
           </button>
        </div>
        <p class="description-text">{{a.description || 'No description provided.'}}</p>
      </div>
    </div>
    <app-empty-state *ngIf="!loading && applications.length === 0" icon="web" title="No applications found" actionLabel="Create Application" (action)="openCreate()"></app-empty-state>

    <!-- Create Dialog -->
    <kendo-dialog *ngIf="showCreate" title="New Application" (close)="closeCreate()" [width]="500">
      <form [formGroup]="createForm" (ngSubmit)="saveCreate()" class="pt-form">
         <div class="form-row">
            <label>Project ID</label>
            <kendo-numerictextbox formControlName="projectId" [spinners]="false" [autoCorrect]="true" [decimals]="0" format="n0"></kendo-numerictextbox>
            <small style="color:#6c757d">Numeric ID of the parent project.</small>
         </div>
         <div class="form-row">
            <label>Application Name</label>
            <kendo-textbox formControlName="name"></kendo-textbox>
         </div>
         <div class="form-row">
            <label>Description</label>
            <textarea kendoTextArea formControlName="description"></textarea>
         </div>
      </form>
      <kendo-dialog-actions>
         <button kendoButton (click)="closeCreate()" [disabled]="saving">Cancel</button>
         <button kendoButton themeColor="primary" (click)="saveCreate()" [disabled]="createForm.invalid || saving">Create</button>
      </kendo-dialog-actions>
    </kendo-dialog>
  `,
  styles: [`
    .app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .item-card { border: 1px solid #dee2e6; padding: 20px; border-radius: 4px; background: #ffffff; }
    .clickable-card { cursor: pointer; }
    .clickable-card:hover { background: #f8f9fa; }
    .description-text { margin-top: 16px; color: #6c757d; font-size: 0.875rem; margin-bottom: 0;}
  `]
})
export class ApplicationListComponent implements OnInit {
  private appService = inject(ApplicationService); private route = inject(ActivatedRoute); private router = inject(Router);
  private fb = inject(FormBuilder); private ns = inject(NotificationService);

  applications: any[] = []; loading = true;
  showCreate = false; saving = false; createForm!: FormGroup;

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading = true;
    this.route.queryParams.subscribe(p => {
      this.appService.getApplications(p['projectId'] || undefined).subscribe(d => {
        this.applications = d; this.loading = false;
      });
    });
  }

  viewServiceItems(appId: string) {
    this.router.navigate(['/service-items'], { queryParams: { applicationId: appId } });
  }

  openCreate() {
    this.createForm = this.fb.group({
      projectId: [null, [Validators.required, Validators.min(1)]],
      name: ['', Validators.required],
      description: ['']
    });
    // Pre-select project if already filtered
    const projectIdParam = this.route.snapshot.queryParamMap.get('projectId');
    if (projectIdParam) {
      this.createForm.patchValue({ projectId: Number(projectIdParam) });
    }
    this.showCreate = true;
  }

  closeCreate() { this.showCreate = false; }

  saveCreate() {
    if (this.createForm.invalid) return;
    this.saving = true;
    const payload = this.createForm.value;

    this.appService.createApplication(payload).subscribe({
      next: () => {
        this.ns.success('Application created securely!');
        this.saving = false;
        this.showCreate = false;
        this.loadApplications();
      },
      error: () => {
        this.ns.error('Failed to create application.');
        this.saving = false;
      }
    });
  }
}
