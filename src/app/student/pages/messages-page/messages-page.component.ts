import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/auth/services/auth.service';
import { Conversation, Message } from '../../../core/api/messaging/messaging.dto';
import { MessagingService } from '../../../core/api/messaging/messaging.service';
import { NotificationsStreamService } from '../../../core/api/notifications/notifications-stream.service';
import {
  UserDirectoryResult,
  UserDirectoryService,
} from '../../../core/api/users/user-directory.service';

/**
 * Página del inbox de mensajería directa (RF-061).
 *
 * Muestra las conversaciones del estudiante en un panel lateral y el
 * hilo activo en el panel principal. Los mensajes se ordenan del más
 * antiguo al más reciente para leer de forma natural.
 */
@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messages-page.component.html',
  styleUrl: './messages-page.component.scss',
})
export class MessagesPageComponent implements OnInit {
  private readonly service = inject(MessagingService);
  private readonly directory = inject(UserDirectoryService);
  private readonly stream = inject(NotificationsStreamService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loadingConversations = signal(true);
  protected readonly loadingMessages = signal(false);
  protected readonly sending = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly sendError = signal<string | null>(null);

  protected readonly conversations = signal<readonly Conversation[]>([]);
  protected readonly activeId = signal<number | null>(null);
  protected readonly messages = signal<readonly Message[]>([]);
  protected readonly draft = signal('');

  /** Identificador del usuario autenticado, para distinguir emisor propio. */
  protected readonly myId = computed(() => this.auth.currentUser()?.id ?? null);

  /** Conversación activa completa, o {@code null} si aún no se seleccionó. */
  protected readonly active = computed(() =>
    this.conversations().find((c) => c.id === this.activeId()) ?? null,
  );

  /** Estado del modal para iniciar una nueva conversación. */
  protected readonly composerOpen = signal(false);
  protected readonly directoryQuery = signal('');
  protected readonly directoryLoading = signal(false);
  protected readonly directoryResults = signal<readonly UserDirectoryResult[]>([]);
  protected readonly directoryError = signal<string | null>(null);
  protected readonly openingConversation = signal(false);

  private readonly directoryQuery$ = new Subject<string>();

  ngOnInit(): void {
    this.loadConversations();

    // Stream SSE: aplicamos cada mensaje entrante al estado local. Si
    // pertenece a la conversación activa se anexa al hilo y se marca
    // como leído; si no, sólo actualizamos el preview y el contador
    // de no leídas del sidebar.
    this.stream.connect();
    this.stream
      .onMessage()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((incoming) => this.onIncomingMessage(incoming));

    // Búsqueda con debounce para no saturar el rate limit del backend
    // y evitar carreras entre respuestas rápidas y lentas.
    this.directoryQuery$
      .pipe(
        debounceTime(280),
        distinctUntilChanged(),
        switchMap((q) => {
          if (q.trim().length < 2) {
            this.directoryLoading.set(false);
            this.directoryResults.set([]);
            return [];
          }
          this.directoryLoading.set(true);
          this.directoryError.set(null);
          return this.directory.search(q).pipe(
            finalize(() => this.directoryLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => this.directoryResults.set(results),
        error: () => {
          this.directoryError.set('No pudimos buscar en el directorio. Inténtalo nuevamente.');
          this.directoryResults.set([]);
        },
      });
  }

  /** Abre el modal de nueva conversación. */
  protected openComposer(): void {
    this.composerOpen.set(true);
    this.directoryQuery.set('');
    this.directoryResults.set([]);
    this.directoryError.set(null);
  }

  /** Cierra el modal descartando el estado local. */
  protected closeComposer(): void {
    this.composerOpen.set(false);
  }

  /** Notifica al pipeline de búsqueda que el término cambió. */
  protected onDirectoryQueryChange(value: string): void {
    this.directoryQuery.set(value);
    this.directoryQuery$.next(value);
  }

  /**
   * Abre (o recupera si ya existe) la conversación con el usuario
   * seleccionado y la deja activa en el hilo principal.
   */
  protected pickRecipient(recipient: UserDirectoryResult): void {
    if (this.openingConversation()) return;
    this.openingConversation.set(true);
    this.service
      .open(recipient.id)
      .pipe(
        finalize(() => this.openingConversation.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (conversation) => {
          // Inserta la conversación en la lista si aún no está.
          this.conversations.update((list) => {
            const exists = list.some((c) => c.id === conversation.id);
            return exists ? list : [conversation, ...list];
          });
          this.activeId.set(conversation.id);
          this.messages.set([]);
          this.loadMessages(conversation.id);
          this.closeComposer();
        },
        error: () =>
          this.directoryError.set('No pudimos abrir la conversación. Inténtalo nuevamente.'),
      });
  }

  /** Etiqueta legible del rol para el resultado del directorio. */
  protected directoryRoleLabel(role: UserDirectoryResult['role']): string {
    switch (role) {
      case 'INSTRUCTOR':
        return 'Instructor';
      case 'ADMINISTRADOR':
        return 'Administrador';
      default:
        return 'Estudiante';
    }
  }

  protected selectConversation(conversation: Conversation): void {
    if (this.activeId() === conversation.id) return;
    this.activeId.set(conversation.id);
    this.loadMessages(conversation.id);
  }

  /**
   * Manejador del textarea del hilo: {@code Enter} envía el mensaje y
   * {@code Shift+Enter} inserta una nueva línea. Refleja el patrón de
   * clientes de chat estándar (WhatsApp, Slack, Discord).
   */
  protected onComposerEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (ke.shiftKey || ke.isComposing || ke.altKey || ke.ctrlKey || ke.metaKey) {
      return;
    }
    ke.preventDefault();
    this.send();
  }

  protected send(): void {
    const activeId = this.activeId();
    const content = this.draft().trim();
    if (activeId == null || content.length === 0 || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.sendError.set(null);
    this.service
      .send(activeId, content)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (msg) => {
          this.messages.update((list) => [...list, msg]);
          this.draft.set('');
          this.bumpConversationPreview(activeId, msg.content, msg.sentAt);
        },
        error: () =>
          this.sendError.set('No pudimos enviar tu mensaje. Inténtalo nuevamente.'),
      });
  }

  private loadConversations(): void {
    this.loadingConversations.set(true);
    this.service
      .listMine(0, 30)
      .pipe(finalize(() => this.loadingConversations.set(false)))
      .subscribe({
        next: (page) => {
          this.conversations.set(page.content);
          if (page.content.length > 0 && this.activeId() == null) {
            this.selectConversation(page.content[0]);
          }
        },
        error: () =>
          this.error.set(
            'No pudimos cargar tus conversaciones en este momento. Inténtalo nuevamente.',
          ),
      });
  }

  private loadMessages(conversationId: number): void {
    this.loadingMessages.set(true);
    this.messages.set([]);
    this.service.listMessages(conversationId, 0, 100).subscribe({
      next: (page) => {
        // El backend devuelve los mensajes más recientes primero; invertimos
        // para mostrar el hilo en orden cronológico natural.
        this.messages.set([...page.content].reverse());
        this.loadingMessages.set(false);
      },
      error: () => this.loadingMessages.set(false),
    });
    this.service.markAsRead(conversationId).subscribe({
      next: () => {
        this.conversations.update((list) =>
          list.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
        );
      },
    });
  }

  private bumpConversationPreview(id: number, preview: string, at: string): void {
    this.conversations.update((list) => {
      const updated = list.map((c) =>
        c.id === id ? { ...c, lastMessagePreview: preview, lastMessageAt: at } : c,
      );
      return [...updated].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
    });
  }

  /**
   * Aplica un mensaje entrante recibido por SSE. Duplicados
   * potenciales (por ejemplo, cuando el backend reenvía un mensaje que
   * el propio usuario acaba de mandar) se descartan comparando el id.
   */
  private onIncomingMessage(incoming: Message): void {
    // Nunca mostramos como entrante lo que el propio usuario acaba de
    // enviar; ese caso ya se refleja en el hilo al confirmarse el POST.
    if (incoming.senderId === this.myId()) {
      return;
    }
    const activeId = this.activeId();
    if (incoming.conversationId === activeId) {
      const already = this.messages().some((m) => m.id === incoming.id);
      if (!already) {
        this.messages.update((list) => [...list, incoming]);
      }
      // El usuario está viendo la conversación: la marcamos leída para
      // que el contador global de no leídas también se sincronice.
      this.service.markAsRead(incoming.conversationId).subscribe({
        error: () => {
          // Silencioso: reintentar no aporta valor y el próximo
          // markAsRead al abrir la conversación cerrará la brecha.
        },
      });
      this.bumpConversationPreview(activeId, incoming.content, incoming.sentAt);
      return;
    }

    // Mensaje entrante para otra conversación: subimos el contador de
    // no leídas y refrescamos el preview en el sidebar.
    this.conversations.update((list) => {
      const found = list.find((c) => c.id === incoming.conversationId);
      if (!found) {
        // Conversación aún no listada; en ese caso preferimos recargar
        // la lista para incorporarla con su metadata completa.
        this.loadConversations();
        return list;
      }
      const updated = list.map((c) =>
        c.id === incoming.conversationId
          ? {
              ...c,
              lastMessagePreview: incoming.content,
              lastMessageAt: incoming.sentAt,
              unreadCount: (c.unreadCount ?? 0) + 1,
            }
          : c,
      );
      return [...updated].sort(
        (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
      );
    });
  }
}
