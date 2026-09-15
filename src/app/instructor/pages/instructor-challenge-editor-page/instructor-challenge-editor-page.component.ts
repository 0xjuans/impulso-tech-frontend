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
  Challenge,
  CreateChallengeRequest,
  UpdateChallengeRequest,
} from '../../../core/api/challenges/challenge.dto';
import { ChallengesService } from '../../../core/api/challenges/challenges.service';
import { DifficultyLevel } from '../../../core/api/learning-routes/learning-route.dto';

/**
 * Editor de un reto (RF-013).
 *
 * <p>Trabaja en dos modos: creación en {@code /instructor/challenges/new}
 * y edición en {@code /instructor/challenges/:id}. En creación redirige
 * al editor con el id recién creado para poder seguir enriqueciendo el
 * reto (casos de prueba ocultos, restricciones, etc.).</p>
 */
@Component({
  selector: 'app-instructor-challenge-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink, RichTextEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-challenge-editor-page.component.html',
  styleUrl: './instructor-challenge-editor-page.component.scss',
})
export class InstructorChallengeEditorPageComponent implements OnInit {
  private readonly service = inject(ChallengesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly challengeId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loaded = signal<Challenge | null>(null);

  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly objective = signal('');
  protected readonly instructions = signal('');
  protected readonly difficulty = signal<DifficultyLevel | ''>('');
  protected readonly allowedLanguages = signal('');
  protected readonly ioExamples = signal('');
  protected readonly restrictions = signal('');
  protected readonly publicTestCases = signal('');
  protected readonly hiddenTestCases = signal('');
  protected readonly xpReward = signal<number | null>(null);
  protected readonly estimatedMinutes = signal<number | null>(null);
  protected readonly learningRouteId = signal<number | null>(null);
  protected readonly courseId = signal<number | null>(null);
  protected readonly moduleId = signal<number | null>(null);
  protected readonly lessonId = signal<number | null>(null);

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  protected readonly isEditing = computed(() => this.challengeId() !== null);

  /**
   * Al crear se exigen los campos que el backend valida como
   * obligatorios: nombre, descripción, dificultad y lenguajes
   * permitidos. Al editar basta con que el nombre siga presente para
   * que el usuario pueda vaciar temporalmente otro campo sin bloquear
   * el guardado.
   */
  protected readonly canSubmit = computed(() => {
    if (this.isEditing()) return this.name().trim().length > 0;
    return (
      this.name().trim().length > 0 &&
      this.description().trim().length > 0 &&
      this.difficulty().length > 0 &&
      this.allowedLanguages().trim().length > 0
    );
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      const id = Number(idParam);
      if (!Number.isFinite(id)) {
        this.error.set('El reto solicitado no existe.');
        return;
      }
      this.challengeId.set(id);
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
        next: (challenge) => {
          this.loaded.set(challenge);
          this.hydrate(challenge);
        },
        error: () => this.error.set('No pudimos cargar el reto. Puede haber sido eliminado.'),
      });
  }

  private hydrate(c: Challenge): void {
    this.name.set(c.name);
    this.description.set(c.description);
    this.objective.set(c.objective ?? '');
    this.instructions.set(c.instructions ?? '');
    this.difficulty.set(c.difficulty);
    this.allowedLanguages.set(c.allowedLanguages);
    this.ioExamples.set(c.ioExamples ?? '');
    this.restrictions.set(c.restrictions ?? '');
    this.publicTestCases.set(c.publicTestCases ?? '');
    this.hiddenTestCases.set(c.hiddenTestCases ?? '');
    this.xpReward.set(c.xpReward);
    this.estimatedMinutes.set(c.estimatedMinutes);
    this.learningRouteId.set(c.learningRouteId);
    this.courseId.set(c.courseId);
    this.moduleId.set(c.moduleId);
    this.lessonId.set(c.lessonId);
  }

  protected submit(): void {
    if (!this.canSubmit() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const id = this.challengeId();
    const request$ = id !== null
      ? this.service.update(id, this.buildUpdatePayload())
      : this.service.create(this.buildCreatePayload());
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.loaded.set(saved);
        if (id === null) void this.router.navigate(['/instructor/challenges', saved.id]);
      },
      error: (err) => {
        const message = (err?.error?.message as string | undefined) ?? null;
        this.saveError.set(
          message ?? 'No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.',
        );
      },
    });
  }

  private buildCreatePayload(): CreateChallengeRequest {
    // En creación difficulty y allowedLanguages están garantizados por canSubmit.
    return {
      name: this.name().trim(),
      description: this.description().trim(),
      objective: this.objective().trim() || null,
      instructions: this.instructions().trim() || null,
      difficulty: this.difficulty() as DifficultyLevel,
      allowedLanguages: this.allowedLanguages().trim(),
      ioExamples: this.ioExamples().trim() || null,
      restrictions: this.restrictions().trim() || null,
      publicTestCases: this.publicTestCases().trim() || null,
      hiddenTestCases: this.hiddenTestCases().trim() || null,
      xpReward: this.xpReward(),
      estimatedMinutes: this.estimatedMinutes(),
      learningRouteId: this.learningRouteId(),
      courseId: this.courseId(),
      moduleId: this.moduleId(),
      lessonId: this.lessonId(),
    };
  }

  private buildUpdatePayload(): UpdateChallengeRequest {
    return {
      name: this.name().trim(),
      description: this.description().trim(),
      objective: this.objective().trim() || null,
      instructions: this.instructions().trim() || null,
      difficulty: (this.difficulty() || null) as DifficultyLevel | null,
      allowedLanguages: this.allowedLanguages().trim() || undefined,
      ioExamples: this.ioExamples().trim() || null,
      restrictions: this.restrictions().trim() || null,
      publicTestCases: this.publicTestCases().trim() || null,
      hiddenTestCases: this.hiddenTestCases().trim() || null,
      xpReward: this.xpReward(),
      estimatedMinutes: this.estimatedMinutes(),
      learningRouteId: this.learningRouteId(),
      courseId: this.courseId(),
      moduleId: this.moduleId(),
      lessonId: this.lessonId(),
    };
  }
}
