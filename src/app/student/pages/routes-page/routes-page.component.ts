import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { LearningRoute } from '../../../core/api/learning-routes/learning-route.dto';
import { LearningRoutesService } from '../../../core/api/learning-routes/learning-routes.service';

/**
 * Página que muestra el catálogo de rutas de aprendizaje publicadas por
 * la plataforma (RF-008).
 *
 * Se consumen únicamente las rutas en estado publicado a través de
 * {@link LearningRoutesService}. Los estados de carga, vacío y error se
 * manejan de forma explícita para brindar retroalimentación clara al
 * estudiante.
 */
@Component({
  selector: 'app-routes-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './routes-page.component.html',
  styleUrl: './routes-page.component.scss',
})
export class RoutesPageComponent implements OnInit {
  private readonly routesService = inject(LearningRoutesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly routes = signal<readonly LearningRoute[]>([]);

  ngOnInit(): void {
    this.routesService
      .listPublished(0, 24)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.routes.set(page.content),
        error: () =>
          this.error.set(
            'No pudimos cargar las rutas de aprendizaje en este momento. Inténtalo nuevamente en unos minutos.',
          ),
      });
  }

  /**
   * Devuelve una lista limpia de tecnologías a partir del texto libre
   * almacenado por el backend. Divide por comas y elimina espacios en
   * blanco superfluos para que la interfaz pueda mostrarlas como chips.
   */
  protected splitTechnologies(raw: string | null): readonly string[] {
    if (!raw) {
      return [];
    }
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
}
