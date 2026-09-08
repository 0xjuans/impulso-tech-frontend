/**
 * DTOs y tipos del módulo de gamificación (RF-018, RF-019, RF-020,
 * RF-021), reflejo de los contratos expuestos por
 * {@code /api/users/me/xp}, {@code /api/users/me/streak},
 * {@code /api/users/me/badges}, {@code /api/rankings} y
 * {@code /api/badges}.
 */

/** Estado actual de XP y nivel del estudiante. */
export interface UserXp {
  readonly totalXp: number;
  readonly currentLevel: number;
  readonly xpForCurrentLevel: number;
  readonly xpForNextLevel: number;
  readonly xpIntoCurrentLevel: number;
  readonly xpToNextLevel: number;
  readonly updatedAt: string;
}

/** Racha de aprendizaje del estudiante. */
export interface UserStreak {
  readonly currentStreak: number;
  readonly longestStreak: number;
  /** Fecha (yyyy-MM-dd) del último día contado como actividad. */
  readonly lastActivityDate: string | null;
  readonly streakStartedOn: string | null;
  readonly updatedAt: string;
}

/** Categoría funcional de una insignia. */
export type BadgeCategory =
  | 'APRENDIZAJE'
  | 'CONSTANCIA'
  | 'RETOS'
  | 'PROYECTOS'
  | 'COMUNIDAD'
  | 'EXPLORACION';

/** Rareza / peso visual de una insignia. */
export type BadgeRarity = 'COMUN' | 'RARA' | 'EPICA' | 'LEGENDARIA';

/** Condición desencadenante del otorgamiento de una insignia. */
export type BadgeTrigger =
  | 'XP_TOTAL'
  | 'NIVEL_ALCANZADO'
  | 'CURSOS_COMPLETADOS'
  | 'LECCIONES_COMPLETADAS'
  | 'RETOS_APROBADOS'
  | 'PROYECTOS_APROBADOS'
  | 'RACHA_DIAS';

/** Representación pública de una insignia del catálogo. */
export interface Badge {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly iconUrl: string | null;
  readonly category: BadgeCategory;
  readonly rarity: BadgeRarity;
  readonly triggerType: BadgeTrigger;
  readonly triggerValue: number;
}

/** Insignia otorgada al usuario autenticado. */
export interface UserBadge {
  readonly awardedAt: string;
  readonly badge: Badge;
}

/** Periodo temporal considerado por el ranking global. */
export type RankingPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';

/** Entrada individual del ranking global. */
export interface RankingEntry {
  readonly position: number;
  readonly userId: number;
  readonly username: string;
  readonly fullName: string;
  readonly profilePhotoUrl: string | null;
  readonly xp: number;
  readonly currentLevel: number;
}

/** Ranking global con las posiciones y la ubicación del solicitante. */
export interface RankingResponse {
  readonly period: RankingPeriod;
  readonly entries: readonly RankingEntry[];
  readonly me: RankingEntry | null;
}
