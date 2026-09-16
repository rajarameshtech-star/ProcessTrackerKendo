import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-shell', standalone: true, imports: [RouterModule, SidebarComponent, TopbarComponent, CommonModule], template: `
<div class="app-layout">
  <div class="sidebar-desktop">
    <app-sidebar [collapsed]="sidebarCollapsed" (toggle)="toggleSidebar()"></app-sidebar>
  </div>
  <div class="main-container">
    <app-topbar (toggleSidebar)="toggleSidebar()"></app-topbar>
    <main class="content-area">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
`, styles: [`
.app-layout { display: flex; height: 100vh; overflow: hidden; background: #fafafa; }
.sidebar-desktop { flex-shrink: 0; z-index: 2; border-right: 1px solid #dee2e6; background: #ffffff; }
.main-container { display: flex; flex-direction: column; flex: 1; min-width: 0; background: #ffffff; }
.content-area { flex: 1; overflow-y: auto; padding: 24px; }
`]
}) export class AppShellComponent { sidebarCollapsed = false; toggleSidebar() { this.sidebarCollapsed = !this.sidebarCollapsed; } }