/**
 * DTOs de la biblioteca de recursos educativos (RF-024, RF-025).
 */
import { ContentStatus, DifficultyLevel } from '../learning-routes/learning-route.dto';

/** Tipo de recurso educativo. */
export type ResourceType =
  | 'PDF'
  | 'VIDEO'
  | 'IMAGEN'
  | 'CODIGO'
  | 'ENLACE_EXTERNO'
  | 'DOCUMENTO'
  | 'GUIA';

/** Representación pública de un recurso educativo. */
export interface EducationalResource {
  readonly id: number;
  readonly name: string;
  readonly description: string | null;
  readonly type: ResourceType;
  readonly category: string | null;
  readonly topic: string | null;
  readonly technology: string | null;
  readonly difficulty: DifficultyLevel | null;
  readonly author: string | null;
  readonly resourceUrl: string;
  readonly status: ContentStatus;
  readonly publishedAt: string | null;
  readonly learningRouteId: number | null;
  readonly courseId: number | null;
  readonly moduleId: number | null;
  readonly lessonId: number | null;
  readonly instructorId: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Recurso marcado como favorito por el estudiante autenticado. */
export interface FavoriteResource {
  readonly favoritedAt: string;
  readonly resource: EducationalResource;
}
