import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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
