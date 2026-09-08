import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { LearningRoute, PagedResponse } from './learning-route.dto';

/**
 * Servicio que encapsula el acceso a las rutas de aprendizaje publicadas
 * por Impulso Tech.
 *
 * Únicamente expone las operaciones de lectura necesarias para el
 * estudiante. Las operaciones de gestión (creación, edición, cambio de
 * estado) se manejarán desde el módulo del instructor cuando se
 * implemente.
 */
@Injectable({ providedIn: 'root' })
export class LearningRoutesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/learning-routes`;

  /**
   * Lista las rutas publicadas y disponibles para los estudiantes.
   *
   * @param page número de página (base 0).
   * @param size tamaño de la página.
   */
  listPublished(page = 0, size = 12): Observable<PagedResponse<LearningRoute>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<LearningRoute>>(this.baseUrl, { params });
  }

  /** Recupera el detalle de una ruta de aprendizaje concreta. */
  get(id: number): Observable<LearningRoute> {
    return this.http.get<LearningRoute>(`${this.baseUrl}/${id}`);
  }
}
