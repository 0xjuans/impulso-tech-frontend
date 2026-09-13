/**
 * DTOs del módulo de comunidad y foro de aprendizaje (RF-034).
 *
 * <p>Reflejan la forma exacta de las respuestas del backend en
 * {@code /api/community}. Los tipos se mantienen alineados con los
 * records Java del backend para que el intercambio JSON no requiera
 * transformaciones adicionales en el cliente.</p>
 */

/** Tipo de contenido al que puede vincularse una publicación del foro. */
export type RelatedContentType =
  | 'RUTA'
  | 'CURSO'
  | 'LECCION'
  | 'RETO'
  | 'LABORATORIO'
  | 'PROYECTO'
  | 'EVALUACION';

/** Representación resumida de una publicación del foro para listados. */
export interface CommunityPost {
  readonly id: number;
  readonly authorId: number;
  readonly authorName: string;
  readonly title: string;
  readonly description: string;
  readonly codeSnippet: string | null;
  readonly tags: string | null;
  readonly relatedType: RelatedContentType | null;
  readonly relatedId: number | null;
  readonly acceptedReplyId: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Representación pública de una respuesta a una publicación. */
export interface CommunityReply {
  readonly id: number;
  readonly postId: number;
  readonly authorId: number;
  readonly authorName: string;
  readonly content: string;
  readonly codeSnippet: string | null;
  readonly helpfulCount: number;
  readonly accepted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Detalle completo de una publicación con todas sus respuestas.
 *
 * <p>Refleja la forma real del DTO del backend
 * {@code CommunityPostDetailResponse}: la publicación viaja anidada en
 * la propiedad {@code post} y las respuestas en {@code replies}, no
 * como campos planos junto a la publicación.</p>
 */
export interface CommunityPostDetail {
  readonly post: CommunityPost;
  readonly replies: readonly CommunityReply[];
}

/** Datos requeridos para crear una publicación nueva. */
export interface CreatePostRequest {
  readonly title: string;
  readonly description: string;
  readonly codeSnippet?: string | null;
  readonly tags?: string | null;
  readonly relatedType?: RelatedContentType | null;
  readonly relatedId?: number | null;
}

/** Datos requeridos para publicar una respuesta. */
export interface CreateReplyRequest {
  readonly content: string;
  readonly codeSnippet?: string | null;
}

/** Datos requeridos para reportar una publicación o respuesta. */
export interface CreateReportRequest {
  readonly reason: string;
}
