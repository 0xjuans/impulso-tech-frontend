/**
 * DTOs y tipos del módulo de mensajería directa (RF-061), reflejo de
 * los contratos expuestos por {@code /api/messages/conversations}.
 */

/** Vista compacta de una conversación en el listado. */
export interface Conversation {
  readonly id: number;
  readonly otherUserId: number;
  readonly otherUsername: string;
  readonly otherFullName: string | null;
  readonly otherPhotoUrl: string | null;
  readonly lastMessagePreview: string | null;
  readonly lastMessageAt: string;
  readonly unreadCount: number;
}

/** Representación pública de un mensaje. */
export interface Message {
  readonly id: number;
  readonly senderId: number;
  readonly content: string;
  readonly sentAt: string;
  readonly readAt: string | null;
}
