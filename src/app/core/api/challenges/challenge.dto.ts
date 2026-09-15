/**
 * DTOs del módulo de retos y sus intentos (RF-013, RF-037, RF-038).
 *
 * <p>Reflejan los records Java expuestos por
 * {@code /api/challenges} y {@code /api/challenge-attempts}. Los tipos
 * se alinean con el enum {@code ChallengeAttemptStatus} y con las
 * validaciones {@code @NotBlank}/{@code @NotNull} declaradas en el
 * backend para dar feedback claro en el editor.</p>
 */
import { ContentStatus, DifficultyLevel } from '../learning-routes/learning-route.dto';

/** Estados posibles de un intento de reto. */
export type ChallengeAttemptStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

/** Representación pública de un reto. */
export interface Challenge {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly objective: string | null;
  readonly instructions: string | null;
  readonly difficulty: DifficultyLevel;
  readonly allowedLanguages: string;
  readonly ioExamples: string | null;
  readonly restrictions: string | null;
  readonly publicTestCases: string | null;
  readonly hiddenTestCases: string | null;
  readonly xpReward: number;
  readonly estimatedMinutes: number | null;
  readonly status: ContentStatus;
  readonly learningRouteId: number | null;
  readonly courseId: number | null;
  readonly moduleId: number | null;
  readonly lessonId: number | null;
  readonly instructorId: number;
  readonly instructorFullName: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Intento enviado por un estudiante a un reto. */
export interface ChallengeAttempt {
  readonly id: number;
  readonly challengeId: number;
  readonly challengeName: string;
  readonly userId: number;
  readonly userFullName: string;
  readonly attemptNumber: number;
  readonly language: string;
  readonly code: string;
  readonly status: ChallengeAttemptStatus;
  readonly feedback: string | null;
  readonly reviewedById: number | null;
  readonly reviewedAt: string | null;
  readonly submittedAt: string;
  readonly updatedAt: string;
}

/** Datos para crear un reto (dificultad y lenguajes son obligatorios). */
export interface CreateChallengeRequest {
  readonly name: string;
  readonly description: string;
  readonly objective?: string | null;
  readonly instructions?: string | null;
  readonly difficulty: DifficultyLevel;
  readonly allowedLanguages: string;
  readonly ioExamples?: string | null;
  readonly restrictions?: string | null;
  readonly publicTestCases?: string | null;
  readonly hiddenTestCases?: string | null;
  readonly xpReward?: number | null;
  readonly estimatedMinutes?: number | null;
  readonly learningRouteId?: number | null;
  readonly courseId?: number | null;
  readonly moduleId?: number | null;
  readonly lessonId?: number | null;
}

/**
 * Actualización parcial de un reto: todos los campos son opcionales y
 * aceptan {@code null} para que el editor pueda "vaciar" un valor sin
 * ambigüedad con {@code undefined} (omisión).
 */
export type UpdateChallengeRequest = {
  readonly [K in keyof CreateChallengeRequest]?: CreateChallengeRequest[K] | null;
};

/** Payload para enviar un intento a un reto (estudiante). */
export interface SubmitChallengeAttemptRequest {
  readonly language: string;
  readonly code: string;
}

/** Payload para revisar un intento pendiente (instructor). */
export interface ReviewChallengeAttemptRequest {
  readonly status: ChallengeAttemptStatus;
  readonly feedback?: string | null;
}
