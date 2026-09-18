/**
 * DTOs del módulo de laboratorios (RF-053).
 *
 * <p>Reflejan los records Java expuestos por {@code /api/labs}. A
 * diferencia de otros contenidos, el backend usa {@code PUT} sobre el
 * mismo {@code LabRequest} para crear y actualizar, y no expone un
 * endpoint {@code /status} independiente: el estado viaja dentro del
 * request.</p>
 */
import { ContentStatus } from '../learning-routes/learning-route.dto';

/** Representación pública de un laboratorio. */
export interface Lab {
  readonly id: number;
  readonly title: string;
  readonly description: string;
  readonly instructions: string;
  readonly language: string;
  readonly starterCode: string | null;
  readonly expectedOutput: string | null;
  readonly courseId: number | null;
  readonly lessonId: number | null;
  readonly instructorId: number;
  readonly status: ContentStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Payload para crear o actualizar un laboratorio. El backend valida
 * {@code title}, {@code description}, {@code instructions} y
 * {@code language} como obligatorios.
 */
export interface LabRequest {
  readonly title: string;
  readonly description: string;
  readonly instructions: string;
  readonly language: string;
  readonly starterCode?: string | null;
  readonly expectedOutput?: string | null;
  readonly courseId?: number | null;
  readonly lessonId?: number | null;
  readonly status?: ContentStatus | null;
}

/** Payload para ejecutar código de prueba dentro del sandbox del lab. */
export interface ExecuteCodeRequest {
  readonly code: string;
  readonly stdin?: string | null;
}

/** Resultado devuelto por la ejecución del sandbox. */
export interface ExecutionResult {
  readonly stdout: string | null;
  readonly stderr: string | null;
  readonly exitCode: number | null;
  readonly executionTimeMs: number | null;
  readonly message: string | null;
}

/** Entrega persistida del estudiante sobre un laboratorio. */
export interface LabSubmission {
  readonly id: number;
  readonly labId: number;
  readonly code: string;
  readonly stdout: string | null;
  readonly stderr: string | null;
  readonly exitCode: number | null;
  readonly executionTimeMs: number | null;
  readonly submittedAt: string;
}
