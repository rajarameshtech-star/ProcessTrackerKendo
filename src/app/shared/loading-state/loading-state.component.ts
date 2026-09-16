import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IndicatorsModule } from '@progress/kendo-angular-indicators';
@Component({
  selector: 'app-loading-state', standalone: true, imports: [IndicatorsModule, CommonModule], template: `
<div class="loading-state">
  <kendo-loader type="converging-spinner" size="large"></kendo-loader>
  <p *ngIf="message" class="loading-message">{{message}}</p>
</div>
`, styles: [`
.loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; }
.loading-message { margin-top: 16px; color: #6c757d; font-size: 0.875rem; }
`]
}) export class LoadingStateComponent { @Input() message = 'Loading...'; }