import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Componente para mostrar un video de tour del perfil.
 *
 * Reproduce un MP4 generado con las funcionalidades de cada rol.
 * Incluye controles nativos del navegador y autoplay silencioso.
 */
@Component({
  selector: 'app-tour-video',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tour-video.component.html',
  styleUrl: './tour-video.component.scss',
})
export class TourVideoComponent {
  @Input({ required: true }) src = '';
  @Input() poster = '';
}
