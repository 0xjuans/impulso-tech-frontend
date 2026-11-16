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
        path: 'notifications',
        loadComponent: () =>
          import(
            '../student/pages/notifications-page/notifications-page.component'
          ).then((m) => m.NotificationsPageComponent),
        title: 'Notificaciones · Impulso Tech',
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('../student/pages/messages-page/messages-page.component').then(
            (m) => m.MessagesPageComponent,
          ),
        title: 'Mensajes · Impulso Tech',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import(
            '../shared/pages/account-profile-page/account-profile-page.component'
          ).then((m) => m.AccountProfilePageComponent),
        title: 'Mi perfil · Impulso Tech',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard-page/admin-dashboard-page.component').then(
            (m) => m.AdminDashboardPageComponent,
          ),
        title: 'Panel del administrador · Impulso Tech',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin-users-page/admin-users-page.component').then(
            (m) => m.AdminUsersPageComponent,
          ),
        title: 'Gestión de usuarios · Impulso Tech',
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./pages/admin-support-page/admin-support-page.component').then(
            (m) => m.AdminSupportPageComponent,
          ),
        title: 'Tickets de soporte · Impulso Tech',
      },
    ],
  },
];
