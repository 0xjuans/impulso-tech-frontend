import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { interval } from 'rxjs';

/**
 * Sección hero de la landing page.
 *
 * Presenta la propuesta de valor principal de Impulso Tech sobre un fondo
 * de video educativo que muestra escritura de código real. El hero combina
 * varias capas visuales para lograr un impacto memorable:
 *
 * - Video de fondo silenciado en bucle, con superposición de degradados.
 * - Título con palabra rotativa que refuerza la variedad de aprendizaje.
 * - Tarjetas flotantes que anticipan la experiencia real de la plataforma
 *   (terminal con animación de tipeo, tarjeta de progreso con racha y
 *   mascota con IA).
 * - Marquesina infinita de tecnologías cubiertas por la plataforma.
 */
@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HeroComponent implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Referencia al elemento `<video>` para forzar la reproducción manual. */
  @ViewChild('heroVideo')
  private readonly heroVideo?: ElementRef<HTMLVideoElement>;

  /**
   * Palabras que rotan dentro del titular principal.
   *
   * Cada término refleja una capacidad distinta que el estudiante desarrolla
   * en la plataforma y se muestra durante unos segundos antes de dar paso
   * a la siguiente. La rotación cíclica refuerza el mensaje de amplitud
   * sin necesidad de mostrar todo simultáneamente.
   */
  protected readonly rotatingWords = [
    'programar',
    'crear apps',
    'resolver retos',
    'pensar como dev',
  ] as const;

  /** Índice de la palabra actualmente visible en la rotación. */
  protected readonly rotatingIndex = signal(0);

  /**
   * Marquesina infinita de tecnologías cubiertas por Impulso Tech.
   *
   * La lista se duplica en la plantilla para lograr un desplazamiento
   * continuo sin cortes visibles.
   */
  protected readonly technologies = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'React',
    'Angular',
    'Node.js',
    'SQL',
    'Docker',
    'Git',
    'HTML',
    'CSS',
  ] as const;

  ngOnInit(): void {
    // Rotar la palabra destacada cada 2.6 segundos.
    interval(2600)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rotatingIndex.update((current) => (current + 1) % this.rotatingWords.length);
      });
  }

  /**
   * Fuerza la reproducción del video una vez inicializada la vista.
   *
   * Algunos navegadores con políticas estrictas (por ejemplo Brave o Safari
   * con ahorro de energía) ignoran el atributo `autoplay` aunque el video
   * esté silenciado. Invocar `play()` explícitamente cubre esos casos y, si
   * el navegador aún así lo rechaza, la promesa se descarta silenciosamente
   * para no afectar la experiencia: el póster estático se mantiene visible.
   */
  ngAfterViewInit(): void {
    const video = this.heroVideo?.nativeElement;
    if (!video) {
      return;
    }
    video.muted = true;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        // El navegador bloqueó el autoplay: el póster estático seguirá visible.
      });
    }
  }
}
