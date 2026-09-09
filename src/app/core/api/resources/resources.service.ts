import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { DifficultyLevel, PagedResponse } from '../learning-routes/learning-route.dto';
import { EducationalResource, FavoriteResource, ResourceType } from './resource.dto';

/**
 * Servicio de la biblioteca de recursos educativos (RF-024) y de la
 * gestión de favoritos del estudiante (RF-025).
 */
@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Lista recursos publicados con filtros opcionales. */
  listPublished(options: {
    search?: string;
    type?: ResourceType;
    difficulty?: DifficultyLevel;
    page?: number;
    size?: number;
  } = {}): Observable<PagedResponse<EducationalResource>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 24);
    if (options.search) params = params.set('search', options.search);
    if (options.type) params = params.set('type', options.type);
    if (options.difficulty) params = params.set('difficulty', options.difficulty);
    return this.http.get<PagedResponse<EducationalResource>>(`${this.baseUrl}/resources`, {
      params,
    });
  }

  /** Consulta el detalle de un recurso. */
  get(id: number): Observable<EducationalResource> {
    return this.http.get<EducationalResource>(`${this.baseUrl}/resources/${id}`);
  }

  /** Lista los recursos marcados como favoritos por el usuario autenticado. */
  listMyFavorites(page = 0, size = 30): Observable<PagedResponse<FavoriteResource>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<FavoriteResource>>(
      `${this.baseUrl}/users/me/favorites/resources`,
      { params },
    );
  }

  /** Marca un recurso como favorito. Idempotente en el backend. */
  favorite(resourceId: number): Observable<FavoriteResource> {
    return this.http.post<FavoriteResource>(
      `${this.baseUrl}/users/me/favorites/resources/${resourceId}`,
      {},
    );
  }

  /** Elimina un recurso de la lista de favoritos. */
  unfavorite(resourceId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/users/me/favorites/resources/${resourceId}`,
    );
  }
}
