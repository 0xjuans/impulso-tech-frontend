import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter, finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import {
  MascotConversation,
  MascotMessage,
} from '../../../core/api/mascot/mascot.dto';
import { MascotService } from '../../../core/api/mascot/mascot.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import {
  MascotAvatarComponent,
  MascotState,
} from '../../../shared/components/mascot-avatar/mascot-avatar.component';

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
  imports: [DatePipe, FormsModule, AppIconComponent, MascotAvatarComponent, MarkdownPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mascot-widget.component.html',
  styleUrl: './mascot-widget.component.scss',
})
export class MascotWidgetComponent implements AfterViewChecked {
  private readonly service = inject(MascotService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Duración en milisegundos que la mascota se mantiene "despierta"
   * (idle) tras cerrar el panel antes de pasar a la pose {@code inactivo}.
   */
  private static readonly SLEEP_DELAY_MS = 10_000;

  /**
   * Duración en milisegundos que la mascota mantiene una reacción
   * disparada por navegación (por ejemplo, un saludo al cambiar de
   * pestaña) antes de volver al estado calculado por actividad.
   */
  private static readonly ROUTE_REACTION_MS = 2_500;

  /** Nombre corto del usuario autenticado, usado en el saludo. */
  protected readonly userFirstName = computed(
    () => this.auth.currentUser()?.firstName ?? '',
  );

  /** Saludo dependiente de la hora del día. */
  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 19) return '¡Buenas tardes';
    return '¡Buenas noches';
  });

  @ViewChild('thread') private threadRef?: ElementRef<HTMLDivElement>;
  @ViewChild('panel') private panelRef?: ElementRef<HTMLElement>;

  protected readonly open = signal(false);
  protected readonly initializing = signal(false);
  /** Controla la visibilidad de la burbuja de saludo flotante. */
  protected readonly greetingOpen = signal(true);
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

  /**
   * Bandera que se activa cuando el panel lleva
   * {@link MascotWidgetComponent#SLEEP_DELAY_MS} milisegundos cerrado
   * sin actividad. Al activarse, la mascota pasa a la pose
   * {@code inactivo} (durmiendo); mientras está inactiva pero no
   * dormida, se muestra en {@code idle} para que la transición sea
   * gradual y natural.
   */
  private readonly dormant = signal(false);

  /**
   * Override manual del estado activado por eventos externos como los
   * cambios de ruta. Se resetea después de un tiempo corto para que la
   * mascota vuelva al estado calculado por la actividad del chat.
   */
  private readonly override = signal<MascotState | null>(null);

  /**
   * Estado semántico de la mascota que la animación consume.
   *
   * <p>Cascada de precedencia: (1) override por navegación, (2) estado
   * derivado de la actividad del chat cuando el panel está abierto,
   * (3) idle durante los primeros segundos tras cerrar el panel,
   * (4) {@code inactivo} cuando se cumple el timeout de dormancia.</p>
   */
  protected readonly mascotState = computed<MascotState>(() => {
    const override = this.override();
    if (override) return override;

    if (this.open()) {
      if (this.sending()) return 'thinking';
      const last = this.messages()[this.messages().length - 1];
      if (last && last.role === 'ASSISTANT' && !this.sending()) {
        return 'talking';
      }
      return 'idle';
    }
    return this.dormant() ? 'inactivo' : 'idle';
  });

  /** Deshabilita el botón cuando no hay contenido o el envío está en curso. */
  protected readonly canSend = computed(
    () =>
      !this.sending() &&
      this.conversation() !== null &&
      this.draft().trim().length > 0,
  );

  private shouldScroll = false;
  private dormantTimer: ReturnType<typeof setTimeout> | null = null;
  private overrideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Efecto: cuando cambia el estado abierto/cerrado del panel se
    // reinicia el temporizador de dormancia. Estar abierto siempre
    // implica estar despierto; al cerrar, la mascota se queda idle
    // durante unos segundos antes de dormirse.
    effect(
      () => {
        const isOpen = this.open();
        this.clearDormantTimer();
        this.dormant.set(false);
        if (!isOpen) {
          this.dormantTimer = setTimeout(
            () => this.dormant.set(true),
            MascotWidgetComponent.SLEEP_DELAY_MS,
          );
        }
      },
      { allowSignalWrites: true },
    );

    // Reacción a cambios de ruta: la mascota nota que el estudiante se
    // movió y le "saluda" o adopta un ánimo contextual acorde al tipo
    // de sección visitada. También reinicia el temporizador de
    // dormancia porque navegar cuenta como actividad.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => this.reactToRoute(e.urlAfterRedirects));
  }

  /**
   * Reinicia el temporizador de dormancia y aplica un override breve
   * con la pose sugerida por la ruta actual.
   */
  private reactToRoute(url: string): void {
    this.clearDormantTimer();
    this.dormant.set(false);
    if (!this.open()) {
      this.dormantTimer = setTimeout(
        () => this.dormant.set(true),
        MascotWidgetComponent.SLEEP_DELAY_MS,
      );
    }
    this.setOverride(MascotWidgetComponent.pickMoodByRoute(url));
  }

  /**
   * Fija un override temporal del estado semántico y programa su reset.
   */
  private setOverride(state: MascotState): void {
    if (this.overrideTimer !== null) {
      clearTimeout(this.overrideTimer);
    }
    this.override.set(state);
    this.overrideTimer = setTimeout(
      () => this.override.set(null),
      MascotWidgetComponent.ROUTE_REACTION_MS,
    );
  }

  private clearDormantTimer(): void {
    if (this.dormantTimer !== null) {
      clearTimeout(this.dormantTimer);
      this.dormantTimer = null;
    }
  }

  /**
   * Mapea una URL de la aplicación a la pose más apropiada. La
   * intención es que la mascota reaccione de forma coherente con el
   * tipo de contenido que el estudiante acaba de abrir.
   */
  private static pickMoodByRoute(url: string): MascotState {
    if (url.includes('/challenges')) return 'pensando';
    if (url.includes('/labs')) return 'celebrando';
    if (url.includes('/evaluations')) return 'pensando';
    if (url.includes('/certificates')) return 'felicitando';
    if (url.includes('/community')) return 'hablando';
    if (url.includes('/messages')) return 'hablando';
    if (url.includes('/notifications')) return 'confundido';
    if (url.includes('/projects')) return 'celebrando';
    if (url.includes('/routes')) return 'saludo';
    if (url.includes('/courses')) return 'saludo';
    return 'saludo';
  }

  /** Alterna el estado abierto/cerrado del widget. */
  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) {
      // Al abrir el chat, ocultamos la burbuja flotante para no
      // duplicar el saludo dentro del panel.
      this.greetingOpen.set(false);
    }
    if (next && this.conversation() === null && !this.initializing()) {
      this.initializeConversation();
    }
    if (next) {
      this.shouldScroll = true;
    }
  }

  /** Cierra manualmente la burbuja de saludo flotante. */
  protected dismissGreeting(event: Event): void {
    event.stopPropagation();
    this.greetingOpen.set(false);
  }

  /** Abre el chat directamente desde el CTA de la burbuja de saludo. */
  protected openFromGreeting(event: Event): void {
    event.stopPropagation();
    this.greetingOpen.set(false);
    if (!this.open()) {
      this.toggle();
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

  /**
   * Inicia el redimensionado del panel al arrastrar la esquina superior
   * izquierda. Como el panel está anclado a {@code bottom + right}, se
   * calcula el ancho/alto desde el delta invertido del cursor para que
   * al arrastrar hacia afuera el panel crezca hacia esa dirección.
   *
   * <p>Se aplican mínimos razonables (360×420 px) y máximos limitados
   * por el viewport (90 vw × 90 vh) para que el panel siga siendo
   * visible en pantallas pequeñas.</p>
   */
  protected startResize(event: MouseEvent): void {
    const panel = this.panelRef?.nativeElement;
    if (!panel) return;
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = panel.offsetWidth;
    const startHeight = panel.offsetHeight;
    const minWidth = 320;
    const minHeight = 420;
    const maxWidth = Math.floor(window.innerWidth * 0.9);
    const maxHeight = Math.floor(window.innerHeight * 0.9);
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const onMove = (e: MouseEvent) => {
      const width = clamp(startWidth + (startX - e.clientX), minWidth, maxWidth);
      const height = clamp(startHeight + (startY - e.clientY), minHeight, maxHeight);
      panel.style.width = `${width}px`;
      panel.style.height = `${height}px`;
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.userSelect = previousUserSelect;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
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

/** Recorta un valor al rango {@code [min, max]}. */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
