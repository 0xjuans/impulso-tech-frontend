/**
 * DTOs del módulo de evaluaciones (RF-020, RF-046).
 *
 * <p>Reflejan los records Java expuestos por
 * {@code /api/lessons/{id}/evaluations}, {@code /api/evaluations/{id}}
 * y sus intentos. Las preguntas usan el enum {@code ActivityType} del
 * backend (compartido con actividades).</p>
 */
import { ContentStatus } from '../learning-routes/learning-route.dto';

/** Tipos de pregunta admitidos por una evaluación. */
export type EvaluationQuestionType =
  | 'SELECCION_MULTIPLE'
  | 'VERDADERO_FALSO'
  | 'RESPUESTA_CORTA';

/**
 * Configuración de una pregunta de selección múltiple. Se serializa
 * como JSON en el campo {@code config} de la entidad.
 */
export interface SelectionQuestionConfig {
  readonly options: readonly string[];
  readonly correctIndex: number;
}

/** Configuración de verdadero/falso. */
export interface BooleanQuestionConfig {
  readonly correct: boolean;
}

/** Configuración de respuesta corta con evaluación por igualdad textual. */
export interface ShortAnswerQuestionConfig {
  readonly expected: string;
  readonly caseSensitive?: boolean;
}

/** Pregunta perteneciente a una evaluación. */
export interface EvaluationQuestion {
  readonly id: number;
  readonly orderIndex: number;
  readonly type: EvaluationQuestionType;
  readonly questionText: string;
  readonly score: number;
  /**
   * Configuración específica del tipo, serializada como JSON. En las
   * respuestas al estudiante viene sin las respuestas correctas.
   */
  readonly config: string;
}

/** Representación completa de una evaluación con sus preguntas. */
export interface Evaluation {
  readonly id: number;
  readonly lessonId: number;
  readonly name: string;
  readonly description: string | null;
  readonly instructions: string | null;
  readonly timeLimitMinutes: number | null;
  readonly passingPercentage: number;
  readonly maxAttempts: number;
  readonly orderIndex: number;
  readonly status: ContentStatus;
  readonly questions: readonly EvaluationQuestion[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Intento del estudiante sobre una evaluación, ya calificado. */
export interface EvaluationAttempt {
  readonly id: number;
  readonly evaluationId: number;
  readonly startedAt: string;
  readonly finishedAt: string | null;
  readonly totalScore: number;
  readonly maxPossibleScore: number;
  readonly percentage: number;
  readonly passed: boolean;
}

/** Datos para crear una evaluación dentro de una lección. */
export interface CreateEvaluationRequest {
  readonly name: string;
  readonly description?: string | null;
  readonly instructions?: string | null;
  readonly timeLimitMinutes?: number | null;
  readonly passingPercentage?: number | null;
  readonly maxAttempts?: number | null;
  readonly orderIndex?: number | null;
}

/** Actualización parcial de una evaluación. */
export type UpdateEvaluationRequest = {
  readonly [K in keyof CreateEvaluationRequest]?: CreateEvaluationRequest[K] | null;
};

/**
 * Datos para agregar una pregunta a una evaluación. {@code config}
 * debe ser un JSON stringificado con la forma específica del tipo.
 */
export interface CreateEvaluationQuestionRequest {
  readonly orderIndex: number;
  readonly type: EvaluationQuestionType;
  readonly questionText: string;
  readonly score: number;
  readonly config: string;
}

/** Payload para enviar el intento de un estudiante. */
export interface SubmitEvaluationRequest {
  readonly answers: string;
}
