import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { Conversation, Message } from '../../../core/api/messaging/messaging.dto';
import { MessagingService } from '../../../core/api/messaging/messaging.service';

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
  private readonly auth = inject(AuthService);

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

  ngOnInit(): void {
    this.loadConversations();
  }

  protected selectConversation(conversation: Conversation): void {
    if (this.activeId() === conversation.id) return;
    this.activeId.set(conversation.id);
    this.loadMessages(conversation.id);
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
}
