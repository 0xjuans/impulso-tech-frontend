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

import {
  CreateProjectRequest,
  Project,
  UpdateProjectRequest,
} from '../../../core/api/projects/project.dto';
import { ProjectsService } from '../../../core/api/projects/projects.service';
import { DifficultyLevel } from '../../../core/api/learning-routes/learning-route.dto';
import {
  ContentContextPickerComponent,
  ContentContextValue,
} from '../../../shared/components/content-context-picker/content-context-picker.component';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';

/**
 * Editor de proyectos (RF-023).
 *
 * <p>Modo creación en {@code /instructor/projects/new} y edición en
 * {@code /instructor/projects/:id}. Los campos narrativos utilizan el
 * editor de texto enriquecido; los identificadores de relación con
 * ruta/curso/módulo son numéricos, congruentes con la forma actual del
 * backend.</p>
 */
@Component({
  selector: 'app-instructor-project-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink, RichTextEditorComponent, ContentContextPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-project-editor-page.component.html',
  styleUrl: './instructor-project-editor-page.component.scss',
})
export class InstructorProjectEditorPageComponent implements OnInit {
  private readonly service = inject(ProjectsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly projectId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loaded = signal<Project | null>(null);

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly objective = signal('');
  protected readonly instructions = signal('');
  protected readonly requirements = signal('');
  protected readonly difficulty = signal<DifficultyLevel | ''>('');
  protected readonly technologies = signal('');
  protected readonly resources = signal('');
  protected readonly evaluationCriteria = signal('');
  protected readonly maxScore = signal<number | null>(100);
  protected readonly xpReward = signal<number | null>(100);
  /** Fecha ISO local en formato yyyy-MM-ddTHH:mm para el input datetime-local. */
  protected readonly deadlineAt = signal('');
  protected readonly learningRouteId = signal<number | null>(null);
  protected readonly courseId = signal<number | null>(null);
  protected readonly moduleId = signal<number | null>(null);

  /** Vista agregada del contexto para el picker reutilizable. */
  protected readonly contextValue = computed<ContentContextValue>(() => ({
    learningRouteId: this.learningRouteId(),
    courseId: this.courseId(),
    moduleId: this.moduleId(),
    lessonId: null,
  }));

  protected onContextChange(value: ContentContextValue): void {
    this.learningRouteId.set(value.learningRouteId);
    this.courseId.set(value.courseId);
    this.moduleId.set(value.moduleId);
  }

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  protected readonly isEditing = computed(() => this.projectId() !== null);

  /**
   * En creación se exige el mismo mínimo que valida el backend:
   * nombre, descripción y dificultad. En edición basta con el nombre
   * para permitir ajustes puntuales.
   */
  protected readonly canSubmit = computed(() => {
    if (this.isEditing()) return this.name().trim().length > 0;
    return (
      this.name().trim().length > 0 &&
      this.description().trim().length > 0 &&
      this.difficulty().length > 0
    );
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        this.error.set('El proyecto solicitado no existe.');
        return;
      }
      this.projectId.set(id);
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
        next: (project) => {
          this.loaded.set(project);
          this.hydrate(project);
        },
        error: () =>
          this.error.set('No pudimos cargar el proyecto. Puede haber sido eliminado.'),
      });
  }

  private hydrate(p: Project): void {
    this.name.set(p.name);
    this.description.set(p.description);
    this.objective.set(p.objective ?? '');
    this.instructions.set(p.instructions ?? '');
    this.requirements.set(p.requirements ?? '');
    this.difficulty.set(p.difficulty);
    this.technologies.set(p.technologies ?? '');
    this.resources.set(p.resources ?? '');
    this.evaluationCriteria.set(p.evaluationCriteria ?? '');
    this.maxScore.set(p.maxScore);
    this.xpReward.set(p.xpReward);
    this.deadlineAt.set(this.toInputDate(p.deadlineAt));
    this.learningRouteId.set(p.learningRouteId);
    this.courseId.set(p.courseId);
    this.moduleId.set(p.moduleId);
  }

  protected submit(): void {
    if (!this.canSubmit() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const id = this.projectId();
    const request$ = id !== null
      ? this.service.update(id, this.buildUpdatePayload())
      : this.service.create(this.buildCreatePayload());
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.loaded.set(saved);
        if (id === null) void this.router.navigate(['/instructor/projects', saved.id]);
      },
      error: (err) => {
        const message = (err?.error?.message as string | undefined) ?? null;
        this.saveError.set(
          message ?? 'No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.',
        );
      },
    });
  }

  private buildCreatePayload(): CreateProjectRequest {
    return {
      name: this.name().trim(),
      description: this.description().trim(),
      objective: this.objective().trim() || null,
      instructions: this.instructions().trim() || null,
      requirements: this.requirements().trim() || null,
      difficulty: this.difficulty() as DifficultyLevel,
      technologies: this.technologies().trim() || null,
      resources: this.resources().trim() || null,
      evaluationCriteria: this.evaluationCriteria().trim() || null,
      maxScore: this.maxScore(),
      xpReward: this.xpReward(),
      deadlineAt: this.fromInputDate(this.deadlineAt()),
      learningRouteId: this.learningRouteId(),
      courseId: this.courseId(),
      moduleId: this.moduleId(),
    };
  }

  private buildUpdatePayload(): UpdateProjectRequest {
    return {
      name: this.name().trim(),
      description: this.description().trim(),
      objective: this.objective().trim() || null,
      instructions: this.instructions().trim() || null,
      requirements: this.requirements().trim() || null,
      difficulty: (this.difficulty() || null) as DifficultyLevel | null,
      technologies: this.technologies().trim() || null,
      resources: this.resources().trim() || null,
      evaluationCriteria: this.evaluationCriteria().trim() || null,
      maxScore: this.maxScore(),
      xpReward: this.xpReward(),
      deadlineAt: this.fromInputDate(this.deadlineAt()),
      learningRouteId: this.learningRouteId(),
      courseId: this.courseId(),
      moduleId: this.moduleId(),
    };
  }

  /** Convierte ISO string del backend a formato aceptado por datetime-local. */
  private toInputDate(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    // yyyy-MM-ddTHH:mm en zona local
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /** Convierte el valor de datetime-local a ISO 8601; vacío devuelve null. */
  private fromInputDate(value: string): string | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
}
