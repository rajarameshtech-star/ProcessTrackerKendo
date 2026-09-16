
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconsModule } from '@progress/kendo-angular-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconsModule],
  template: `
    <div class="sidebar" [class.collapsed]="collapsed">
      <div class="branding">
         <div class="logo"></div>
         <span class="brand-name">ProcessTracker</span>
      </div>
      <nav class="nav-menu">
        <div class="nav-section">MAIN</div>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link" title="Home"><kendo-icon name="home"></kendo-icon> <span class="nav-link-text">Home</span></a>
        <a routerLink="/projects" routerLinkActive="active" class="nav-link" title="Projects"><kendo-icon name="folder"></kendo-icon> <span class="nav-link-text">Projects</span></a>
        <a routerLink="/applications" routerLinkActive="active" class="nav-link" title="Applications"><kendo-icon name="grid-layout"></kendo-icon> <span class="nav-link-text">Applications</span></a>
        <a routerLink="/service-items" routerLinkActive="active" class="nav-link" title="Service Items"><kendo-icon name="parameter-header"></kendo-icon> <span class="nav-link-text">Service Items</span></a>
        <a routerLink="/processes" routerLinkActive="active" class="nav-link" title="Processes"><kendo-icon name="gear"></kendo-icon> <span class="nav-link-text">Processes</span></a>

        <div class="nav-section">PERSONAL</div>
        <a routerLink="/my-work" routerLinkActive="active" class="nav-link" title="My Work"><kendo-icon name="user"></kendo-icon> <span class="nav-link-text">My Work</span></a>
        <a routerLink="/recently-viewed" routerLinkActive="active" class="nav-link" title="Recently Viewed"><kendo-icon name="clock"></kendo-icon> <span class="nav-link-text">Recently Viewed</span></a>
      </nav>
      <div class="spacer"></div>
    </div>
  `,
  styles: [`
    .sidebar { width: 260px; height: 100%; background: #ffffff; border-right: 1px solid #dee2e6; color: #333333; display: flex; flex-direction: column; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; white-space: nowrap; }
    .sidebar.collapsed { width: 70px; }
    .sidebar.collapsed .brand-name, .sidebar.collapsed .nav-section, .sidebar.collapsed .nav-link-text { display: none; }
    .sidebar.collapsed .branding { justify-content: center; padding: 0; }
    .sidebar.collapsed .nav-link { justify-content: center; padding: 12px; }
    .sidebar.collapsed kendo-icon { margin: 0; font-size: 1.25rem; }
    
    .branding { height: 60px; min-height: 60px; display: flex; align-items: center; padding: 0 24px; border-bottom: 1px solid #dee2e6; gap: 12px; }
    .logo { width: 24px; height: 24px; min-width: 24px; background: #3b82f6; border-radius: 4px; }
    .brand-name { color: #333333; font-weight: 600; font-size: 1.1rem; }
    .nav-menu { padding: 16px 16px 0; display: flex; flex-direction: column; gap: 4px; }
    .nav-section { font-size: 0.75rem; font-weight: 600; color: #6c757d; margin: 16px 0 8px 12px; text-transform: uppercase; }
    .nav-link { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 4px; color: #495057; text-decoration: none; font-size: 0.875rem; transition: background 0.2s; }
    .nav-link kendo-icon { font-size: 1.125rem; color: #6c757d; }
    .nav-link:hover { background: #f8f9fa; color: #212529; }
    .nav-link.active { background: #e9ecef; color: #000000; font-weight: 600; }
    .spacer { flex: 1; }
  `]
})
export class SidebarComponent { @Input() collapsed = false; }
