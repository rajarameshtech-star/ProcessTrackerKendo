
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-process-field-value',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
     <ng-container [ngSwitch]="fieldType">
        <!-- Text / Number / Decimal -->
        <span *ngSwitchCase="0" class="val-text">{{value || '-'}}</span>
        <span *ngSwitchCase="1" class="val-number">{{value != null ? value : '-'}}</span>
        <span *ngSwitchCase="2" class="val-decimal">{{value != null ? (value | number:'1.2-2') : '-'}}</span>
        
        <!-- Boolean -->
        <span *ngSwitchCase="3" class="bool-indicator" [class.yes]="value">
          <svg *ngIf="value" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {{value ? 'Yes' : 'No'}}
        </span>
        
        <!-- Date -->
        <span *ngSwitchCase="4" class="val-date">{{ (value | date:'mediumDate') || '-' }}</span>
        
        <!-- DateTime -->
        <span *ngSwitchCase="5" class="val-datetime">{{ (value | date:'medium') || '-' }}</span>
        
        <!-- Select -->
        <span *ngSwitchCase="6" class="val-select">{{value || '-'}}</span>
        
        <!-- Url -->
        <a *ngSwitchCase="7" [href]="value" target="_blank" rel="noopener noreferrer" class="val-url" (click)="$event.stopPropagation()">{{value || '-'}}</a>
        
        <span *ngSwitchDefault>{{value || '-'}}</span>
     </ng-container>
  `,
  styles: [`
    .bool-indicator { display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; background: #fee2e2; color: #991b1b; }
    .bool-indicator.yes { background: #dcfce7; color: #166534; }
    .val-url { color: #0058e9; text-decoration: underline; text-underline-offset: 4px; }
    .val-text { white-space: pre-wrap; word-break: break-word; }
  `]
})
export class ProcessFieldValueComponent implements OnInit {
  @Input() value: any;
  @Input() fieldType!: number;
  ngOnInit() { }
}
