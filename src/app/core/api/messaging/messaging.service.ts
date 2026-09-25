import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import { Conversation, Message } from './messaging.dto';

/**
 * Servicio que consume el módulo de mensajería directa entre usuarios
 * (RF-061).
 */
@Injectable({ providedIn: 'root' })
export class MessagingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/messages/conversations`;
  private readonly rootUrl = `${environment.apiBaseUrl}/messages`;

  /**
   * Total de mensajes sin leer del usuario autenticado, expuesto de
   * forma reactiva para que los shells muestren el badge del nav en
   * cualquier página.
   */
  readonly unread = signal(0);

  /** Devuelve el total de mensajes sin leer del usuario autenticado. */
  unreadCount(): Observable<{ unread: number }> {
    return this.http.get<{ unread: number }>(`${this.rootUrl}/unread-count`).pipe(
      tap((res) => this.unread.set(res.unread)),
    );
  }

  /**
   * Ajusta el contador local en {@code delta}. Los shells lo llaman
   * cuando el SSE entrega un mensaje entrante o cuando la propia UI
   * marca una conversación como leída, para reflejar el cambio de
   * inmediato sin esperar al siguiente sondeo del backend.
   */
  bumpUnread(delta: number): void {
    this.unread.update((v) => Math.max(0, v + delta));
  }

  /** Fija el contador a un valor conocido. */
  setUnread(value: number): void {
    this.unread.set(Math.max(0, value));
  }

  /** Lista mis conversaciones, más recientes primero. */
  listMine(page = 0, size = 20): Observable<PagedResponse<Conversation>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Conversation>>(this.baseUrl, { params });
  }

  /** Abre (o recupera) una conversación con el usuario indicado. */
  open(recipientId: number): Observable<Conversation> {
    return this.http.post<Conversation>(this.baseUrl, { recipientId });
  }

  /** Lista los mensajes de una conversación, del más reciente al más antiguo. */
  listMessages(
    conversationId: number,
    page = 0,
    size = 30,
  ): Observable<PagedResponse<Message>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Message>>(
      `${this.baseUrl}/${conversationId}/messages`,
      { params },
    );
  }

  /** Envía un mensaje en la conversación indicada. */
  send(conversationId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/${conversationId}/messages`, { content });
  }

  /** Marca todos los mensajes de la conversación como leídos. */
  markAsRead(conversationId: number): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${conversationId}/read`, {});
  }
}
