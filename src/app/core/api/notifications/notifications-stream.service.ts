import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { Message } from '../messaging/messaging.dto';
import { Notification } from './notification.dto';

/**
 * Servicio que administra la conexión Server-Sent Events con el backend
 * para recibir notificaciones nuevas en tiempo real (RF-026).
 *
 * <p>La conexión se abre bajo demanda con {@link #connect}. El servicio
 * reintenta automáticamente al perderse la conexión con un backoff
 * exponencial acotado, se desconecta al cerrar sesión y expone un
 * observable con las notificaciones entrantes.</p>
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStreamService {
  private readonly auth = inject(AuthService);

  /** Delay inicial (ms) para reintentar la conexión al fallar. */
  private static readonly INITIAL_RETRY_MS = 1_000;

  /** Delay máximo (ms) al aplicar el backoff exponencial. */
  private static readonly MAX_RETRY_MS = 30_000;

  private eventSource: EventSource | null = null;
  private retryDelay = NotificationsStreamService.INITIAL_RETRY_MS;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly incoming$ = new Subject<Notification>();
  private readonly incomingMessage$ = new Subject<Message>();

  /** Indica si actualmente hay una conexión SSE abierta y sana. */
  readonly connected = signal(false);

  /**
   * Devuelve el flujo de notificaciones que llegan por SSE. Cada
   * emisión representa una notificación recién creada para el usuario.
   */
  onNotification(): Observable<Notification> {
    return this.incoming$.asObservable();
  }

  /**
   * Devuelve el flujo de mensajes directos entrantes que llegan por
   * SSE. Cada emisión representa un {@link Message} recién enviado por
   * otro usuario al que está conectado el suscriptor actual.
   */
  onMessage(): Observable<Message> {
    return this.incomingMessage$.asObservable();
  }

  /**
   * Registra la desconexión automática al destruirse el componente
   * consumidor. Se usa desde componentes de larga vida (por ejemplo, el
   * shell) para asegurar la limpieza al hacer logout.
   */
  linkLifecycle(destroyRef: DestroyRef): void {
    destroyRef.onDestroy(() => this.disconnect());
  }

  /**
   * Abre la conexión SSE al backend. Es idempotente: llamar dos veces
   * mientras la conexión sigue viva no crea sesiones duplicadas.
   */
  connect(): void {
    if (this.eventSource) {
      return;
    }
    const token = this.auth.getAccessToken();
    if (!token) {
      return;
    }
    const url = `${environment.apiBaseUrl}/users/me/notifications/stream?access_token=${encodeURIComponent(token)}`;
    const source = new EventSource(url);
    this.eventSource = source;

    source.addEventListener('hello', () => {
      this.connected.set(true);
      this.retryDelay = NotificationsStreamService.INITIAL_RETRY_MS;
    });

    source.addEventListener('notification', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as Notification;
        this.incoming$.next(data);
      } catch {
        // Ignoramos payloads corruptos para no romper el flujo.
      }
    });

    source.addEventListener('message', (evt) => {
      try {
        const data = JSON.parse((evt as MessageEvent).data) as Message;
        this.incomingMessage$.next(data);
      } catch {
        // Ignoramos payloads corruptos para no romper el flujo.
      }
    });

    source.onerror = () => {
      this.connected.set(false);
      this.closeSource();
      this.scheduleReconnect();
    };
  }

  /**
   * Cierra la conexión SSE y cancela cualquier reintento pendiente.
   * Se debe invocar tras cerrar sesión.
   */
  disconnect(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.closeSource();
    this.connected.set(false);
    this.retryDelay = NotificationsStreamService.INITIAL_RETRY_MS;
  }

  private closeSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.auth.getAccessToken()) {
      return;
    }
    if (this.retryTimer) {
      return;
    }
    const delay = this.retryDelay;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.retryDelay = Math.min(delay * 2, NotificationsStreamService.MAX_RETRY_MS);
      this.connect();
    }, delay);
  }
}
