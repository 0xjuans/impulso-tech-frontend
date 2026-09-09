import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import {
  MascotConversation,
  MascotMessage,
} from '../../../core/api/mascot/mascot.dto';
import { MascotService } from '../../../core/api/mascot/mascot.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

/**
 * Widget flotante de la mascota IA (RF-017).
 *
 * Renderiza una burbuja fija en la esquina inferior derecha del área
 * del estudiante. Al abrirse, crea (o recupera) una conversación
 * general con la mascota y muestra el hilo de mensajes. El envío se
 * hace a través del backend, que orquesta la llamada al proveedor de
 * IA y aplica las salvaguardas necesarias.
 */
@Component({
  selector: 'app-mascot-widget',
  standalone: true,
  imports: [DatePipe, FormsModule, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mascot-widget.component.html',
  styleUrl: './mascot-widget.component.scss',
})
export class MascotWidgetComponent implements AfterViewChecked {
  private readonly service = inject(MascotService);

  @ViewChild('thread') private threadRef?: ElementRef<HTMLDivElement>;

  protected readonly open = signal(false);
  protected readonly initializing = signal(false);
  protected readonly initError = signal<string | null>(null);
  protected readonly sending = signal(false);
  protected readonly sendError = signal<string | null>(null);

  protected readonly conversation = signal<MascotConversation | null>(null);
  protected readonly messages = signal<readonly MascotMessage[]>([]);
  protected readonly draft = signal('');

  /** Sugerencias rápidas para iniciar la conversación. */
  protected readonly quickPrompts: readonly string[] = [
    'Explícame un concepto que no entiendo.',
    'Dame una pista para avanzar.',
    'Motívame a seguir aprendiendo.',
  ];

  /** Deshabilita el botón cuando no hay contenido o el envío está en curso. */
  protected readonly canSend = computed(
    () =>
      !this.sending() &&
      this.conversation() !== null &&
      this.draft().trim().length > 0,
  );

  private shouldScroll = false;

  /** Alterna el estado abierto/cerrado del widget. */
  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && this.conversation() === null && !this.initializing()) {
      this.initializeConversation();
    }
    if (next) {
      this.shouldScroll = true;
    }
  }

  /** Cierra el widget al pulsar escape. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  /** Envía el mensaje redactado por el estudiante. */
  protected send(): void {
    const conversation = this.conversation();
    const content = this.draft().trim();
    if (!conversation || content.length === 0 || this.sending()) {
      return;
    }

    // Añadimos localmente el mensaje del usuario para retroalimentación
    // inmediata, aunque la respuesta oficial la persiste el backend al
    // resolver el POST.
    const optimistic: MascotMessage = {
      id: -Date.now(),
      role: 'USER',
      content,
      createdAt: new Date().toISOString(),
    };
    this.messages.update((list) => [...list, optimistic]);
    this.draft.set('');
    this.shouldScroll = true;

    this.sending.set(true);
    this.sendError.set(null);
    this.service
      .sendMessage(conversation.id, content)
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: (assistant) => {
          this.messages.update((list) => [...list, assistant]);
          this.shouldScroll = true;
        },
        error: () => {
          this.messages.update((list) => list.filter((m) => m.id !== optimistic.id));
          this.sendError.set(
            'No pudimos enviar tu mensaje a la mascota. Inténtalo nuevamente.',
          );
        },
      });
  }

  /** Rellena el borrador con una sugerencia rápida. */
  protected useQuickPrompt(prompt: string): void {
    this.draft.set(prompt);
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.threadRef) {
      this.shouldScroll = false;
      const el = this.threadRef.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  /**
   * Recupera la conversación general más reciente o crea una nueva si
   * el estudiante todavía no ha hablado con la mascota.
   */
  private initializeConversation(): void {
    this.initializing.set(true);
    this.initError.set(null);
    this.service
      .listMine(0, 1)
      .subscribe({
        next: (page) => {
          const existing = page.content.find(
            (c) => c.closedAt === null && (c.contextType === 'GENERAL' || c.contextType === null),
          );
          if (existing) {
            this.loadConversation(existing.id);
          } else {
            this.createConversation();
          }
        },
        error: () => this.createConversation(),
      });
  }

  private createConversation(): void {
    this.service.start({ contextType: 'GENERAL' }).subscribe({
      next: (created) => {
        this.conversation.set(created);
        this.messages.set([]);
        this.initializing.set(false);
      },
      error: () => {
        this.initializing.set(false);
        this.initError.set(
          'No pudimos abrir la conversación con la mascota. Inténtalo nuevamente en unos minutos.',
        );
      },
    });
  }

  private loadConversation(id: number): void {
    this.service.get(id).subscribe({
      next: (detail) => {
        this.conversation.set(detail);
        this.messages.set(detail.messages ?? []);
        this.initializing.set(false);
        this.shouldScroll = true;
      },
      error: () => {
        this.initializing.set(false);
        this.initError.set(
          'No pudimos cargar tu conversación con la mascota. Inténtalo nuevamente.',
        );
      },
    });
  }
}
