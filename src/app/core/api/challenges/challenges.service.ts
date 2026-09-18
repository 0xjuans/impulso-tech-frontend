import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ContentStatus,
  DifficultyLevel,
  PagedResponse,
} from '../learning-routes/learning-route.dto';
import {
  Challenge,
  ChallengeAttempt,
  ChallengeAttemptStatus,
  CreateChallengeRequest,
  ReviewChallengeAttemptRequest,
  SubmitChallengeAttemptRequest,
  UpdateChallengeRequest,
} from './challenge.dto';

/**
 * Servicio HTTP para el módulo de retos (RF-013, RF-037, RF-038).
 *
 * <p>Centraliza el consumo de {@code /api/challenges} y del endpoint
 * de revisión {@code /api/challenge-attempts/{id}/review}. Expone las
 * operaciones de lectura para estudiantes, gestión para instructores y
 * revisión de intentos.</p>
 */
@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Lista retos publicados con filtros opcionales para estudiantes. */
  listPublished(
    options: {
      search?: string;
      difficulty?: DifficultyLevel;
      language?: string;
      learningRouteId?: number;
      courseId?: number;
      moduleId?: number;
      lessonId?: number;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<Challenge>> {
    return this.http.get<PagedResponse<Challenge>>(`${this.baseUrl}/challenges`, {
      params: this.buildListParams(options),
    });
  }

  /**
   * Lista todos los retos (cualquier estado) para el panel de gestión
   * de instructores y administradores.
   */
  listAllForManagement(
    options: {
      search?: string;
      difficulty?: DifficultyLevel;
      status?: ContentStatus;
      language?: string;
      learningRouteId?: number;
      courseId?: number;
      moduleId?: number;
      lessonId?: number;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<Challenge>> {
    return this.http.get<PagedResponse<Challenge>>(`${this.baseUrl}/challenges/manage`, {
      params: this.buildListParams(options),
    });
  }

  /** Consulta el detalle de un reto por id. */
  get(id: number): Observable<Challenge> {
    return this.http.get<Challenge>(`${this.baseUrl}/challenges/${id}`);
  }

  /** Crea un nuevo reto en estado BORRADOR. */
  create(payload: CreateChallengeRequest): Observable<Challenge> {
    return this.http.post<Challenge>(`${this.baseUrl}/challenges`, payload);
  }

  /** Aplica cambios parciales a un reto existente. */
  update(id: number, payload: UpdateChallengeRequest): Observable<Challenge> {
    return this.http.patch<Challenge>(`${this.baseUrl}/challenges/${id}`, payload);
  }

  /** Cambia el ciclo de vida (BORRADOR/PUBLICADO/DESHABILITADO) del reto. */
  changeStatus(id: number, status: ContentStatus): Observable<Challenge> {
    return this.http.patch<Challenge>(`${this.baseUrl}/challenges/${id}/status`, { status });
  }

  /** Elimina un reto de forma definitiva (solo instructor/administrador). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/challenges/${id}`);
  }

  /** Envía un intento de solución (estudiante). */
  submitAttempt(
    challengeId: number,
    payload: SubmitChallengeAttemptRequest,
  ): Observable<ChallengeAttempt> {
    return this.http.post<ChallengeAttempt>(
      `${this.baseUrl}/challenges/${challengeId}/attempts`,
      payload,
    );
  }

  /** Lista los intentos propios del estudiante autenticado. */
  listMyAttempts(challengeId: number): Observable<readonly ChallengeAttempt[]> {
    return this.http.get<ChallengeAttempt[]>(
      `${this.baseUrl}/challenges/${challengeId}/attempts/mine`,
    );
  }

  /**
   * Lista los intentos recibidos por un reto para su revisión por parte
   * del instructor. Permite filtrar por estado (típicamente PENDIENTE).
   */
  listChallengeAttempts(
    challengeId: number,
    options: { status?: ChallengeAttemptStatus; page?: number; size?: number } = {},
  ): Observable<PagedResponse<ChallengeAttempt>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.status) params = params.set('status', options.status);
    return this.http.get<PagedResponse<ChallengeAttempt>>(
      `${this.baseUrl}/challenges/${challengeId}/attempts`,
      { params },
    );
  }

  /** Aplica una revisión (APROBADO / RECHAZADO + feedback) a un intento. */
  reviewAttempt(
    attemptId: number,
    payload: ReviewChallengeAttemptRequest,
  ): Observable<ChallengeAttempt> {
    return this.http.patch<ChallengeAttempt>(
      `${this.baseUrl}/challenge-attempts/${attemptId}/review`,
      payload,
    );
  }

  /**
   * Construye los {@link HttpParams} comunes de los endpoints de listado
   * omitiendo los valores que llegan como {@code undefined} o cadena
   * vacía. Mantiene la firma flexible sin acumular ramas condicionales
   * en cada llamador.
   */
  private buildListParams(options: Record<string, unknown>): HttpParams {
    let params = new HttpParams()
      .set('page', (options['page'] as number | undefined) ?? 0)
      .set('size', (options['size'] as number | undefined) ?? 20);
    for (const [key, value] of Object.entries(options)) {
      if (key === 'page' || key === 'size') continue;
      if (value === undefined || value === null || value === '') continue;
      params = params.set(key, String(value));
    }
    return params;
  }
}
