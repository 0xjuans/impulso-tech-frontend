import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ContentStatus } from '../learning-routes/learning-route.dto';
import {
  CreateEvaluationQuestionRequest,
  CreateEvaluationRequest,
  Evaluation,
  EvaluationAttempt,
  SubmitEvaluationRequest,
  UpdateEvaluationRequest,
} from './evaluation.dto';

/**
 * Servicio HTTP del módulo de evaluaciones (RF-020, RF-046).
 *
 * <p>Cubre la gestión desde el instructor y los intentos del
 * estudiante. Las evaluaciones no tienen listado global: siempre se
 * consultan por lección, alineado con el contrato del backend.</p>
 */
@Injectable({ providedIn: 'root' })
export class EvaluationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Lista todas las evaluaciones asociadas a la lección indicada. */
  listByLesson(lessonId: number): Observable<readonly Evaluation[]> {
    return this.http.get<Evaluation[]>(`${this.baseUrl}/lessons/${lessonId}/evaluations`);
  }

  /** Recupera el detalle completo de una evaluación (incluye preguntas). */
  get(evaluationId: number): Observable<Evaluation> {
    return this.http.get<Evaluation>(`${this.baseUrl}/evaluations/${evaluationId}`);
  }

  /** Crea una nueva evaluación dentro de la lección indicada. */
  create(lessonId: number, payload: CreateEvaluationRequest): Observable<Evaluation> {
    return this.http.post<Evaluation>(
      `${this.baseUrl}/lessons/${lessonId}/evaluations`,
      payload,
    );
  }

  /** Actualiza los campos editables de una evaluación existente. */
  update(evaluationId: number, payload: UpdateEvaluationRequest): Observable<Evaluation> {
    return this.http.patch<Evaluation>(
      `${this.baseUrl}/evaluations/${evaluationId}`,
      payload,
    );
  }

  /** Cambia el estado (BORRADOR/PUBLICADO/DESHABILITADO). */
  changeStatus(evaluationId: number, status: ContentStatus): Observable<Evaluation> {
    return this.http.patch<Evaluation>(
      `${this.baseUrl}/evaluations/${evaluationId}/status`,
      { status },
    );
  }

  /** Elimina la evaluación completa (preguntas e intentos incluidos). */
  delete(evaluationId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/evaluations/${evaluationId}`);
  }

  /** Agrega una pregunta al final o en la posición indicada. */
  addQuestion(
    evaluationId: number,
    payload: CreateEvaluationQuestionRequest,
  ): Observable<Evaluation> {
    return this.http.post<Evaluation>(
      `${this.baseUrl}/evaluations/${evaluationId}/questions`,
      payload,
    );
  }

  /** Elimina una pregunta específica. */
  deleteQuestion(questionId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/evaluation-questions/${questionId}`);
  }

  /** Inicia un intento (o recupera el en curso) del estudiante. */
  startAttempt(evaluationId: number): Observable<EvaluationAttempt> {
    return this.http.post<EvaluationAttempt>(
      `${this.baseUrl}/evaluations/${evaluationId}/attempts`,
      {},
    );
  }

  /** Envía las respuestas y finaliza el intento. */
  submitAttempt(
    evaluationId: number,
    payload: SubmitEvaluationRequest,
  ): Observable<EvaluationAttempt> {
    return this.http.post<EvaluationAttempt>(
      `${this.baseUrl}/evaluations/${evaluationId}/attempts/submit`,
      payload,
    );
  }

  /** Lista los intentos finalizados del estudiante autenticado. */
  listMyAttempts(evaluationId: number): Observable<readonly EvaluationAttempt[]> {
    return this.http.get<EvaluationAttempt[]>(
      `${this.baseUrl}/evaluations/${evaluationId}/attempts`,
    );
  }
}
