import { Pipe, PipeTransform } from '@angular/core';

/**
 * Pipe que traduce valores de enums del backend a etiquetas legibles en español.
 *
 * Uso: {{ valor | enumLabel }}
 * Convierte valores como 'EN_PROGRESO' a 'En progreso', 'ENLACE_EXTERNO' a 'Enlace externo', etc.
 */
@Pipe({ name: 'enumLabel', standalone: true })
export class EnumLabelPipe implements PipeTransform {
  private static readonly labels: Record<string, string> = {
    // EnrollmentStatus
    INSCRITO: 'Inscrito',
    EN_PROGRESO: 'En progreso',
    COMPLETADO: 'Completado',

    // ContentStatus
    BORRADOR: 'Borrador',
    PUBLICADO: 'Publicado',
    ARCHIVADO: 'Archivado',
    DESHABILITADO: 'Deshabilitado',

    // DifficultyLevel
    PRINCIPIANTE: 'Principiante',
    INTERMEDIO: 'Intermedio',
    AVANZADO: 'Avanzado',

    // ResourceType
    PDF: 'PDF',
    VIDEO: 'Video',
    IMAGEN: 'Imagen',
    CODIGO: 'Código',
    ENLACE_EXTERNO: 'Enlace externo',
    DOCUMENTO: 'Documento',
    GUIA: 'Guía',

    // ChallengeAttemptStatus
    PENDIENTE: 'Pendiente',
    APROBADO: 'Aprobado',
    RECHAZADO: 'Rechazado',

    // ProjectSubmissionStatus
    ENVIADA: 'Enviada',
    EN_REVISION: 'En revisión',
    APROBADA: 'Aprobada',
    CORRECCION_SOLICITADA: 'Corrección solicitada',
    RECHAZADA: 'Rechazada',

    // NotificationType
    BADGE_AWARDED: 'Insignia obtenida',
    LEVEL_UP: 'Subida de nivel',
    COURSE_COMPLETED: 'Curso completado',
    EVALUATION_PASSED: 'Evaluación aprobada',
    EVALUATION_FAILED: 'Evaluación reprobada',
    STREAK_MILESTONE: 'Racha alcanzada',
    GENERIC: 'General',

    // EvaluationQuestionType
    SELECCION_MULTIPLE: 'Selección múltiple',
    VERDADERO_FALSO: 'Verdadero / Falso',
    RESPUESTA_CORTA: 'Respuesta corta',

    // SupportTicketType
    BUG: 'Error',
    PREGUNTA: 'Pregunta',
    SUGERENCIA: 'Sugerencia',
    OTRO: 'Otro',

    // SupportTicketStatus
    ABIERTO: 'Abierto',
    EN_PROCESO: 'En proceso',
    RESUELTO: 'Resuelto',
    CERRADO: 'Cerrado',
  };

  transform(value: string | null | undefined): string {
    if (!value) return '';
    return EnumLabelPipe.labels[value] ?? value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
  }
}
