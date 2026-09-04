import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Lesson } from './lesson.dto';

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
}
