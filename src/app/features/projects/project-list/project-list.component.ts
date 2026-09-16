import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { IconsModule } from '@progress/kendo-angular-icons';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../shared/page-header/page-header.component';
import { LoadingStateComponent } from '../../../shared/loading-state/loading-state.component';
import { EmptyStateComponent } from '../../../shared/empty-state/empty-state.component';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputsModule, IconsModule, DialogsModule, RouterModule, PageHeaderComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <app-page-header title="Projects" subtitle="Organize process tracking by project.">
      <button kendoButton themeColor="primary" icon="plus" (click)="openCreate()">New Project</button>
    </app-page-header>
    
    <div class="toolbar" *ngIf="projects.length > 0">
      <kendo-textbox placeholder="Search projects..."> <ng-template kendoTextBoxPrefixTemplate><kendo-icon name="search"></kendo-icon></ng-template> </kendo-textbox>
    </div>

    <app-loading-state *ngIf="loading"></app-loading-state>
    <div class="project-grid" *ngIf="!loading && !error && projects.length > 0">
      <div class="item-card" *ngFor="let p of projects" [routerLink]="['/projects', p.id]">
        <div class="card-header"><div class="card-avatar"><kendo-icon name="folder"></kendo-icon></div>
        <div><h4>{{p.name}}</h4><span class="muted-text">ID: {{p.id}}</span></div></div>
        <p class="description-text">{{p.description || 'No description provided.'}}</p>
      </div>
    </div>
    <app-empty-state *ngIf="!loading && !error && projects.length === 0" icon="folder" title="No projects yet" actionLabel="Create Project" (action)="openCreate()"></app-empty-state>

    <!-- Create Dialog -->
    <kendo-dialog *ngIf="showCreate" title="New Project" (close)="closeCreate()" [width]="500">
      <form [formGroup]="createForm" (ngSubmit)="saveCreate()" class="pt-form">
         <div class="form-row">
            <label>Project Name</label>
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
    .toolbar { display: flex; margin-bottom: 24px; width: 300px; }
    .project-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
    .item-card { background: #ffffff; border: 1px solid #dee2e6; padding: 20px; cursor: pointer; }
    .item-card:hover { background: #f8f9fa; }
    .card-header { display: flex; align-items: center; margin-bottom: 12px; }
    .card-header h4 { margin: 0 0 4px; color: #212529; }
    .card-avatar { background: #e9ecef; color: #495057; width: 40px; height: 40px; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 1.25rem; }
    .description-text { color: #6c757d; font-size: 0.875rem; margin: 0; }
  `]
})
export class ProjectListComponent implements OnInit {
  private projectService = inject(ProjectService);
  private fb = inject(FormBuilder);
  private ns = inject(NotificationService);
  private router = inject(Router);

  projects: Project[] = []; loading = true; error = false;
  showCreate = false; saving = false; createForm!: FormGroup;

  ngOnInit() { this.loadProjects(); }

  loadProjects() {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (v) => { this.projects = v; this.loading = false; },
      error: () => { this.error = true; this.loading = false; }
    });
  }

  openCreate() {
    this.createForm = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
    this.showCreate = true;
  }

  closeCreate() { this.showCreate = false; }

  saveCreate() {
    if (this.createForm.invalid) return;
    this.saving = true;
    this.projectService.createProject(this.createForm.value).subscribe({
      next: (project) => {
        this.ns.success('Project created successfully!');
        this.saving = false;
        this.showCreate = false;
        this.loadProjects();
      },
      error: () => {
        this.ns.error('Failed to create project.');
        this.saving = false;
      }
    });
  }
}
