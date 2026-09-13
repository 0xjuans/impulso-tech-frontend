import { Routes } from '@angular/router';

import { authGuard } from '../core/auth/guards/auth.guard';

/**
 * Rutas del área del estudiante.
 *
 * Todas comparten el {@link StudentShellComponent} como layout y están
 * protegidas por {@link authGuard}, por lo que redirigen al inicio de
 * sesión cuando no existe una sesión activa. La autorización real sigue
 * siendo responsabilidad del backend, que valida el token en cada
 * petición.
 */
export const studentRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/student-shell/student-shell.component').then(
        (m) => m.StudentShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home-page/home-page.component').then((m) => m.HomePageComponent),
        title: 'Inicio · Impulso Tech',
      },
      {
        path: 'routes',
        loadComponent: () =>
          import('./pages/routes-page/routes-page.component').then((m) => m.RoutesPageComponent),
        title: 'Rutas de aprendizaje · Impulso Tech',
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./pages/courses-page/courses-page.component').then(
            (m) => m.CoursesPageComponent,
          ),
        title: 'Cursos · Impulso Tech',
      },
      {
        path: 'courses/:id',
        loadComponent: () =>
          import('./pages/course-detail-page/course-detail-page.component').then(
            (m) => m.CourseDetailPageComponent,
          ),
        title: 'Detalle del curso · Impulso Tech',
      },
      {
        path: 'lessons/:id',
        loadComponent: () =>
          import('./pages/lesson-page/lesson-page.component').then((m) => m.LessonPageComponent),
        title: 'Lección · Impulso Tech',
      },
      {
        path: 'resources',
        loadComponent: () =>
          import('./pages/resources-page/resources-page.component').then(
            (m) => m.ResourcesPageComponent,
          ),
        title: 'Recursos · Impulso Tech',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications-page/notifications-page.component').then(
            (m) => m.NotificationsPageComponent,
          ),
        title: 'Notificaciones · Impulso Tech',
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./pages/messages-page/messages-page.component').then(
            (m) => m.MessagesPageComponent,
          ),
        title: 'Mensajes · Impulso Tech',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent,
          ),
        title: 'Mi perfil · Impulso Tech',
      },
    ],
  },
];
