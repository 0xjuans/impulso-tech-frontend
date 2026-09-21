import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Sección "Conoce a Luki" — presentación de cuerpo completo de la
 * mascota IA en la landing page (RF-017).
 *
 * <p>Cumple dos objetivos: humanizar la marca dándole rostro y voz al
 * asistente, y comunicar de forma concreta qué puede hacer Luki por el
 * estudiante mediante tarjetas de habilidades y una viñeta narrativa
 * alrededor de la ilustración principal.</p>
 */
@Component({
  selector: 'app-meet-luki',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meet-luki.component.html',
  styleUrl: './meet-luki.component.scss',
})
export class MeetLukiComponent {

  /**
   * Habilidades que Luki ofrece al estudiante. Se renderizan como
   * chips orbitando la ilustración para reforzar la sensación de un
   * asistente polivalente.
   */
  protected readonly abilities: readonly Ability[] = [
    { icon: '💡', label: 'Da pistas, no soluciones' },
    { icon: '🧠', label: 'Explica en tu ritmo' },
    { icon: '🐛', label: 'Depura contigo' },
    { icon: '🚀', label: 'Sugiere el siguiente paso' },
    { icon: '⭐', label: 'Celebra tus logros' },
  ];
}

interface Ability {
  readonly icon: string;
  readonly label: string;
}
