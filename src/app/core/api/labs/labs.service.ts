import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import {
  ExecuteCodeRequest,
  ExecutionResult,
  Lab,
  LabRequest,
  LabSubmission,
} from './lab.dto';

/**
 * Servicio HTTP del módulo de laboratorios (RF-053).
 *
 * <p>La búsqueda paginada devuelve resultados adaptados al rol: los
 * estudiantes ven solo laboratorios publicados, mientras que
 * instructores y administradores ven todos los suyos o toda la
 * plataforma. Por eso no existe un endpoint {@code /manage}: el
 * backend se encarga de filtrar por rol.</p>
 */
@Injectable({ providedIn: 'root' })
export class LabsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/labs`;

  /**
   * Búsqueda paginada. Se omite cualquier filtro vacío para no
   * enviar cadenas triviales al backend.
   */
  search(
    options: {
      q?: string;
      language?: string;
      courseId?: number;
      page?: number;
      size?: number;
    } = {},
  ): Observable<PagedResponse<Lab>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.q) params = params.set('q', options.q);
    if (options.language) params = params.set('language', options.language);
    if (options.courseId != null) params = params.set('courseId', options.courseId);
    return this.http.get<PagedResponse<Lab>>(this.baseUrl, { params });
  }

  /** Recupera el detalle de un laboratorio. */
  get(id: number): Observable<Lab> {
    return this.http.get<Lab>(`${this.baseUrl}/${id}`);
  }

  /** Crea un laboratorio nuevo con el usuario autenticado como propietario. */
  create(payload: LabRequest): Observable<Lab> {
    return this.http.post<Lab>(this.baseUrl, payload);
  }

  /** Reemplaza los campos editables de un laboratorio existente. */
  update(id: number, payload: LabRequest): Observable<Lab> {
    return this.http.put<Lab>(`${this.baseUrl}/${id}`, payload);
  }

  /** Elimina un laboratorio. */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Ejecuta código de prueba en el sandbox sin persistir la entrega. */
  tryExecute(id: number, payload: ExecuteCodeRequest): Observable<ExecutionResult> {
    return this.http.post<ExecutionResult>(`${this.baseUrl}/${id}/executions`, payload);
  }

  /** Envía una entrega definitiva del estudiante. */
  submit(id: number, payload: ExecuteCodeRequest): Observable<LabSubmission> {
    return this.http.post<LabSubmission>(`${this.baseUrl}/${id}/submissions`, payload);
  }

  /** Lista las entregas propias del estudiante autenticado. */
  listMySubmissions(id: number): Observable<readonly LabSubmission[]> {
    return this.http.get<LabSubmission[]>(`${this.baseUrl}/${id}/submissions/mine`);
  }
}
