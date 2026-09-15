import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';

import {
  CreateLearningRouteRequest,
  DifficultyLevel,
  LearningRoute,
  UpdateLearningRouteRequest,
} from '../../../core/api/learning-routes/learning-route.dto';
import { LearningRoutesService } from '../../../core/api/learning-routes/learning-routes.service';

/**
 * Editor de una ruta de aprendizaje (RF-009).
 *
 * <p>Funciona en dos modos según la ruta:</p>
 * <ul>
 *   <li>{@code /instructor/routes/new} → creación desde cero.</li>
 *   <li>{@code /instructor/routes/:id} → edición de una ruta existente.</li>
 * </ul>
 *
 * <p>En modo edición carga primero el detalle, hidrata el formulario y
 * permite guardar cambios parciales. Al crear, redirige al editor de la
 * ruta recién creada para que el instructor pueda seguir enriqueciendo
 * la información.</p>
 */
@Component({
  selector: 'app-instructor-route-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink, RichTextEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-route-editor-page.component.html',
  styleUrl: './instructor-route-editor-page.component.scss',
})
export class InstructorRouteEditorPageComponent implements OnInit {
  private readonly service = inject(LearningRoutesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** Identificador de la ruta en modo edición; null cuando se crea. */
  protected readonly routeId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loaded = signal<LearningRoute | null>(null);

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly objective = signal('');
  protected readonly coverImageUrl = signal('');
  protected readonly difficulty = signal<DifficultyLevel | ''>('');
  protected readonly estimatedDurationHours = signal<number | null>(null);
  protected readonly technologies = signal('');

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  /** Solo permite enviar cuando los campos obligatorios tienen contenido. */
  protected readonly canSubmit = computed(
    () => this.name().trim().length > 0 && this.description().trim().length > 0,
  );

  protected readonly isEditing = computed(() => this.routeId() !== null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        this.error.set('La ruta solicitada no existe.');
        return;
      }
      this.routeId.set(id);
      this.load(id);
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (route) => {
          this.loaded.set(route);
          this.hydrate(route);
        },
        error: () => this.error.set('No pudimos cargar la ruta. Puede haber sido eliminada.'),
      });
  }

  private hydrate(route: LearningRoute): void {
    this.name.set(route.name);
    this.description.set(route.description);
    this.objective.set(route.objective ?? '');
    this.coverImageUrl.set(route.coverImageUrl ?? '');
    this.difficulty.set(route.difficulty ?? '');
    this.estimatedDurationHours.set(route.estimatedDurationHours);
    this.technologies.set(route.technologies ?? '');
  }

  protected submit(): void {
    if (!this.canSubmit() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const payload = this.buildPayload();
    const id = this.routeId();
    const request$ = id !== null ? this.service.update(id, payload) : this.service.create(payload);
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.loaded.set(saved);
        if (id === null) {
          void this.router.navigate(['/instructor/routes', saved.id]);
        }
      },
      error: (err) => {
        const message = (err?.error?.message as string | undefined) ?? null;
        this.saveError.set(
          message ?? 'No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.',
        );
      },
    });
  }

  private buildPayload(): CreateLearningRouteRequest & UpdateLearningRouteRequest {
    return {
      name: this.name().trim(),
      description: this.description().trim(),
      objective: this.objective().trim() || null,
      coverImageUrl: this.coverImageUrl().trim() || null,
      difficulty: this.difficulty() || null,
      estimatedDurationHours: this.estimatedDurationHours(),
      technologies: this.technologies().trim() || null,
    };
  }
}
