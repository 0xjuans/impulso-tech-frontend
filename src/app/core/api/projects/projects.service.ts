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
  CreateProjectRequest,
  CreateSubmissionRequest,
  Project,
  ProjectSubmission,
  ProjectSubmissionStatus,
  ReviewSubmissionRequest,
  UpdateProjectRequest,
} from './project.dto';

/**
 * Servicio HTTP del módulo de proyectos (RF-023, RF-045).
 *
 * <p>Cubre el catálogo público para estudiantes, el panel de gestión de
 * instructores/administradores y la revisión de entregas mediante
 * {@code /api/project-submissions/{id}/review}.</p>
 */
@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Lista los proyectos publicados visibles para estudiantes. */
  listPublished(
    options: {
      search?: string;
      difficulty?: DifficultyLevel;
      learningRouteId?: number;
      courseId?: number;
      moduleId?: number;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<Project>> {
    return this.http.get<PagedResponse<Project>>(`${this.baseUrl}/projects`, {
      params: this.buildListParams(options),
    });
  }

  /**
   * Lista los proyectos en cualquier estado para el panel de gestión;
   * requiere rol {@code INSTRUCTOR} o {@code ADMINISTRADOR}.
   */
  listAllForManagement(
    options: {
      search?: string;
      difficulty?: DifficultyLevel;
      status?: ContentStatus;
      learningRouteId?: number;
      courseId?: number;
      moduleId?: number;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<Project>> {
    return this.http.get<PagedResponse<Project>>(`${this.baseUrl}/projects/manage`, {
      params: this.buildListParams(options),
    });
  }

  /** Consulta el detalle de un proyecto por id. */
  get(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.baseUrl}/projects/${id}`);
  }

  /** Crea un proyecto nuevo en estado BORRADOR. */
  create(payload: CreateProjectRequest): Observable<Project> {
    return this.http.post<Project>(`${this.baseUrl}/projects`, payload);
  }

  /** Actualiza parcialmente los campos editables de un proyecto. */
  update(id: number, payload: UpdateProjectRequest): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/projects/${id}`, payload);
  }

  /** Cambia el estado (BORRADOR/PUBLICADO/DESHABILITADO). */
  changeStatus(id: number, status: ContentStatus): Observable<Project> {
    return this.http.patch<Project>(`${this.baseUrl}/projects/${id}/status`, { status });
  }

  /** Elimina un proyecto (INSTRUCTOR o ADMINISTRADOR). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/projects/${id}`);
  }

  /** Envía una nueva entrega del estudiante. */
  submitEntry(
    projectId: number,
    payload: CreateSubmissionRequest,
  ): Observable<ProjectSubmission> {
    return this.http.post<ProjectSubmission>(
      `${this.baseUrl}/projects/${projectId}/submissions`,
      payload,
    );
  }

  /** Lista las entregas propias del estudiante autenticado. */
  listMySubmissions(projectId: number): Observable<readonly ProjectSubmission[]> {
    return this.http.get<ProjectSubmission[]>(
      `${this.baseUrl}/projects/${projectId}/submissions/mine`,
    );
  }

  /**
   * Lista las entregas recibidas por un proyecto para revisión. Solo
   * accesible para instructores y administradores.
   */
  listProjectSubmissions(
    projectId: number,
    options: { status?: ProjectSubmissionStatus; page?: number; size?: number } = {},
  ): Observable<PagedResponse<ProjectSubmission>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.status) params = params.set('status', options.status);
    return this.http.get<PagedResponse<ProjectSubmission>>(
      `${this.baseUrl}/projects/${projectId}/submissions`,
      { params },
    );
  }

  /** Aplica una revisión (estado + calificación + feedback) a una entrega. */
  reviewSubmission(
    submissionId: number,
    payload: ReviewSubmissionRequest,
  ): Observable<ProjectSubmission> {
    return this.http.patch<ProjectSubmission>(
      `${this.baseUrl}/project-submissions/${submissionId}/review`,
      payload,
    );
  }

  /**
   * Construye {@link HttpParams} para los listados omitiendo valores
   * {@code undefined}, {@code null} o cadena vacía. Concentra la lógica
   * para que los métodos públicos queden limpios.
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
