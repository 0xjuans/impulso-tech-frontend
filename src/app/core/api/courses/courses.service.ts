import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import { Course, CourseModule } from './course.dto';

/**
 * Servicio que consume los endpoints públicos de cursos y módulos.
 *
 * Únicamente expone las operaciones de lectura necesarias para el
 * estudiante. La gestión (crear, actualizar, cambiar estado) se
 * añadirá en el módulo del instructor.
 */
@Injectable({ providedIn: 'root' })
export class CoursesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Lista los cursos publicados con filtros opcionales. */
  listPublished(options: {
    search?: string;
    learningRouteId?: number;
    page?: number;
    size?: number;
  } = {}): Observable<PagedResponse<Course>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 12);
    if (options.search) {
      params = params.set('search', options.search);
    }
    if (options.learningRouteId != null) {
      params = params.set('learningRouteId', options.learningRouteId);
    }
    return this.http.get<PagedResponse<Course>>(`${this.baseUrl}/courses`, { params });
  }

  /** Recupera el detalle de un curso. */
  get(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.baseUrl}/courses/${id}`);
  }

  /** Lista los módulos publicados de un curso, en orden. */
  listModules(courseId: number): Observable<readonly CourseModule[]> {
    return this.http.get<readonly CourseModule[]>(
      `${this.baseUrl}/courses/${courseId}/modules`,
    );
  }
}
