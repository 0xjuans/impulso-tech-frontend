import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { Notification, NotificationType } from '../../../core/api/notifications/notification.dto';
import { NotificationsService } from '../../../core/api/notifications/notifications.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { EnumLabelPipe } from '../../../shared/pipes/enum-label.pipe';

/**
 * Página con el listado completo de notificaciones del estudiante
 * (RF-026).
 */
@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [DatePipe, AppIconComponent, EnumLabelPipe],
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

  private readonly typeLabels: Record<NotificationType, string> = {
    BADGE_AWARDED: 'Insignia obtenida',
    LEVEL_UP: 'Subida de nivel',
    COURSE_COMPLETED: 'Curso completado',
    EVALUATION_PASSED: 'Evaluación aprobada',
    EVALUATION_FAILED: 'Evaluación reprobada',
    STREAK_MILESTONE: 'Racha alcanzada',
    GENERIC: 'General',
  };

  protected typeLabel(t: NotificationType): string {
    return this.typeLabels[t] ?? t;
  }

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
