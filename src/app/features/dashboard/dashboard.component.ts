
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { StatusChipComponent } from '../../shared/status-chip/status-chip.component';
import { PriorityChipComponent } from '../../shared/priority-chip/priority-chip.component';
import { LoadingStateComponent } from '../../shared/loading-state/loading-state.component';
import { ProjectService } from '../../core/services/project.service';
import { ApplicationService } from '../../core/services/application.service';
import { ServiceItemService } from '../../core/services/service-item.service';
import { ProcessDefinitionService } from '../../core/services/process-definition.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IconsModule } from '@progress/kendo-angular-icons';

@Component({
   selector: 'app-dashboard',
   standalone: true,
   imports: [CommonModule, RouterModule, PageHeaderComponent, StatusChipComponent, PriorityChipComponent, LoadingStateComponent, IconsModule],
   template: `
    <app-page-header title="Process Tracking" subtitle="Operational overview of your projects and work."></app-page-header> 
    
    <app-loading-state *ngIf="loading"></app-loading-state>

    <div *ngIf="!loading">
       <div class="kpi-grid">
         <div class="kpi-card" routerLink="/projects"><div class="val">{{counts.projects}}</div><div class="kpi-label">Projects</div></div>
         <div class="kpi-card" routerLink="/applications"><div class="val">{{counts.apps}}</div><div class="kpi-label">Applications</div></div>
         <div class="kpi-card" routerLink="/service-items"><div class="val">{{counts.items}}</div><div class="kpi-label">Service Items</div></div>
         <div class="kpi-card" routerLink="/processes"><div class="val">{{counts.processes}}</div><div class="kpi-label">Processes</div></div>
       </div>

       <div class="charts-row">
          <div class="snapshot-card">
             <h3>Work Snapshot</h3>
             <div class="stat-list">
                <div class="stat-item" *ngFor="let s of statusGroups">
                   <div class="stat-name"><div class="status-dot" [attr.data-status]="s.name"></div>{{s.name}}</div>
                   <div class="stat-val">{{s.count}}</div>
                </div>
                <div class="muted-text" *ngIf="statusGroups.length === 0" style="font-size: 0.8rem; margin-top:16px;">No items defined yet.</div>
             </div>
          </div>
          
           <div class="snapshot-card">
             <h3>Priority Snapshot</h3>
             <div class="stat-list">
                <div class="stat-item" *ngFor="let p of priorityGroups">
                   <div class="stat-name">
                     <span class="material-icons" style="margin-right:8px; font-size:16px; opacity:0.7;">{{ p.name === 'Critical' ? 'warning' : 'expand_less' }}</span>
                     {{p.name}}
                   </div>
                   <div class="stat-val">{{p.count}}</div>
                </div>
                <div class="muted-text" *ngIf="priorityGroups.length === 0" style="font-size: 0.8rem; margin-top:16px;">No items defined yet.</div>
             </div>
          </div>
       </div>

       <h2 style="font-size: 1.1rem; margin: 32px 0 16px;">Recent Service Items</h2>
       <div class="recent-grid" *ngIf="recentItems.length > 0">
          <a class="recent-card" *ngFor="let i of recentItems" [routerLink]="['/service-items', i.id]">
             <div class="rc-header">
                <span class="ref">{{i.referenceNumber}}</span>
                <span class="rc-date">{{i.createdAt | date:'shortDate'}}</span>
             </div>
             <h4>{{i.title}}</h4>
             <div class="rc-badges">
                <app-status-chip [status]="i.status"></app-status-chip>
                <app-priority-chip [priority]="i.priority"></app-priority-chip>
             </div>
          </a>
       </div>
       <div class="muted-text" *ngIf="!loading && recentItems.length === 0">No recent activity detected.</div>
    </div>
  `,
   styles: [` 
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .kpi-card { background: #ffffff; padding: 16px; border: 1px solid #dee2e6; display: flex; flex-direction: column; cursor: pointer; }
    .kpi-card:hover { background: #f8f9fa; }
    .val { font-size: 1.5rem; font-weight: 600; color: #212529; margin-bottom: 4px; line-height: 1; }
    .kpi-label { font-size: 0.875rem; color: #6c757d; font-weight: 500; text-transform: uppercase; }
    
    .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
    .snapshot-card { background: #ffffff; padding: 16px; border: 1px solid #dee2e6; }
    .snapshot-card h3 { margin: 0 0 16px 0; font-size: 1rem; color: #212529; font-weight: 600; }
    
    .stat-list { display: flex; flex-direction: column; gap: 8px; }
    .stat-item { display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #e9ecef; }
    .stat-name { font-size: 0.875rem; color: #495057; display: flex; align-items: center; }
    .status-dot { width: 8px; height: 8px; background: #6c757d; margin-right: 12px; }
    .status-dot[data-status="In Progress"] { background: #0d6efd; }
    .status-dot[data-status="New"] { background: #198754; }
    .status-dot[data-status="Completed"] { background: #6f42c1; }
    .status-dot[data-status="Blocked"] { background: #dc3545; }
    .stat-val { font-weight: 600; font-size: 1rem; color: #212529; }
    
    .recent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .recent-card { text-decoration: none; display: flex; flex-direction: column; background: #ffffff; padding: 16px; border: 1px solid #dee2e6; color: inherit; }
    .recent-card:hover { background: #f8f9fa; }
    .rc-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .ref { font-family: monospace; font-size: 0.75rem; color: #6c757d; }
    .rc-date { font-size: 0.75rem; color: #6c757d; }
    .recent-card h4 { margin: 0 0 12px 0; font-size: 0.95rem; font-weight: 600; line-height: 1.4; color: #212529; }
    .rc-badges { display: flex; gap: 8px; }
  `]
})
export class DashboardComponent implements OnInit {
   private projSvc = inject(ProjectService); private appSvc = inject(ApplicationService); private itemSvc = inject(ServiceItemService); private procSvc = inject(ProcessDefinitionService);
   loading = true;
   counts = { projects: 0, apps: 0, items: 0, processes: 0 };
   statusGroups: any[] = []; priorityGroups: any[] = [];
   recentItems: any[] = [];

   ngOnInit() {
      forkJoin({
         p: this.projSvc.getProjects().pipe(catchError(() => of([]))),
         a: this.appSvc.getApplications().pipe(catchError(() => of([]))),
         i: this.itemSvc.getServiceItems().pipe(catchError(() => of([]))),
         pr: this.procSvc.getProcessDefinitions().pipe(catchError(() => of([])))
      }).subscribe(data => {
         this.counts.projects = data.p.length;
         this.counts.apps = data.a.length;
         this.counts.items = data.i.length;
         this.counts.processes = data.pr.length;

         // Group status
         const sMap = new Map();
         const pMap = new Map();
         data.i.forEach((x: any) => {
            const s = x.status || 'Unknown';
            sMap.set(s, (sMap.get(s) || 0) + 1);

            const p = x.priority || 'Medium';
            pMap.set(p, (pMap.get(p) || 0) + 1);
         });

         this.statusGroups = Array.from(sMap, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
         this.priorityGroups = Array.from(pMap, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

         this.recentItems = data.i.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 6);

         this.loading = false;
      });
   }
}
