import { Routes } from '@angular/router';

import { guestGuard } from '../core/auth/guards/guest.guard';

/**
 * Rutas del módulo de autenticación.
 *
 * Todas comparten el layout {@link AuthShellComponent}, un contenedor de
 * dos columnas con branding a la izquierda y el formulario activo a la
 * derecha. Cada pantalla se carga de forma diferida (lazy) para no
 * inflar el bundle inicial de la aplicación.
 *
 * Las rutas de login y registro utilizan {@link guestGuard} para impedir
 * que un usuario ya autenticado vuelva a acceder a ellas. La verificación
 * de correo y el restablecimiento de contraseña, en cambio, permanecen
 * accesibles a cualquier visitante porque pueden ser abiertas desde un
 * enlace de correo antes de iniciar sesión.
 */
export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/auth-shell/auth-shell.component').then((m) => m.AuthShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/login-page/login-page.component').then((m) => m.LoginPageComponent),
        title: 'Iniciar sesión · Impulso Tech',
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/register-page/register-page.component').then(
            (m) => m.RegisterPageComponent,
          ),
        title: 'Crear cuenta · Impulso Tech',
      },
      {
        path: 'verify',
        loadComponent: () =>
          import('./pages/verify-page/verify-page.component').then((m) => m.VerifyPageComponent),
        title: 'Verificar correo · Impulso Tech',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password-page/forgot-password-page.component').then(
            (m) => m.ForgotPasswordPageComponent,
          ),
        title: 'Recuperar contraseña · Impulso Tech',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./pages/reset-password-page/reset-password-page.component').then(
            (m) => m.ResetPasswordPageComponent,
          ),
        title: 'Restablecer contraseña · Impulso Tech',
      },
    ],
  },
];
