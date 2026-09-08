import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap } from 'rxjs';
import { startWith } from 'rxjs/operators';

import { Notification } from '../../../core/api/notifications/notification.dto';
import { NotificationsService } from '../../../core/api/notifications/notifications.service';

/**
 * Campana de notificaciones para el shell del estudiante (RF-026).
 *
 * Consulta periódicamente el conteo de no leídas y, al abrirse, muestra
 * un panel con las notificaciones más recientes. Los estados de carga,
 * vacío y error se manejan de forma explícita.
 */
@Component({
  selector: 'app-notifications-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  templateUrl: './notifications-bell.component.html',
  styleUrl: './notifications-bell.component.scss',
})
export class NotificationsBellComponent implements OnInit {
  private readonly service = inject(NotificationsService);
  private readonly destroyRef = inject(DestroyRef);

  /** Intervalo de polling en milisegundos (60 segundos). */
  private static readonly POLL_INTERVAL_MS = 60_000;

  /** Cantidad de notificaciones no leídas del usuario autenticado. */
  protected readonly unread = signal(0);

  /** Estado de apertura del panel desplegable. */
  protected readonly open = signal(false);

  /** Estado de carga del panel al abrirse. */
  protected readonly loading = signal(false);

  /** Últimas notificaciones cargadas al abrir la campana. */
  protected readonly recent = signal<readonly Notification[]>([]);

  ngOnInit(): void {
    interval(NotificationsBellComponent.POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.service.unreadCount()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (r) => this.unread.set(r.unread),
        error: () => this.unread.set(0),
      });
  }

  protected toggle(event?: Event): void {
    event?.stopPropagation();
    const next = !this.open();
    this.open.set(next);
    if (next) {
      this.load();
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Marca la notificación como leída y actualiza el contador local. */
  protected markAsRead(item: Notification, event: Event): void {
    event.stopPropagation();
    if (item.readAt) {
      return;
    }
    this.service.markAsRead(item.id).subscribe({
      next: () => {
        const nowIso = new Date().toISOString();
        this.recent.update((items) =>
          items.map((n) => (n.id === item.id ? { ...n, readAt: nowIso } : n)),
        );
        this.unread.update((count) => Math.max(0, count - 1));
      },
    });
  }

  /** Marca todas como leídas y refresca el estado. */
  protected markAllAsRead(event: Event): void {
    event.stopPropagation();
    this.service.markAllAsRead().subscribe({
      next: () => {
        this.unread.set(0);
        const nowIso = new Date().toISOString();
        this.recent.update((items) => items.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })));
      },
    });
  }

  /** Cierra el panel cuando el usuario presiona escape o clic afuera. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.open()) {
      this.close();
    }
  }

  /** Evita que los clics dentro del panel lo cierren. */
  protected stop(event: Event): void {
    event.stopPropagation();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list({ page: 0, size: 8 }).subscribe({
      next: (page) => {
        this.recent.set(page.content);
        this.loading.set(false);
      },
      error: () => {
        this.recent.set([]);
        this.loading.set(false);
      },
    });
  }
}
