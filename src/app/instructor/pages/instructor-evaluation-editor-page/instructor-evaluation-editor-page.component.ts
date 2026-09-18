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
  CreateEvaluationQuestionRequest,
  CreateEvaluationRequest,
  Evaluation,
  EvaluationQuestion,
  EvaluationQuestionType,
  UpdateEvaluationRequest,
} from '../../../core/api/evaluations/evaluation.dto';
import { EvaluationsService } from '../../../core/api/evaluations/evaluations.service';
import { RichTextEditorComponent } from '../../../shared/components/rich-text-editor/rich-text-editor.component';

/**
 * Editor de evaluación (RF-020).
 *
 * <p>Trabaja en dos modos: creación bajo la lección indicada por
 * {@code /instructor/evaluations/lessons/:lessonId/new} y edición en
 * {@code /instructor/evaluations/:id}. En edición permite además
 * gestionar las preguntas (agregar y eliminar) usando el editor de
 * texto enriquecido para el enunciado y un formulario específico por
 * tipo de pregunta.</p>
 */
@Component({
  selector: 'app-instructor-evaluation-editor-page',
  standalone: true,
  imports: [FormsModule, RouterLink, RichTextEditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-evaluation-editor-page.component.html',
  styleUrl: './instructor-evaluation-editor-page.component.scss',
})
export class InstructorEvaluationEditorPageComponent implements OnInit {
  private readonly service = inject(EvaluationsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly evaluationId = signal<number | null>(null);
  protected readonly lessonId = signal<number | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly loaded = signal<Evaluation | null>(null);

  // Campos de la evaluación --------------------------------------------
  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly instructions = signal('');
  protected readonly timeLimitMinutes = signal<number | null>(null);
  protected readonly passingPercentage = signal<number | null>(60);
  protected readonly maxAttempts = signal<number | null>(1);
  protected readonly orderIndex = signal<number | null>(1);

  // Formulario para agregar una nueva pregunta -------------------------
  protected readonly questionType = signal<EvaluationQuestionType>('SELECCION_MULTIPLE');
  protected readonly questionText = signal('');
  protected readonly questionScore = signal<number>(1);
  protected readonly questionOptions = signal<string[]>(['', '', '', '']);
  protected readonly questionCorrectIndex = signal<number>(0);
  protected readonly questionBoolAnswer = signal<boolean>(true);
  protected readonly questionExpected = signal('');
  protected readonly questionCaseSensitive = signal<boolean>(false);
  protected readonly addingQuestion = signal(false);
  protected readonly questionError = signal<string | null>(null);
  protected readonly pendingDeleteId = signal<number | null>(null);

  protected readonly types: readonly EvaluationQuestionType[] = [
    'SELECCION_MULTIPLE',
    'VERDADERO_FALSO',
    'RESPUESTA_CORTA',
  ];

  protected readonly isEditing = computed(() => this.evaluationId() !== null);

  protected readonly canSubmit = computed(() => this.name().trim().length > 0);

  protected readonly canAddQuestion = computed(() => {
    if (this.questionText().trim().length === 0 || this.questionScore() <= 0) return false;
    if (this.questionType() === 'SELECCION_MULTIPLE') {
      const opts = this.questionOptions().map((o) => o.trim()).filter((o) => o.length > 0);
      return opts.length >= 2 && this.questionCorrectIndex() < opts.length;
    }
    if (this.questionType() === 'RESPUESTA_CORTA') {
      return this.questionExpected().trim().length > 0;
    }
    return true;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const lesson = this.route.snapshot.paramMap.get('lessonId');
    if (id) {
      const n = Number(id);
      if (!Number.isFinite(n)) {
        this.error.set('La evaluación solicitada no existe.');
        return;
      }
      this.evaluationId.set(n);
      this.load(n);
    } else if (lesson) {
      const n = Number(lesson);
      if (!Number.isFinite(n)) {
        this.error.set('La lección solicitada no existe.');
        return;
      }
      this.lessonId.set(n);
    }
  }

  private load(id: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (evaluation) => {
          this.loaded.set(evaluation);
          this.lessonId.set(evaluation.lessonId);
          this.hydrate(evaluation);
        },
        error: () =>
          this.error.set('No pudimos cargar la evaluación. Puede haber sido eliminada.'),
      });
  }

  private hydrate(e: Evaluation): void {
    this.name.set(e.name);
    this.description.set(e.description ?? '');
    this.instructions.set(e.instructions ?? '');
    this.timeLimitMinutes.set(e.timeLimitMinutes);
    this.passingPercentage.set(e.passingPercentage);
    this.maxAttempts.set(e.maxAttempts);
    this.orderIndex.set(e.orderIndex);
  }

  protected submit(): void {
    if (!this.canSubmit() || this.saving()) return;
    this.saving.set(true);
    this.saveError.set(null);
    const id = this.evaluationId();
    const lesson = this.lessonId();
    let request$;
    if (id !== null) {
      request$ = this.service.update(id, this.buildUpdatePayload());
    } else if (lesson !== null) {
      request$ = this.service.create(lesson, this.buildCreatePayload());
    } else {
      this.saveError.set('Falta especificar la lección para crear la evaluación.');
      this.saving.set(false);
      return;
    }
    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (saved) => {
        this.loaded.set(saved);
        if (id === null) void this.router.navigate(['/instructor/evaluations', saved.id]);
      },
      error: (err) => {
        const message = (err?.error?.message as string | undefined) ?? null;
        this.saveError.set(
          message ?? 'No pudimos guardar los cambios. Revisa los datos e inténtalo nuevamente.',
        );
      },
    });
  }

  protected addQuestion(): void {
    const id = this.evaluationId();
    if (id === null || !this.canAddQuestion() || this.addingQuestion()) return;
    this.addingQuestion.set(true);
    this.questionError.set(null);
    const evaluation = this.loaded();
    const nextOrder = evaluation
      ? evaluation.questions.length + 1
      : 1;
    const payload: CreateEvaluationQuestionRequest = {
      orderIndex: nextOrder,
      type: this.questionType(),
      questionText: this.questionText().trim(),
      score: this.questionScore(),
      config: this.buildQuestionConfig(),
    };
    this.service
      .addQuestion(id, payload)
      .pipe(finalize(() => this.addingQuestion.set(false)))
      .subscribe({
        next: (updated) => {
          this.loaded.set(updated);
          this.resetQuestionForm();
        },
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.questionError.set(message ?? 'No pudimos agregar la pregunta.');
        },
      });
  }

  protected deleteQuestion(question: EvaluationQuestion): void {
    const id = this.evaluationId();
    if (id === null) return;
    const confirmed = window.confirm('¿Eliminar esta pregunta?');
    if (!confirmed) return;
    this.pendingDeleteId.set(question.id);
    this.service
      .deleteQuestion(question.id)
      .pipe(finalize(() => this.pendingDeleteId.set(null)))
      .subscribe({
        next: () => {
          // Se re-consulta para obtener el orden actualizado real.
          this.load(id);
        },
        error: () => this.questionError.set('No pudimos eliminar la pregunta.'),
      });
  }

  protected setOption(index: number, value: string): void {
    this.questionOptions.update((opts) => opts.map((o, i) => (i === index ? value : o)));
  }

  private resetQuestionForm(): void {
    this.questionText.set('');
    this.questionScore.set(1);
    this.questionOptions.set(['', '', '', '']);
    this.questionCorrectIndex.set(0);
    this.questionBoolAnswer.set(true);
    this.questionExpected.set('');
    this.questionCaseSensitive.set(false);
    this.questionType.set('SELECCION_MULTIPLE');
    this.questionError.set(null);
  }

  private buildCreatePayload(): CreateEvaluationRequest {
    return {
      name: this.name().trim(),
      description: this.description().trim() || null,
      instructions: this.instructions().trim() || null,
      timeLimitMinutes: this.timeLimitMinutes(),
      passingPercentage: this.passingPercentage(),
      maxAttempts: this.maxAttempts(),
      orderIndex: this.orderIndex(),
    };
  }

  private buildUpdatePayload(): UpdateEvaluationRequest {
    return {
      name: this.name().trim(),
      description: this.description().trim() || null,
      instructions: this.instructions().trim() || null,
      timeLimitMinutes: this.timeLimitMinutes(),
      passingPercentage: this.passingPercentage(),
      maxAttempts: this.maxAttempts(),
      orderIndex: this.orderIndex(),
    };
  }

  /**
   * Serializa la configuración de la pregunta según el tipo. El backend
   * la almacena tal cual como cadena JSON.
   */
  private buildQuestionConfig(): string {
    switch (this.questionType()) {
      case 'SELECCION_MULTIPLE': {
        const options = this.questionOptions().map((o) => o.trim()).filter((o) => o.length > 0);
        return JSON.stringify({ options, correctIndex: this.questionCorrectIndex() });
      }
      case 'VERDADERO_FALSO':
        return JSON.stringify({ correct: this.questionBoolAnswer() });
      case 'RESPUESTA_CORTA':
        return JSON.stringify({
          expected: this.questionExpected().trim(),
          caseSensitive: this.questionCaseSensitive(),
        });
    }
  }

  /** Devuelve una vista amigable de la configuración de una pregunta. */
  protected describeQuestion(question: EvaluationQuestion): string {
    try {
      const cfg = JSON.parse(question.config) as Record<string, unknown>;
      if (question.type === 'SELECCION_MULTIPLE') {
        const opts = (cfg['options'] as string[] | undefined) ?? [];
        const idx = cfg['correctIndex'] as number | undefined;
        if (idx === undefined || opts[idx] === undefined) {
          return `${opts.length} opciones`;
        }
        return `${opts.length} opciones · correcta: "${opts[idx]}"`;
      }
      if (question.type === 'VERDADERO_FALSO') {
        return `Respuesta correcta: ${cfg['correct'] ? 'Verdadero' : 'Falso'}`;
      }
      if (question.type === 'RESPUESTA_CORTA') {
        return `Respuesta esperada: "${cfg['expected']}"`;
      }
    } catch {
      // Config inválido: mostramos el bruto para que el instructor lo corrija.
    }
    return question.config;
  }
}
