/**
 * DTOs y tipos del módulo de lecciones (RF-041), reflejo de los
 * contratos expuestos por {@code /api/course-modules/{id}/lessons} y
 * {@code /api/lessons/{id}} del backend.
 */
import { ContentStatus } from '../learning-routes/learning-route.dto';

/** Representación pública de una lección publicada. */
export interface Lesson {
  readonly id: number;
  readonly moduleId: number;
  readonly title: string;
  readonly description: string | null;
  readonly objective: string | null;
  readonly content: string | null;
  readonly estimatedDurationMinutes: number | null;
  readonly orderIndex: number;
  readonly optional: boolean;
  readonly status: ContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}
