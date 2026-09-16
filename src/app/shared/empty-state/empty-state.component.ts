import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from '@progress/kendo-angular-buttons';
import { IconsModule } from '@progress/kendo-angular-icons';
@Component({
  selector: 'app-empty-state', standalone: true, imports: [CommonModule, ButtonModule, IconsModule], template: `
<div class="empty-state">
  <kendo-icon [name]="icon" size="xlarge" class="empty-state-icon"></kendo-icon>
  <h3 class="empty-state-title">{{title}}</h3>
  <p class="empty-state-description">{{description}}</p>
  <button *ngIf="actionLabel" kendoButton themeColor="primary" (click)="action.emit()">{{actionLabel}}</button>
</div>
`, styles: [`
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; border: 1px dashed #dee2e6; border-radius: 4px; background: #f8f9fa; }
.empty-state-icon { margin-bottom: 16px; color: #adb5bd; }
.empty-state-title { font-weight: 600; margin: 0 0 8px; font-size: 1.125rem; color: #212529; }
.empty-state-description { color: #6c757d; margin: 0 0 24px; max-width: 400px; }
`]
}) export class EmptyStateComponent { @Input() icon = 'inbox'; @Input() title = 'No data'; @Input() description = ''; @Input() actionLabel = ''; @Output() action = new EventEmitter<void>(); }