import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { Notification } from '../../../core/api/notifications/notification.dto';
import { NotificationsService } from '../../../core/api/notifications/notifications.service';

/**
 * Página con el listado completo de notificaciones del estudiante
 * (RF-026).
 */
@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
})
export class NotificationsPageComponent implements OnInit {
  private readonly service = inject(NotificationsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly items = signal<readonly Notification[]>([]);
  protected readonly onlyUnread = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected toggleOnlyUnread(): void {
    this.onlyUnread.update((v) => !v);
    this.load();
  }

  protected markAllAsRead(): void {
    this.service.markAllAsRead().subscribe({
      next: () => this.load(),
    });
  }

  protected markAsRead(item: Notification): void {
    if (item.readAt) return;
    this.service.markAsRead(item.id).subscribe({
      next: () => {
        const nowIso = new Date().toISOString();
        this.items.update((list) =>
          list.map((n) => (n.id === item.id ? { ...n, readAt: nowIso } : n)),
        );
      },
    });
  }

  protected remove(item: Notification, event: Event): void {
    event.stopPropagation();
    this.service.delete(item.id).subscribe({
      next: () => this.items.update((list) => list.filter((n) => n.id !== item.id)),
    });
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list({ onlyUnread: this.onlyUnread(), page: 0, size: 50 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.items.set(page.content),
        error: () =>
          this.error.set(
            'No pudimos cargar tus notificaciones en este momento. Inténtalo nuevamente.',
          ),
      });
  }
}
