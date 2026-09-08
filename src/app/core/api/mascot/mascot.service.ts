import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import {
  AiContextType,
  MascotConversation,
  MascotMessage,
} from './mascot.dto';

/**
 * Servicio que consume los endpoints de la mascota IA (RF-017, RF-051).
 *
 * El frontend jamás se comunica directamente con el proveedor de IA;
 * toda la interacción se realiza contra el backend, que aplica las
 * reglas de seguridad y los límites anti-abuso.
 */
@Injectable({ providedIn: 'root' })
export class MascotService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/ai/mascot/conversations`;

  /** Crea una nueva conversación con el contexto opcional indicado. */
  start(request: {
    title?: string;
    contextType?: AiContextType;
    contextId?: number;
  }): Observable<MascotConversation> {
    return this.http.post<MascotConversation>(this.baseUrl, {
      title: request.title ?? null,
      contextType: request.contextType ?? null,
      contextId: request.contextId ?? null,
    });
  }

  /** Devuelve mis conversaciones, más recientes primero. */
  listMine(page = 0, size = 20): Observable<PagedResponse<MascotConversation>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<MascotConversation>>(this.baseUrl, { params });
  }

  /** Devuelve el detalle de una conversación con todos sus mensajes. */
  get(conversationId: number): Observable<MascotConversation> {
    return this.http.get<MascotConversation>(`${this.baseUrl}/${conversationId}`);
  }

  /** Envía un mensaje y devuelve la respuesta generada por la mascota. */
  sendMessage(conversationId: number, message: string): Observable<MascotMessage> {
    return this.http.post<MascotMessage>(`${this.baseUrl}/${conversationId}/messages`, {
      message,
    });
  }

  /** Cierra una conversación existente. */
  close(conversationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${conversationId}`);
  }
}
