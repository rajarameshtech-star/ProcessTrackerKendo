import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NotificationService, ToastMessage } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="toast-container">
       <div *ngFor="let t of toasts; let i = index" 
            [@toastAnimation]
            class="toast-card" 
            [ngClass]="t.type">
          <span class="material-icons toast-icon">
            {{ t.type === 'success' ? 'check_circle' : 'error' }}
          </span>
          <div class="toast-message">{{ t.message }}</div>
          <span class="material-icons toast-close" (click)="removeToast(i)">close</span>
       </div>
    </div>
  `,
    styles: [`
    .toast-container {
       position: fixed;
       bottom: 24px;
       right: 24px;
       z-index: 10000;
       display: flex;
       flex-direction: column;
       gap: 12px;
       pointer-events: none;
    }
    .toast-card {
       pointer-events: auto;
       display: flex;
       align-items: center;
       background: #ffffff;
       border-radius: 8px;
       padding: 12px 16px;
       box-shadow: 0 4px 12px rgba(0,0,0,0.15);
       min-width: 300px;
       max-width: 450px;
       border-left: 4px solid #dee2e6;
    }
    .toast-card.success { border-left-color: #10b981; }
    .toast-card.error { border-left-color: #ef4444; }
    
    .toast-icon { margin-right: 12px; font-size: 1.5rem; }
    .toast-card.success .toast-icon { color: #10b981; }
    .toast-card.error .toast-icon { color: #ef4444; }
    
    .toast-message {
       flex: 1;
       font-size: 0.9rem;
       color: #333333;
       font-weight: 500;
    }
    .toast-close {
       font-size: 1.1rem;
       color: #adb5bd;
       cursor: pointer;
       margin-left: 12px;
       transition: color 0.2s;
    }
    .toast-close:hover { color: #495057; }
  `],
    animations: [
        trigger('toastAnimation', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate('0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
            ]),
            transition(':leave', [
                animate('0.2s ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
            ])
        ])
    ]
})
export class ToastComponent implements OnInit, OnDestroy {
    toasts: ToastMessage[] = [];
    private sub?: Subscription;
    private ns = inject(NotificationService);

    ngOnInit() {
        this.sub = this.ns.toast$.subscribe(toast => {
            this.toasts.push(toast);
            setTimeout(() => this.removeToast(0), 4000);
        });
    }

    removeToast(index: number) {
        if (index > -1 && index < this.toasts.length) {
            this.toasts.splice(index, 1);
        }
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
}
