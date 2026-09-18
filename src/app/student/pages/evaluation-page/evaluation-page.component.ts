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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import {
  Evaluation,
  EvaluationAttempt,
  EvaluationQuestion,
} from '../../../core/api/evaluations/evaluation.dto';
import { EvaluationsService } from '../../../core/api/evaluations/evaluations.service';

/**
 * Presentación y toma de una evaluación por parte del estudiante
 * (RF-020, RF-046).
 *
 * <p>Muestra dos fases: (1) descripción e instrucciones con botón
 * "Iniciar intento" que crea un intento en el backend; (2) formulario
 * de respuestas por tipo de pregunta (selección múltiple, verdadero/
 * falso, respuesta corta) con envío final que devuelve el resultado
 * calificado. También lista el historial de intentos previos con su
 * porcentaje y aprobado/no aprobado.</p>
 *
 * <p>El backend evalúa las respuestas comparando con la configuración
 * privada de cada pregunta; el frontend nunca conoce la respuesta
 * correcta, solo el resultado final devuelto.</p>
 */
@Component({
  selector: 'app-student-evaluation-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './evaluation-page.component.html',
  styleUrl: './evaluation-page.component.scss',
})
export class EvaluationPageComponent implements OnInit {
  private readonly service = inject(EvaluationsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly evaluation = signal<Evaluation | null>(null);
  protected readonly attempts = signal<readonly EvaluationAttempt[]>([]);
  protected readonly currentAttempt = signal<EvaluationAttempt | null>(null);
  protected readonly lastResult = signal<EvaluationAttempt | null>(null);

  protected readonly starting = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  /**
   * Mapa de respuestas del estudiante indexado por id de pregunta.
   * Se serializa a JSON antes de enviarse al backend, siguiendo el
   * formato {@code { "<questionId>": <valor> }} que espera
   * {@code SubmitEvaluationRequest}. El valor concreto depende del tipo
   * de la pregunta (index numérico, booleano o texto).
   */
  protected readonly answers = signal<Record<string, number | string | boolean>>({});

  /** Cronómetro en segundos desde el inicio del intento actual. */
  protected readonly elapsedSeconds = signal(0);
  private timerHandle: ReturnType<typeof setInterval> | null = null;

  /**
   * Preguntas ordenadas por posición. Se toma del detalle devuelto por
   * el backend, que ya viene ordenado; se mantiene el orden estable
   * explícitamente para no depender de eso.
   */
  protected readonly orderedQuestions = computed<readonly EvaluationQuestion[]>(() => {
    const list = this.evaluation()?.questions ?? [];
    return [...list].sort((a, b) => a.orderIndex - b.orderIndex);
  });

  protected readonly hasAttemptInProgress = computed(() => this.currentAttempt() !== null);

  /** Se puede iniciar un nuevo intento si no hay uno activo y quedan intentos disponibles. */
  protected readonly canStart = computed(() => {
    const e = this.evaluation();
    if (!e || this.hasAttemptInProgress()) return false;
    const finished = this.attempts().filter((a) => a.finishedAt !== null).length;
    return finished < e.maxAttempts;
  });

  /** Todas las preguntas obligatorias tienen respuesta. */
  protected readonly canSubmit = computed(() => {
    const questions = this.orderedQuestions();
    if (questions.length === 0) return false;
    const a = this.answers();
    return questions.every((q) => {
      const v = a[String(q.id)];
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim().length > 0;
      return true;
    });
  });

  /** Historial ordenado del más reciente al más antiguo. */
  protected readonly sortedAttempts = computed(() =>
    [...this.attempts()].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    ),
  );

  /** Formatea el cronómetro como {@code MM:SS}. */
  protected readonly elapsedLabel = computed(() => {
    const s = this.elapsedSeconds();
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  });

  /**
   * Retorna las opciones de una pregunta de selección múltiple leyendo
   * su {@code config} JSON. Se hace de forma defensiva por si la
   * configuración estuviera malformada.
   */
  protected optionsFor(question: EvaluationQuestion): readonly string[] {
    try {
      const cfg = JSON.parse(question.config) as { options?: unknown };
      const raw = cfg.options;
      if (Array.isArray(raw)) return raw.map((v) => String(v));
    } catch {
      // Ignorado deliberadamente: se retorna lista vacía.
    }
    return [];
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error.set('La evaluación solicitada no existe.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.service
      .get(id)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar la evaluación. Puede haber sido retirada.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((evaluation) => {
        this.evaluation.set(evaluation);
        if (evaluation) this.loadAttempts(id);
      });
  }

  private loadAttempts(id: number): void {
    this.service.listMyAttempts(id).subscribe({
      next: (list) => this.attempts.set(list),
      error: () => this.attempts.set([]),
    });
  }

  protected startAttempt(): void {
    const e = this.evaluation();
    if (!e || this.starting() || this.hasAttemptInProgress()) return;
    this.starting.set(true);
    this.service
      .startAttempt(e.id)
      .pipe(finalize(() => this.starting.set(false)))
      .subscribe({
        next: (attempt) => {
          this.currentAttempt.set(attempt);
          this.answers.set({});
          this.lastResult.set(null);
          this.startTimer(attempt.startedAt);
        },
        error: () =>
          this.submitError.set(
            'No pudimos iniciar el intento. Es posible que ya hayas alcanzado el máximo permitido.',
          ),
      });
  }

  protected setAnswer(question: EvaluationQuestion, value: number | string | boolean): void {
    this.answers.update((prev) => ({ ...prev, [String(question.id)]: value }));
  }

  /**
   * Valor actual capturado para una pregunta; se usa para hidratar los
   * inputs del formulario. Devuelve {@code null} cuando aún no se
   * respondió.
   */
  protected answerOf(question: EvaluationQuestion): number | string | boolean | null {
    const v = this.answers()[String(question.id)];
    return v === undefined ? null : v;
  }

  protected submit(): void {
    const e = this.evaluation();
    if (!e || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    const payload = { answers: JSON.stringify(this.answers()) };
    this.service
      .submitAttempt(e.id, payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (result) => {
          this.lastResult.set(result);
          this.currentAttempt.set(null);
          this.stopTimer();
          this.attempts.update((list) => [result, ...list.filter((a) => a.id !== result.id)]);
        },
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.submitError.set(
            message ??
              'No pudimos enviar tus respuestas. Inténtalo nuevamente en unos segundos.',
          );
        },
      });
  }

  private startTimer(startedAt: string): void {
    this.stopTimer();
    const startMs = new Date(startedAt).getTime();
    const tick = () => this.elapsedSeconds.set(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    this.timerHandle = setInterval(tick, 1000);
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
