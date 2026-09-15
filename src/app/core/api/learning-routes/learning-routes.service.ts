import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ContentStatus,
  CreateLearningRouteRequest,
  DifficultyLevel,
  LearningRoute,
  PagedResponse,
  UpdateContentStatusRequest,
  UpdateLearningRouteRequest,
} from './learning-route.dto';

/**
 * Servicio HTTP para el módulo de rutas de aprendizaje (RF-008, RF-009).
 *
 * <p>Cubre tanto el consumo público (listado de rutas publicadas para
 * estudiantes) como la administración (creación, edición y cambio de
 * estado) requerida por instructores y administradores. Todas las
 * operaciones apuntan a {@code /api/learning-routes} y devuelven el
 * mismo contrato tipado utilizado por el frontend.</p>
 */
@Injectable({ providedIn: 'root' })
export class LearningRoutesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/learning-routes`;

  /** Lista las rutas publicadas y disponibles para los estudiantes. */
  listPublished(
    options: {
      search?: string;
      difficulty?: DifficultyLevel;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<LearningRoute>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 12);
    if (options.search) params = params.set('search', options.search);
    if (options.difficulty) params = params.set('difficulty', options.difficulty);
    return this.http.get<PagedResponse<LearningRoute>>(this.baseUrl, { params });
  }

  /**
   * Lista las rutas en cualquier estado. Solo accesible para usuarios
   * con rol {@code INSTRUCTOR} o {@code ADMINISTRADOR}; el backend
   * responde 403 al resto.
   */
  listAllForManagement(
    options: {
      search?: string;
      difficulty?: DifficultyLevel;
      status?: ContentStatus;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<LearningRoute>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.search) params = params.set('search', options.search);
    if (options.difficulty) params = params.set('difficulty', options.difficulty);
    if (options.status) params = params.set('status', options.status);
    return this.http.get<PagedResponse<LearningRoute>>(`${this.baseUrl}/manage`, { params });
  }

  /** Recupera el detalle de una ruta de aprendizaje concreta. */
  get(id: number): Observable<LearningRoute> {
    return this.http.get<LearningRoute>(`${this.baseUrl}/${id}`);
  }

  /** Crea una ruta nueva en estado BORRADOR. */
  create(payload: CreateLearningRouteRequest): Observable<LearningRoute> {
    return this.http.post<LearningRoute>(this.baseUrl, payload);
  }

  /** Actualiza parcialmente los campos editables de una ruta. */
  update(id: number, payload: UpdateLearningRouteRequest): Observable<LearningRoute> {
    return this.http.patch<LearningRoute>(`${this.baseUrl}/${id}`, payload);
  }

  /** Cambia el estado (BORRADOR, PUBLICADO, DESHABILITADO) de una ruta. */
  changeStatus(id: number, status: ContentStatus): Observable<LearningRoute> {
    const payload: UpdateContentStatusRequest = { status };
    return this.http.patch<LearningRoute>(`${this.baseUrl}/${id}/status`, payload);
  }
}
