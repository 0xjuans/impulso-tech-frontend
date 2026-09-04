/**
 * DTOs y tipos del módulo de cursos (RF-040, RF-041), reflejo de los
 * contratos expuestos por {@code /api/courses} y
 * {@code /api/courses/{id}/modules} del backend.
 */
import { ContentStatus, DifficultyLevel } from '../learning-routes/learning-route.dto';

/** Representación pública de un curso publicado. */
export interface Course {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly objective: string | null;
  readonly coverImageUrl: string | null;
  readonly difficulty: DifficultyLevel;
  readonly estimatedDurationHours: number | null;
  readonly technology: string | null;
  readonly status: ContentStatus;
  readonly generatesCertificate: boolean;
  readonly learningRouteId: number | null;
  readonly learningRouteName: string | null;
  readonly instructorId: number;
  readonly instructorFullName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Representación pública de un módulo dentro de un curso. */
export interface CourseModule {
  readonly id: number;
  readonly courseId: number;
  readonly name: string;
  readonly description: string | null;
  readonly objective: string | null;
  readonly orderIndex: number;
  readonly optional: boolean;
  readonly status: ContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
