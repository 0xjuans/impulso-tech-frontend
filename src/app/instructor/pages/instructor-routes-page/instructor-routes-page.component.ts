import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import {
  ContentStatus,
  DifficultyLevel,
  LearningRoute,
} from '../../../core/api/learning-routes/learning-route.dto';
import { LearningRoutesService } from '../../../core/api/learning-routes/learning-routes.service';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

/**
 * Panel de gestión de rutas de aprendizaje del instructor (RF-009).
 *
 * <p>Consume el endpoint {@code /api/learning-routes/manage} que
 * devuelve todas las rutas independientemente de su estado. Permite
 * filtrar por texto, dificultad y estado, publicar o retirar rutas y
 * navegar al editor para crear o modificar contenido.</p>
 */
@Component({
  selector: 'app-instructor-routes-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-routes-page.component.html',
  styleUrl: './instructor-routes-page.component.scss',
})
export class InstructorRoutesPageComponent implements OnInit {
  private readonly service = inject(LearningRoutesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly routes = signal<readonly LearningRoute[]>([]);

  protected readonly search = signal('');
  protected readonly difficultyFilter = signal<DifficultyLevel | ''>('');
  protected readonly statusFilter = signal<ContentStatus | ''>('');

  /** Identificador de la ruta cuyo cambio de estado se está aplicando. */
  protected readonly pendingStatusId = signal<number | null>(null);

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  protected readonly statuses: readonly ContentStatus[] = [
    'BORRADOR',
    'PUBLICADO',
    'DESHABILITADO',
  ];

  /** Agrupación resumida por estado, útil para mostrar contadores en la UI. */
  protected readonly counts = computed(() => {
    const list = this.routes();
    return {
      total: list.length,
      published: list.filter((r) => r.status === 'PUBLICADO').length,
      draft: list.filter((r) => r.status === 'BORRADOR').length,
      disabled: list.filter((r) => r.status === 'DESHABILITADO').length,
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  /**
   * Aplica el cambio de estado solicitado desde la fila. Se registra en
   * {@link pendingStatusId} para deshabilitar los controles mientras el
   * backend responde y evitar dobles envíos accidentales.
   */
  protected changeStatus(route: LearningRoute, status: ContentStatus): void {
    if (route.status === status) return;
    this.pendingStatusId.set(route.id);
    this.service
      .changeStatus(route.id, status)
      .pipe(finalize(() => this.pendingStatusId.set(null)))
      .subscribe({
        next: (updated) => {
          this.routes.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
        },
        error: () =>
          this.error.set('No pudimos actualizar el estado de la ruta. Inténtalo nuevamente.'),
      });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listAllForManagement({
        search: this.search().trim() || undefined,
        difficulty: this.difficultyFilter() || undefined,
        status: this.statusFilter() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar tus rutas. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.routes.set(response.content));
  }
}
