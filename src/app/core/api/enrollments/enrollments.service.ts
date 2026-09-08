import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import { CourseProgress, Enrollment } from './enrollment.dto';

/**
 * Servicio que consume los endpoints relacionados con las inscripciones
 * del estudiante autenticado.
 *
 * Cubre las operaciones básicas necesarias para el flujo del estudiante:
 * listar sus inscripciones vigentes, inscribirse en un curso, consultar
 * el progreso agregado de un curso y marcar una lección como completada.
 */
@Injectable({ providedIn: 'root' })
export class EnrollmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Recupera las inscripciones del estudiante autenticado, paginadas. */
  listMine(page = 0, size = 20): Observable<PagedResponse<Enrollment>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PagedResponse<Enrollment>>(`${this.baseUrl}/users/me/enrollments`, {
      params,
    });
  }

  /** Inscribe al estudiante autenticado en el curso indicado. */
  enroll(courseId: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.baseUrl}/courses/${courseId}/enroll`, {});
  }

  /** Recupera el progreso agregado del estudiante en un curso. */
  getProgress(courseId: number): Observable<CourseProgress> {
    return this.http.get<CourseProgress>(`${this.baseUrl}/users/me/courses/${courseId}/progress`);
  }

  /** Marca una lección como completada y devuelve el progreso actualizado. */
  completeLesson(lessonId: number): Observable<CourseProgress> {
    return this.http.post<CourseProgress>(`${this.baseUrl}/lessons/${lessonId}/complete`, {});
  }
}
