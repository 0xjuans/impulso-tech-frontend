import { Routes } from '@angular/router';

import { roleGuard } from '../core/auth/guards/role.guard';

/**
 * Rutas del área privada del instructor.
 *
 * Todas comparten el {@link InstructorShellComponent} como layout y
 * están protegidas por {@link roleGuard}, permitiendo el acceso a
 * usuarios con rol {@code INSTRUCTOR} o {@code ADMINISTRADOR}.
 */
export const instructorRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard('INSTRUCTOR', 'ADMINISTRADOR')],
    loadComponent: () =>
      import('./components/instructor-shell/instructor-shell.component').then(
        (m) => m.InstructorShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './pages/instructor-dashboard-page/instructor-dashboard-page.component'
          ).then((m) => m.InstructorDashboardPageComponent),
        title: 'Panel del instructor · Impulso Tech',
      },
      {
        path: 'routes',
        loadComponent: () =>
          import(
            './pages/instructor-routes-page/instructor-routes-page.component'
          ).then((m) => m.InstructorRoutesPageComponent),
        title: 'Rutas de aprendizaje · Impulso Tech',
      },
      {
        path: 'routes/new',
        loadComponent: () =>
          import(
            './pages/instructor-route-editor-page/instructor-route-editor-page.component'
          ).then((m) => m.InstructorRouteEditorPageComponent),
        title: 'Nueva ruta · Impulso Tech',
      },
      {
        path: 'routes/:id',
        loadComponent: () =>
          import(
            './pages/instructor-route-editor-page/instructor-route-editor-page.component'
          ).then((m) => m.InstructorRouteEditorPageComponent),
        title: 'Editar ruta · Impulso Tech',
      },
      {
        path: 'challenges',
        loadComponent: () =>
          import(
            './pages/instructor-challenges-page/instructor-challenges-page.component'
          ).then((m) => m.InstructorChallengesPageComponent),
        title: 'Retos · Impulso Tech',
      },
      {
        path: 'challenges/new',
        loadComponent: () =>
          import(
            './pages/instructor-challenge-editor-page/instructor-challenge-editor-page.component'
          ).then((m) => m.InstructorChallengeEditorPageComponent),
        title: 'Nuevo reto · Impulso Tech',
      },
      {
        path: 'challenges/:id',
        loadComponent: () =>
          import(
            './pages/instructor-challenge-editor-page/instructor-challenge-editor-page.component'
          ).then((m) => m.InstructorChallengeEditorPageComponent),
        title: 'Editar reto · Impulso Tech',
      },
      {
        path: 'challenges/:id/attempts',
        loadComponent: () =>
          import(
            './pages/instructor-challenge-attempts-page/instructor-challenge-attempts-page.component'
          ).then((m) => m.InstructorChallengeAttemptsPageComponent),
        title: 'Intentos del reto · Impulso Tech',
      },
      {
        path: 'projects',
        loadComponent: () =>
          import(
            './pages/instructor-projects-page/instructor-projects-page.component'
          ).then((m) => m.InstructorProjectsPageComponent),
        title: 'Proyectos · Impulso Tech',
      },
      {
        path: 'projects/new',
        loadComponent: () =>
          import(
            './pages/instructor-project-editor-page/instructor-project-editor-page.component'
          ).then((m) => m.InstructorProjectEditorPageComponent),
        title: 'Nuevo proyecto · Impulso Tech',
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import(
            './pages/instructor-project-editor-page/instructor-project-editor-page.component'
          ).then((m) => m.InstructorProjectEditorPageComponent),
        title: 'Editar proyecto · Impulso Tech',
      },
      {
        path: 'projects/:id/submissions',
        loadComponent: () =>
          import(
            './pages/instructor-project-submissions-page/instructor-project-submissions-page.component'
          ).then((m) => m.InstructorProjectSubmissionsPageComponent),
        title: 'Entregas del proyecto · Impulso Tech',
      },
      {
        path: 'labs',
        loadComponent: () =>
          import(
            './pages/instructor-labs-page/instructor-labs-page.component'
          ).then((m) => m.InstructorLabsPageComponent),
        title: 'Laboratorios · Impulso Tech',
      },
      {
        path: 'labs/new',
        loadComponent: () =>
          import(
            './pages/instructor-lab-editor-page/instructor-lab-editor-page.component'
          ).then((m) => m.InstructorLabEditorPageComponent),
        title: 'Nuevo laboratorio · Impulso Tech',
      },
      {
        path: 'labs/:id',
        loadComponent: () =>
          import(
            './pages/instructor-lab-editor-page/instructor-lab-editor-page.component'
          ).then((m) => m.InstructorLabEditorPageComponent),
        title: 'Editar laboratorio · Impulso Tech',
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import(
            './pages/instructor-evaluations-page/instructor-evaluations-page.component'
          ).then((m) => m.InstructorEvaluationsPageComponent),
        title: 'Evaluaciones · Impulso Tech',
      },
      {
        path: 'evaluations/lessons/:lessonId/new',
        loadComponent: () =>
          import(
            './pages/instructor-evaluation-editor-page/instructor-evaluation-editor-page.component'
          ).then((m) => m.InstructorEvaluationEditorPageComponent),
        title: 'Nueva evaluación · Impulso Tech',
      },
      {
        path: 'evaluations/:id',
        loadComponent: () =>
          import(
            './pages/instructor-evaluation-editor-page/instructor-evaluation-editor-page.component'
          ).then((m) => m.InstructorEvaluationEditorPageComponent),
        title: 'Editar evaluación · Impulso Tech',
      },
      {
        path: 'courses',
        loadComponent: () =>
          import(
            './pages/instructor-courses-page/instructor-courses-page.component'
          ).then((m) => m.InstructorCoursesPageComponent),
        title: 'Mis cursos · Impulso Tech',
      },
      {
        path: 'courses/:id',
        loadComponent: () =>
          import(
            './pages/instructor-course-editor-page/instructor-course-editor-page.component'
          ).then((m) => m.InstructorCourseEditorPageComponent),
        title: 'Editar curso · Impulso Tech',
      },
    ],
  },
];
