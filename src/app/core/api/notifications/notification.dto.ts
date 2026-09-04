/**
 * DTOs y tipos del centro de notificaciones (RF-026), reflejo de los
 * contratos expuestos por {@code /api/users/me/notifications}.
 */

/** Tipo funcional de una notificación. */
export type NotificationType =
  | 'BADGE_AWARDED'
  | 'LEVEL_UP'
  | 'COURSE_COMPLETED'
  | 'EVALUATION_PASSED'
  | 'EVALUATION_FAILED'
  | 'STREAK_MILESTONE'
  | 'GENERIC';

/** Representación pública de una notificación del usuario. */
export interface Notification {
  readonly id: number;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly relatedType: string | null;
  readonly relatedId: number | null;
  readonly readAt: string | null;
  readonly createdAt: string;
}

/** Respuesta ligera con el conteo de no leídas. */
export interface UnreadCount {
  readonly unread: number;
}
