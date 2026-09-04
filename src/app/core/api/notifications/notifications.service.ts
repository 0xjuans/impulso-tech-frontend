import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import { Notification, UnreadCount } from './notification.dto';

/**
 * Servicio que consume el centro de notificaciones del estudiante
 * (RF-026).
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users/me/notifications`;

  /** Lista mis notificaciones, con filtro opcional a sólo no leídas. */
  list(options: { onlyUnread?: boolean; page?: number; size?: number } = {}): Observable<
    PagedResponse<Notification>
  > {
    const params = new HttpParams()
      .set('onlyUnread', String(options.onlyUnread ?? false))
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    return this.http.get<PagedResponse<Notification>>(this.baseUrl, { params });
  }

  /** Devuelve la cantidad de notificaciones sin leer. */
  unreadCount(): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(`${this.baseUrl}/unread-count`);
  }

  /** Marca una notificación específica como leída. */
  markAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/read`, {});
  }

  /** Marca todas las notificaciones no leídas como leídas. */
  markAllAsRead(): Observable<UnreadCount> {
    return this.http.patch<UnreadCount>(`${this.baseUrl}/read-all`, {});
  }

  /** Elimina una notificación. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
