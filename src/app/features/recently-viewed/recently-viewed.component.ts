
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { RecentlyViewedService, RecentItem } from '../../core/services/recently-viewed.service';
import { IconsModule } from '@progress/kendo-angular-icons';

@Component({
  selector: 'app-recently-viewed',
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, EmptyStateComponent, IconsModule, DatePipe],
  template: `
    <app-page-header title="Recently Viewed" subtitle="Quickly access items you've checked recently."></app-page-header>
    
    <div class="recent-list" *ngIf="items.length > 0">
       <a *ngFor="let item of items" [routerLink]="item.url" class="recent-row">
          <span class="material-icons item-icon">{{getIcon(item.type)}}</span>
          <div class="item-content">
             <div class="item-title">{{item.title}}</div>
             <div class="item-meta">{{item.type}} • {{item.timestamp | date:'medium'}}</div>
          </div>
          <span class="material-icons arrow">chevron_right</span>
       </a>
    </div>

    <app-empty-state *ngIf="items.length === 0" icon="clock" title="No recent history" description="Items you view will automatically appear here."></app-empty-state>
  `,
  styles: [`
    .recent-list { display: flex; flex-direction: column; gap: 8px; margin-top: 24px; max-width: 800px; }
    .recent-row { display: flex; align-items: center; padding: 16px; background: #ffffff; border: 1px solid #dee2e6; border-radius: 4px; text-decoration: none; color: inherit; transition: all 0.15s; }
    .recent-row:hover { background: #f8f9fa; border-color: #adb5bd; }
    .item-icon { font-size: 24px; color: #6c757d; margin-right: 16px; margin-left: 8px; }
    .item-content { flex: 1; }
    .item-title { font-weight: 600; color: #212529; margin-bottom: 4px; font-size: 0.95rem; }
    .item-meta { font-size: 0.75rem; color: #6c757d; }
    .arrow { color: #cbd5e1; font-size: 18px; }
  `]
})
export class RecentlyViewedComponent implements OnInit {
  rvSvc = inject(RecentlyViewedService);
  items: RecentItem[] = [];
  ngOnInit() { this.items = this.rvSvc.get(); }
  getIcon(type: string) {
    if (type === 'Project') return 'folder';
    if (type === 'Application') return 'web';
    if (type === 'Process') return 'settings';
    return 'description';
  }
}
