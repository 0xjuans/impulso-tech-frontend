/**
 * DTOs de los paneles consolidados de instructor (RF-032) y
 * administrador (RF-033).
 */

/** Métricas del panel de instructor. */
export interface InstructorDashboard {
  readonly routesTotal: number;
  readonly routesPublished: number;
  readonly routesDraft: number;
  readonly coursesTotal: number;
  readonly coursesPublished: number;
  readonly coursesDraft: number;
  readonly coursesDisabled: number;
  readonly publishedLessons: number;
  readonly totalEnrollments: number;
  readonly uniqueStudents: number;
  readonly pendingChallenges: number;
  readonly pendingProjects: number;
  readonly openAssignedTickets: number;
}

/** Métricas del panel de administrador. */
export interface AdminDashboard {
  readonly students: number;
  readonly instructors: number;
  readonly administrators: number;
  readonly activeUsers: number;
  readonly pendingUsers: number;
  readonly disabledUsers: number;
  readonly routesTotal: number;
  readonly routesPublished: number;
  readonly coursesTotal: number;
  readonly coursesPublished: number;
  readonly coursesDraft: number;
  readonly coursesDisabled: number;
  readonly publishedLessons: number;
  readonly totalEnrollments: number;
  readonly openTickets: number;
  readonly resolvedTickets: number;
  readonly closedTickets: number;
}

/** Fila del panel "Top cursos" (RF-032 / RF-033). */
export interface TopCourseRow {
  readonly courseId: number;
  readonly name: string;
  readonly totalEnrollments: number;
  readonly completedEnrollments: number;
}

/** Fila del feed "Últimas inscripciones". */
export interface RecentEnrollmentRow {
  readonly enrollmentId: number;
  readonly courseId: number;
  readonly courseName: string;
  readonly studentId: number;
  readonly studentName: string;
  readonly status: 'INSCRITO' | 'EN_PROGRESO' | 'COMPLETADO' | string;
  readonly startedAt: string;
}

/** Fila del feed "Últimos registros" (admin). */
export interface RecentSignupRow {
  readonly userId: number;
  readonly username: string;
  readonly fullName: string;
  readonly role: string;
  readonly status: string;
  readonly createdAt: string;
}
