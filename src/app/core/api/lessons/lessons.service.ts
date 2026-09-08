import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ContentStatus } from '../learning-routes/learning-route.dto';
import { CreateLessonRequest, Lesson, UpdateLessonRequest } from './lesson.dto';

/**
 * Servicio que consume los endpoints de lecciones.
 *
 * Sólo expone las operaciones de lectura necesarias para el estudiante.
 */
@Injectable({ providedIn: 'root' })
export class LessonsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Lista las lecciones publicadas de un módulo, en orden. */
  listByModule(moduleId: number): Observable<readonly Lesson[]> {
    return this.http.get<readonly Lesson[]>(
      `${this.baseUrl}/course-modules/${moduleId}/lessons`,
    );
  }

  /** Recupera el detalle de una lección. */
  get(lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.baseUrl}/lessons/${lessonId}`);
  }

  /** Crea una lección dentro del módulo indicado. */
  create(moduleId: number, request: CreateLessonRequest): Observable<Lesson> {
    return this.http.post<Lesson>(
      `${this.baseUrl}/course-modules/${moduleId}/lessons`,
      request,
    );
  }

  /** Actualiza los campos permitidos de una lección existente. */
  update(lessonId: number, request: UpdateLessonRequest): Observable<Lesson> {
    return this.http.patch<Lesson>(`${this.baseUrl}/lessons/${lessonId}`, request);
  }

  /** Cambia el estado del ciclo de vida de una lección. */
  changeStatus(lessonId: number, status: ContentStatus): Observable<Lesson> {
    return this.http.patch<Lesson>(`${this.baseUrl}/lessons/${lessonId}/status`, { status });
  }

  /** Elimina una lección. */
  delete(lessonId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/lessons/${lessonId}`);
  }
}
