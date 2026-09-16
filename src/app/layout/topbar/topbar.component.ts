import { Component, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';
import { InputsModule } from '@progress/kendo-angular-inputs';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { ServiceItemService } from '../../core/services/service-item.service';
import { ProjectService } from '../../core/services/project.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
   selector: 'app-topbar',
   standalone: true,
   imports: [CommonModule, RouterModule, FormsModule, ButtonModule, IconsModule, InputsModule, DialogsModule],
   template: `
    <header class="topbar"> 
      <div style="display: flex; align-items: center; gap: 16px;">
        <button kendoButton fillMode="flat" icon="menu" (click)="toggleSidebar.emit()"></button>
        <div class="search-container" (click)="openSearch()"> 
           <kendo-icon name="search"></kendo-icon>
           <span class="placeholder">Search projects, items, processes...</span>
           <span class="shortcut">Ctrl+K</span>
        </div> 
      </div>
      <div class="actions"> 
        <button kendoButton title="Notifications" icon="bell" fillMode="flat" rounded="full"></button> 
        <div class="avatar">U</div> 
      </div> 
    </header>

    <kendo-dialog *ngIf="isSearchOpen" [title]="'Global Search'" (close)="closeSearch()" [width]="600">
       <div class="global-search-content">
          <kendo-textbox [(ngModel)]="searchTerm" (ngModelChange)="onSearch()" placeholder="Type to search..." style="width:100%; margin-bottom: 20px;" [autofocus]="true" [clearButton]="true"></kendo-textbox>
          
          <div *ngIf="loading" class="searching-state"><kendo-icon name="loading"></kendo-icon> Searching...</div>
          
          <div *ngIf="!loading && searchTerm && results.length === 0" class="empty-results">
             No results found for "{{searchTerm}}"
          </div>
          
          <div class="results-list" *ngIf="!loading && results.length > 0">
             <div class="result-group" *ngIf="projects.length > 0">
                 <div class="group-title">Projects</div>
                 <a class="result-item" *ngFor="let p of projects" (click)="navigateAndClose('/projects/' + p.id)">
                    <kendo-icon name="folder"></kendo-icon> {{p.name}}
                 </a>
             </div>
             <div class="result-group" *ngIf="items.length > 0">
                 <div class="group-title">Service Items</div>
                 <a class="result-item" *ngFor="let i of items" (click)="navigateAndClose('/service-items/' + i.id)">
                    <kendo-icon name="parameter-header"></kendo-icon> {{i.referenceNumber}} - {{i.title}}
                 </a>
             </div>
          </div>
          <div class="hint" *ngIf="!searchTerm">Search by project names, service item references or titles.</div>
       </div>
    </kendo-dialog>
  `,
   styles: [` 
    .topbar { height: 60px; background: #ffffff; border-bottom: 1px solid #dee2e6; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; } 
    .search-container { display: flex; align-items: center; background: #f8f9fa; padding: 8px 16px; border-radius: 4px; width: 400px; cursor: pointer; border: 1px solid #dee2e6; transition: border-color 0.2s; } 
    .search-container:hover { border-color: #adb5bd; }
    .search-container kendo-icon { color: #6c757d; margin-right: 8px; }
    .search-container .placeholder { flex: 1; font-size: 0.875rem; color: #6c757d; }
    .search-container .shortcut { font-size: 0.75rem; color: #adb5bd; border: 1px solid #dee2e6; padding: 2px 6px; border-radius: 4px; background: #ffffff; }
    .actions { display: flex; align-items: center; gap: 16px; } 
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: #e9ecef; color: #495057; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; cursor: pointer; border: 1px solid #dee2e6; } 
    
    .searching-state, .empty-results, .hint { padding: 24px; text-align: center; color: #6c757d; font-size: 0.875rem; }
    .hint { font-style: italic; }
    
    .results-list { max-height: 400px; overflow-y: auto; }
    .result-group { margin-bottom: 16px; }
    .group-title { font-size: 0.75rem; font-weight: 600; color: #495057; text-transform: uppercase; margin-bottom: 8px; padding-left: 8px; }
    .result-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 4px; text-decoration: none; color: #212529; font-size: 0.875rem; cursor: pointer; transition: background 0.2s; }
    .result-item:hover { background: #f8f9fa; }
    .result-item kendo-icon { color: #6c757d; }
  `]
})
export class TopbarComponent {
   @Output() toggleSidebar = new EventEmitter<void>();
   private router = inject(Router); private projSvc = inject(ProjectService); private itemSvc = inject(ServiceItemService);
   isSearchOpen = false; searchTerm = ''; loading = false;
   projects: any[] = []; items: any[] = []; results: any[] = [];

   openSearch() { this.isSearchOpen = true; this.searchTerm = ''; this.results = []; this.projects = []; this.items = []; }
   closeSearch() { this.isSearchOpen = false; }

   onSearch() {
      if (!this.searchTerm || this.searchTerm.length < 2) { this.results = []; return; }
      this.loading = true;
      const term = this.searchTerm.toLowerCase();
      // Light-weight local cross-search implementation for UI polish
      forkJoin({
         p: this.projSvc.getProjects().pipe(catchError(() => of([]))),
         i: this.itemSvc.getServiceItems().pipe(catchError(() => of([])))
      }).subscribe(data => {
         this.projects = data.p.filter((p: any) => p.name.toLowerCase().includes(term));
         this.items = data.i.filter((i: any) => i.title?.toLowerCase().includes(term) || i.referenceNumber?.toLowerCase().includes(term));
         this.results = [...this.projects, ...this.items];
         this.loading = false; // Fast visual response
      });
   }

   navigateAndClose(url: string) {
      this.router.navigateByUrl(url);
      this.closeSearch();
   }
}
