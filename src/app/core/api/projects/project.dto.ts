/**
 * DTOs del módulo de proyectos y sus entregas (RF-023, RF-045).
 *
 * <p>Reflejan los records Java expuestos por {@code /api/projects} y
 * {@code /api/project-submissions/{id}/review}. La calificación se
 * modela como número entre 0 y 100, coherente con la validación
 * {@code @Min}/{@code @Max} del backend.</p>
 */
import { ContentStatus, DifficultyLevel } from '../learning-routes/learning-route.dto';

/** Ciclo de vida de una entrega de proyecto. */
export type ProjectSubmissionStatus =
  | 'ENVIADA'
  | 'EN_REVISION'
  | 'APROBADA'
  | 'CORRECCION_SOLICITADA'
  | 'RECHAZADA';

/** Representación pública de un proyecto propuesto por el instructor. */
export interface Project {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly objective: string | null;
  readonly instructions: string | null;
  readonly requirements: string | null;
  readonly difficulty: DifficultyLevel;
  readonly technologies: string | null;
  readonly resources: string | null;
  readonly evaluationCriteria: string | null;
  readonly maxScore: number;
  readonly xpReward: number;
  readonly deadlineAt: string | null;
  readonly status: ContentStatus;
  readonly learningRouteId: number | null;
  readonly courseId: number | null;
  readonly moduleId: number | null;
  readonly instructorId: number;
  readonly instructorFullName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Entrega realizada por un estudiante a un proyecto. */
export interface ProjectSubmission {
  readonly id: number;
  readonly projectId: number;
  readonly projectName: string;
  readonly userId: number;
  readonly userFullName: string;
  readonly submissionNumber: number;
  readonly submissionUrl: string;
  readonly studentNotes: string | null;
  readonly status: ProjectSubmissionStatus;
  readonly grade: number | null;
  readonly feedback: string | null;
  readonly reviewedById: number | null;
  readonly reviewedAt: string | null;
  readonly submittedAt: string;
  readonly updatedAt: string;
}

/**
 * Datos requeridos para crear un proyecto. El backend valida que
 * {@code name}, {@code description} y {@code difficulty} sean
 * obligatorios; el resto es opcional.
 */
export interface CreateProjectRequest {
  readonly name: string;
  readonly description: string;
  readonly objective?: string | null;
  readonly instructions?: string | null;
  readonly requirements?: string | null;
  readonly difficulty: DifficultyLevel;
  readonly technologies?: string | null;
  readonly resources?: string | null;
  readonly evaluationCriteria?: string | null;
  readonly maxScore?: number | null;
  readonly xpReward?: number | null;
  readonly deadlineAt?: string | null;
  readonly learningRouteId?: number | null;
  readonly courseId?: number | null;
  readonly moduleId?: number | null;
}

/**
 * Actualización parcial: todos los campos son opcionales y aceptan
 * {@code null} para poder "vaciar" un valor sin ambigüedad con la
 * ausencia (undefined).
 */
export type UpdateProjectRequest = {
  readonly [K in keyof CreateProjectRequest]?: CreateProjectRequest[K] | null;
};

/** Payload del estudiante para enviar una entrega. */
export interface CreateSubmissionRequest {
  readonly submissionUrl: string;
  readonly studentNotes?: string | null;
}

/** Payload del instructor para revisar una entrega. */
export interface ReviewSubmissionRequest {
  readonly status: ProjectSubmissionStatus;
  readonly grade?: number | null;
  readonly feedback?: string | null;
}
