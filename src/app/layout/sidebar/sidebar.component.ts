
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconsModule } from '@progress/kendo-angular-icons';
import { ButtonModule } from '@progress/kendo-angular-buttons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconsModule, ButtonModule],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed">
      <div class="branding">
         <div class="logo"></div>
         <span class="brand-name">ProcessTracker</span>
      </div>
      <nav class="nav-menu">
        <div class="nav-section">MAIN</div>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" title="Home"><span class="material-icons">home</span> <span class="nav-link-text">Home</span></a>
        <a routerLink="/projects" routerLinkActive="active" class="nav-link" title="Projects"><span class="material-icons">folder</span> <span class="nav-link-text">Projects</span></a>
        <a routerLink="/applications" routerLinkActive="active" class="nav-link" title="Applications"><span class="material-icons">web</span> <span class="nav-link-text">Applications</span></a>
        <a routerLink="/service-items" routerLinkActive="active" class="nav-link" title="Service Items"><span class="material-icons">description</span> <span class="nav-link-text">Service Items</span></a>
        <a routerLink="/processes" routerLinkActive="active" class="nav-link" title="Processes"><span class="material-icons">settings</span> <span class="nav-link-text">Processes</span></a>

        <div class="nav-section">PERSONAL</div>
        <a routerLink="/my-work" routerLinkActive="active" class="nav-link" title="My Work"><span class="material-icons">person</span> <span class="nav-link-text">My Work</span></a>
        <a routerLink="/recently-viewed" routerLinkActive="active" class="nav-link" title="Recently Viewed"><span class="material-icons">history</span> <span class="nav-link-text">Recently Viewed</span></a>
      </nav>
      <div class="spacer"></div>
      <div class="sidebar-footer">
         <button kendoButton fillMode="flat" (click)="toggleCollapse()" style="width: 100%; border-radius: 0; padding: 16px; color: #6c757d; justify-content: center;">
            <span class="material-icons">{{ collapsed ? 'chevron_right' : 'chevron_left' }}</span>
         </button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar { width: 260px; height: 100%; background: #ffffff; border-right: 1px solid #dee2e6; display: flex; flex-direction: column; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; white-space: nowrap; }
    .sidebar.collapsed { width: 70px; }
    .sidebar.collapsed .brand-name, .sidebar.collapsed .nav-section, .sidebar.collapsed .nav-link-text { display: none; }
    .sidebar.collapsed .branding { justify-content: center; padding: 0; }
    .sidebar.collapsed .nav-link { justify-content: center; padding: 12px; }
    .sidebar.collapsed .material-icons { margin: 0; font-size: 1.25rem; display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; }
    
    .branding { height: 60px; min-height: 60px; display: flex; align-items: center; padding: 0 24px; border-bottom: 1px solid #dee2e6; gap: 12px; }
    .logo { width: 24px; height: 24px; min-width: 24px; background: #3b82f6; border-radius: 4px; }
    .brand-name { color: #333333; font-weight: 600; font-size: 1.1rem; }
    .nav-menu { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 4px; }
    .nav-section { font-size: 0.75rem; font-weight: 600; color: #6c757d; margin: 16px 0 8px 12px; text-transform: uppercase; }
    .nav-link { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 4px; color: #495057; text-decoration: none; font-size: 0.875rem; transition: background 0.2s; }
    .nav-link .material-icons { font-size: 1.125rem; color: #6c757d; }
    .nav-link:hover { background: #f8f9fa; color: #212529; }
    .nav-link.active { background: #e9ecef; color: #000000; font-weight: 600; }
    .spacer { flex: 1; }
  `]
})
export class SidebarComponent {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  toggleCollapse() {
    this.toggle.emit();
  }
}
