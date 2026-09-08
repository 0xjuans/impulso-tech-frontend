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
    ],
  },
];
