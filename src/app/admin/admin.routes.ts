import { Routes } from '@angular/router';

import { roleGuard } from '../core/auth/guards/role.guard';

/**
 * Rutas del área privada del administrador.
 *
 * Todas comparten el {@link AdminShellComponent} como layout y están
 * protegidas por {@link roleGuard}, restringiendo el acceso a usuarios
 * con rol {@code ADMINISTRADOR}.
 */
export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [roleGuard('ADMINISTRADOR')],
    loadComponent: () =>
      import('./components/admin-shell/admin-shell.component').then(
        (m) => m.AdminShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard-page/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent,
          ),
        title: 'Panel del administrador · Impulso Tech',
      },
    ],
  },
];
