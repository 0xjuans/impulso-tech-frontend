/**
 * DTOs y tipos de la mascota IA (RF-017, RF-051), reflejo de los
 * contratos expuestos por {@code /api/ai/mascot}.
 */

/** Rol del emisor de un mensaje dentro de una conversación. */
export type AiMessageRole = 'SYSTEM' | 'USER' | 'ASSISTANT';

/**
 * Tipo de contexto de aprendizaje al que puede anclarse una
 * conversación con la mascota.
 */
export type AiContextType = 'GENERAL' | 'LESSON' | 'COURSE' | 'CHALLENGE' | 'PROJECT';

/** Mensaje individual dentro de una conversación con la mascota. */
export interface MascotMessage {
  readonly id: number;
  readonly role: AiMessageRole;
  readonly content: string;
  readonly createdAt: string;
}

/** Representación pública de una conversación con la mascota. */
export interface MascotConversation {
  readonly id: number;
  readonly title: string;
  readonly contextType: AiContextType | null;
  readonly contextId: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly closedAt: string | null;
  readonly messages: readonly MascotMessage[] | null;
}
