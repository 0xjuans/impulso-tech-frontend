import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import {
  CommunityPost,
  CreatePostRequest,
  RelatedContentType,
} from '../../../core/api/community/community.dto';
import { CommunityService } from '../../../core/api/community/community.service';

/**
 * Foro de comunidad del estudiante (RF-034).
 *
 * <p>Muestra un listado paginado de publicaciones con filtros por
 * palabra clave y por tipo de contenido relacionado, y expone un
 * formulario integrado para crear una nueva publicación sin salir de la
 * página. Los detalles de cada publicación se abren en la ruta
 * {@code /student/community/:id}.</p>
 */
@Component({
  selector: 'app-community-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './community-page.component.html',
  styleUrl: './community-page.component.scss',
})
export class CommunityPageComponent implements OnInit {
  private readonly service = inject(CommunityService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly posts = signal<readonly CommunityPost[]>([]);

  protected readonly search = signal('');
  protected readonly relatedTypeFilter = signal<RelatedContentType | ''>('');

  /** Muestra u oculta el formulario para crear una nueva publicación. */
  protected readonly composerOpen = signal(false);
  /** Estado del formulario de creación. Se maneja con signals simples
   *  porque son campos independientes y no ameritan un {@code FormGroup}. */
  protected readonly newTitle = signal('');
  protected readonly newDescription = signal('');
  protected readonly newCodeSnippet = signal('');
  protected readonly newTags = signal('');
  protected readonly newRelatedType = signal<RelatedContentType | ''>('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  /** Habilita el envío solo cuando existen título y descripción no vacíos. */
  protected readonly canSubmit = computed(
    () => this.newTitle().trim().length > 0 && this.newDescription().trim().length > 0,
  );

  protected readonly relatedTypes: readonly RelatedContentType[] = [
    'RUTA',
    'CURSO',
    'LECCION',
    'RETO',
    'LABORATORIO',
    'PROYECTO',
    'EVALUACION',
  ];

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected toggleComposer(): void {
    this.composerOpen.update((open) => !open);
    this.submitError.set(null);
  }

  protected submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const payload: CreatePostRequest = {
      title: this.newTitle().trim(),
      description: this.newDescription().trim(),
      codeSnippet: this.newCodeSnippet().trim() || null,
      tags: this.newTags().trim() || null,
      relatedType: this.newRelatedType() || null,
    };
    this.service
      .createPost(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          // Insercion optimista para respuesta inmediata y recarga para
          // reflejar el orden real y evitar que la publicacion "desaparezca"
          // si el listado se refresca por cualquier otro motivo.
          this.posts.update((list) => [created, ...list]);
          this.resetComposer();
          this.composerOpen.set(false);
          this.reload();
        },
        error: (err) => {
          console.error('[community] error al crear publicacion', err);
          const message =
            (err?.error?.message as string | undefined) ??
            'No pudimos publicar tu pregunta. Revisa los datos e inténtalo nuevamente.';
          this.submitError.set(message);
        },
      });
  }

  private resetComposer(): void {
    this.newTitle.set('');
    this.newDescription.set('');
    this.newCodeSnippet.set('');
    this.newTags.set('');
    this.newRelatedType.set('');
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listPosts({
        search: this.search().trim() || undefined,
        relatedType: this.relatedTypeFilter() || undefined,
        page: 0,
        size: 30,
      })
      .pipe(
        catchError(() => {
          this.error.set(
            'No pudimos cargar las publicaciones. Inténtalo nuevamente en unos segundos.',
          );
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.posts.set(response.content));
  }

  /** Devuelve los tags de una publicación como un arreglo limpio. */
  protected tagList(post: CommunityPost): readonly string[] {
    if (!post.tags) return [];
    return post.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
}
