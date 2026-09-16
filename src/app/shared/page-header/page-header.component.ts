import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-page-header', standalone: true, imports: [CommonModule], template: `
<div class="page-header">
  <div class="header-content">
    <h1 class="header-title">{{title}}</h1>
    <p *ngIf="subtitle" class="header-subtitle">{{subtitle}}</p>
  </div>
  <div class="header-actions">
    <ng-content></ng-content>
  </div>
</div>
`, styles: [`
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #dee2e6; }
.header-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: #212529; }
.header-subtitle { margin: 4px 0 0; font-size: 0.875rem; color: #6c757d; }
`]
}) export class PageHeaderComponent { @Input() title!: string; @Input() subtitle?: string; }