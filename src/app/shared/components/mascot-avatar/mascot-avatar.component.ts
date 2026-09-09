import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';

/** Estados semánticos que puede adoptar la mascota. */
export type MascotState = 'idle' | 'thinking' | 'talking' | 'happy';

/**
 * Avatar animado de la mascota IA de Impulso Tech.
 *
 * <p>Se implementa como SVG inline para evitar dependencias externas y
 * asegurar máxima fidelidad tipográfica y de color con el sistema de
 * diseño. La animación reacciona al estado suministrado: en
 * {@code idle} respira y parpadea; en {@code thinking} los ojos
 * apuntan hacia arriba y el LED de la antena oscila; en
 * {@code talking} la boca acompaña el habla; en {@code happy} da un
 * pequeño rebote.</p>
 */
@Component({
  selector: 'app-mascot-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mascot-avatar.component.html',
  styleUrl: './mascot-avatar.component.scss',
})
export class MascotAvatarComponent {
  /** Estado semántico actual — controla las animaciones. */
  @Input() set state(value: MascotState) {
    this.stateSignal.set(value);
  }

  /** Tamaño en pixeles (cuadrado). */
  @Input() sizePx = 48;

  protected readonly stateSignal = signal<MascotState>('idle');
  protected readonly stateClass = computed(() => `is-${this.stateSignal()}`);
}
