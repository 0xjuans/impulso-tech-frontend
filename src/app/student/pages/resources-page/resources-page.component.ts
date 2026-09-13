import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  EducationalResource,
  ResourceType,
} from '../../../core/api/resources/resource.dto';
import { ResourcesService } from '../../../core/api/resources/resources.service';
import { DifficultyLevel } from '../../../core/api/learning-routes/learning-route.dto';

/**
 * Biblioteca de recursos educativos publicados (RF-024) con soporte
 * para marcar y desmarcar favoritos del usuario autenticado (RF-025).
 *
 * <p>El listado admite filtros por texto, tipo y nivel de dificultad,
 * y un modo alterno que muestra únicamente los recursos que el
 * estudiante ha marcado como favoritos.</p>
 */
@Component({
  selector: 'app-resources-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resources-page.component.html',
  styleUrl: './resources-page.component.scss',
})
export class ResourcesPageComponent implements OnInit {
  private readonly service = inject(ResourcesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly resources = signal<readonly EducationalResource[]>([]);
  protected readonly favoriteIds = signal<ReadonlySet<number>>(new Set());

  protected readonly search = signal('');
  protected readonly typeFilter = signal<ResourceType | ''>('');
  protected readonly difficultyFilter = signal<DifficultyLevel | ''>('');
  protected readonly onlyFavorites = signal(false);

  protected readonly types: readonly ResourceType[] = [
    'PDF',
    'VIDEO',
    'IMAGEN',
    'CODIGO',
    'ENLACE_EXTERNO',
    'DOCUMENTO',
    'GUIA',
  ];

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  /**
   * Recursos efectivamente mostrados: si el filtro "solo favoritos"
   * está activo, se restringe al conjunto local; el resto viene ya
   * paginado desde el backend.
   */
  protected readonly visibleResources = computed(() => {
    const list = this.resources();
    if (!this.onlyFavorites()) return list;
    const favs = this.favoriteIds();
    return list.filter((r) => favs.has(r.id));
  });

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected isFavorite(resource: EducationalResource): boolean {
    return this.favoriteIds().has(resource.id);
  }

  protected toggleFavorite(resource: EducationalResource, event: Event): void {
    event.stopPropagation();
    const wasFavorite = this.isFavorite(resource);
    // Actualización optimista: si falla, revertimos.
    this.updateFavoriteLocal(resource.id, !wasFavorite);
    if (wasFavorite) {
      this.service.unfavorite(resource.id).subscribe({
        error: () => this.updateFavoriteLocal(resource.id, wasFavorite),
      });
    } else {
      this.service.favorite(resource.id).subscribe({
        error: () => this.updateFavoriteLocal(resource.id, wasFavorite),
      });
    }
  }

  private updateFavoriteLocal(resourceId: number, favorite: boolean): void {
    this.favoriteIds.update((set) => {
      const next = new Set(set);
      if (favorite) next.add(resourceId);
      else next.delete(resourceId);
      return next;
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      list: this.service.listPublished({
        search: this.search().trim() || undefined,
        type: this.typeFilter() || undefined,
        difficulty: this.difficultyFilter() || undefined,
        page: 0,
        size: 48,
      }),
      favorites: this.service
        .listMyFavorites(0, 200)
        .pipe(catchError(() => of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 }))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ list, favorites }) => {
          this.resources.set(list.content);
          this.favoriteIds.set(new Set(favorites.content.map((f) => f.resource.id)));
        },
        error: () =>
          this.error.set(
            'No pudimos cargar la biblioteca en este momento. Inténtalo nuevamente.',
          ),
      });
  }
}
