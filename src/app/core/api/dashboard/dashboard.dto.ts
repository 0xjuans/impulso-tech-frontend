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
