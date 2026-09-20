import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';

/**
 * Estados semánticos que puede adoptar la mascota (RF-017).
 *
 * <p>Coinciden con las poses ilustradas en la hoja de personaje: idle,
 * saludo, pensando, hablando, celebrando, confundido, felicitando e
 * inactivo. Se mantienen los alias en inglés que otros componentes
 * (por ejemplo el widget de chat) usan hoy para no forzar una migración
 * simultánea.</p>
 */
export type MascotState =
  | 'idle'
  | 'saludo'
  | 'pensando'
  | 'hablando'
  | 'celebrando'
  | 'confundido'
  | 'felicitando'
  | 'inactivo'
  | 'thinking'
  | 'talking'
  | 'happy';

/**
 * Avatar de la mascota IA de Impulso Tech.
 *
 * <p>Renderiza una de las ilustraciones alojadas en
 * {@code public/mascot/&lt;pose&gt;.webp}, con una transición suave de
 * fundido cruzado entre estados y una animación sutil de respiración
 * mientras la mascota está en reposo. Se prefirió el intercambio de
 * imágenes sobre {@code Rive} o {@code Lottie} para eliminar
 * dependencias externas y aprovechar las ilustraciones que ya existen.</p>
 */
@Component({
  selector: 'app-mascot-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mascot-avatar.component.html',
  styleUrl: './mascot-avatar.component.scss',
})
export class MascotAvatarComponent {
  /** Estado semántico actual — determina la pose visible. */
  @Input() set state(value: MascotState) {
    this.stateSignal.set(value);
  }

  /** Tamaño en pixeles (cuadrado). */
  @Input() sizePx = 48;

  /** Base pública desde la que se sirven las poses. */
  @Input() basePath = 'mascot';

  protected readonly stateSignal = signal<MascotState>('idle');

  /** Pose activa normalizada al identificador canónico en español. */
  protected readonly pose = computed<Pose>(() => normalizePose(this.stateSignal()));

  /**
   * URL de la ilustración correspondiente al estado actual. Se recalcula
   * solo cuando cambia el estado, para que el navegador aproveche la
   * caché HTTP entre transiciones.
   */
  protected readonly imageSrc = computed(() => `${this.basePath}/${this.pose()}.webp`);

  /**
   * Texto alternativo para lectores de pantalla. Cada pose se traduce en
   * una descripción concisa; en la mayoría de contextos el avatar es
   * decorativo (los consumidores lo marcan {@code aria-hidden}), pero
   * cuando se muestra en aislado ayuda que tenga un alt legible.
   */
  protected readonly alt = computed<string>(() => POSE_ALTS[this.pose()]);
}

type Pose =
  | 'idle'
  | 'saludo'
  | 'pensando'
  | 'hablando'
  | 'celebrando'
  | 'confundido'
  | 'felicitando'
  | 'inactivo';

/** Traduce alias en inglés al identificador canónico en español. */
function normalizePose(state: MascotState): Pose {
  switch (state) {
    case 'thinking': return 'pensando';
    case 'talking': return 'hablando';
    case 'happy': return 'celebrando';
    default: return state;
  }
}

const POSE_ALTS: Record<Pose, string> = {
  idle: 'Mascota Impulso Tech en reposo',
  saludo: 'Mascota Impulso Tech saludando',
  pensando: 'Mascota Impulso Tech pensando',
  hablando: 'Mascota Impulso Tech hablando',
  celebrando: 'Mascota Impulso Tech celebrando',
  confundido: 'Mascota Impulso Tech confundida',
  felicitando: 'Mascota Impulso Tech felicitando con pulgar arriba',
  inactivo: 'Mascota Impulso Tech dormida',
};
