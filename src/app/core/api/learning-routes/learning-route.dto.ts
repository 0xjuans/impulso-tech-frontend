/**
 * DTOs y tipos del módulo de rutas de aprendizaje (RF-008), reflejo de
 * los contratos expuestos por {@code /api/learning-routes} del backend.
 */

/** Nivel de dificultad utilizado por rutas, cursos, retos y proyectos. */
export type DifficultyLevel = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

/** Estado del ciclo de vida de un contenido educativo. */
export type ContentStatus = 'BORRADOR' | 'PUBLICADO' | 'DESHABILITADO';

/** Representación pública de una ruta de aprendizaje. */
export interface LearningRoute {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly objective: string | null;
  readonly coverImageUrl: string | null;
  readonly difficulty: DifficultyLevel;
  readonly estimatedDurationHours: number | null;
  readonly technologies: string | null;
  readonly status: ContentStatus;
  readonly instructorId: number;
  readonly instructorFullName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Envoltura estándar para respuestas paginadas expuestas por la API. */
export interface PagedResponse<T> {
  readonly content: readonly T[];
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}
