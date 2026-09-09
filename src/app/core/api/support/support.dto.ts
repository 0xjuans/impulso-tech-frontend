/**
 * DTOs del módulo de soporte (RF-036).
 */

/** Tipo de ticket reportado por el estudiante. */
export type SupportTicketType =
  | 'TECHNICAL_ERROR'
  | 'COURSE_ISSUE'
  | 'LESSON_ISSUE'
  | 'ACTIVITY_ISSUE'
  | 'CHALLENGE_ISSUE'
  | 'LAB_ISSUE'
  | 'EVALUATION_ISSUE'
  | 'PROJECT_ISSUE'
  | 'RESOURCE_ISSUE'
  | 'AI_MASCOT_ISSUE';

/** Estado del ciclo de vida de un ticket. */
export type SupportTicketStatus =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'EN_PROCESO'
  | 'RESUELTO'
  | 'CERRADO';

/** Representación pública de un ticket de soporte. */
export interface SupportTicket {
  readonly id: number;
  readonly reporterId: number;
  readonly reporterName: string;
  readonly type: SupportTicketType;
  readonly title: string;
  readonly description: string;
  readonly relatedId: number | null;
  readonly status: SupportTicketStatus;
  readonly assigneeId: number | null;
  readonly assigneeName: string | null;
  readonly resolutionNotes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Cuerpo aceptado por el endpoint administrativo de actualización. */
export interface UpdateTicketRequest {
  readonly status?: SupportTicketStatus | null;
  /** {@code -1} desasigna el ticket; cualquier otro valor lo asigna a ese usuario. */
  readonly assigneeId?: number | null;
  readonly resolutionNotes?: string | null;
}
