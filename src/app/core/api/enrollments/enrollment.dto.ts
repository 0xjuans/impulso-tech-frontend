/**
 * DTOs del módulo de inscripciones y progreso (RF-011), reflejo de los
 * contratos expuestos por el backend en {@code /api}.
 */

/** Estado agregado del avance del estudiante dentro de un curso. */
export type EnrollmentStatus = 'INSCRITO' | 'EN_PROGRESO' | 'COMPLETADO';

/** Representación pública de una inscripción a un curso. */
export interface Enrollment {
  readonly id: number;
  readonly courseId: number;
  readonly courseName: string;
  readonly status: EnrollmentStatus;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly lastAccessedAt: string | null;
}

/** Progreso detallado de un estudiante dentro de un curso concreto. */
export interface CourseProgress {
  readonly courseId: number;
  readonly courseName: string;
  readonly status: EnrollmentStatus;
  readonly mandatoryLessonsTotal: number;
  readonly mandatoryLessonsCompleted: number;
  readonly completionPercentage: number;
  readonly completedLessonIds: readonly number[];
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly lastAccessedAt: string | null;
}
