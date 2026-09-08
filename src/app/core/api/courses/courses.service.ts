import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ContentStatus, PagedResponse } from '../learning-routes/learning-route.dto';
import {
  Course,
  CourseModule,
  CreateCourseModuleRequest,
  CreateCourseRequest,
  UpdateCourseModuleRequest,
  UpdateCourseRequest,
} from './course.dto';

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

  /** Lista todos los cursos incluyendo borradores para gestión (instructor/admin). */
  listManaged(options: {
    search?: string;
    status?: ContentStatus;
    page?: number;
    size?: number;
  } = {}): Observable<PagedResponse<Course>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.search) {
      params = params.set('search', options.search);
    }
    if (options.status) {
      params = params.set('status', options.status);
    }
    return this.http.get<PagedResponse<Course>>(`${this.baseUrl}/courses/manage`, { params });
  }

  /** Crea un nuevo curso en estado {@code BORRADOR}. */
  create(request: CreateCourseRequest): Observable<Course> {
    return this.http.post<Course>(`${this.baseUrl}/courses`, request);
  }

  /** Actualiza los campos permitidos de un curso existente. */
  update(id: number, request: UpdateCourseRequest): Observable<Course> {
    return this.http.patch<Course>(`${this.baseUrl}/courses/${id}`, request);
  }

  /** Cambia el estado del ciclo de vida del curso. */
  changeStatus(id: number, status: ContentStatus): Observable<Course> {
    return this.http.patch<Course>(`${this.baseUrl}/courses/${id}/status`, { status });
  }

  /** Crea un módulo dentro del curso indicado. */
  createModule(courseId: number, request: CreateCourseModuleRequest): Observable<CourseModule> {
    return this.http.post<CourseModule>(
      `${this.baseUrl}/courses/${courseId}/modules`,
      request,
    );
  }

  /** Actualiza los campos permitidos de un módulo existente. */
  updateModule(moduleId: number, request: UpdateCourseModuleRequest): Observable<CourseModule> {
    return this.http.patch<CourseModule>(
      `${this.baseUrl}/course-modules/${moduleId}`,
      request,
    );
  }

  /** Cambia el estado del ciclo de vida del módulo. */
  changeModuleStatus(moduleId: number, status: ContentStatus): Observable<CourseModule> {
    return this.http.patch<CourseModule>(
      `${this.baseUrl}/course-modules/${moduleId}/status`,
      { status },
    );
  }

  /** Elimina un módulo del curso. */
  deleteModule(moduleId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/course-modules/${moduleId}`);
  }
}
