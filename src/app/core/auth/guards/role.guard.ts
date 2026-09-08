import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Role } from '../models/user.model';
import { AuthService } from '../services/auth.service';

/**
 * Guard que exige uno o más roles específicos para acceder a la ruta.
 *
 * Si el usuario no está autenticado, se le redirige al inicio de
 * sesión conservando la URL destino. Si está autenticado pero su rol
 * no coincide con los permitidos, se le redirige al área que le
 * corresponde para evitar dejarlo atrapado en una página vacía.
 *
 * La autoridad final sobre los permisos siempre recae en el backend;
 * este guard sólo mejora la experiencia de navegación.
 */
export const roleGuard =
  (...allowed: readonly Role[]): CanActivateFn =>
  (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.currentUser();
    if (!user) {
      return router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    if (allowed.includes(user.role)) {
      return true;
    }

    return router.createUrlTree([defaultAreaFor(user.role)]);
  };

/** Devuelve la ruta raíz del área correspondiente a un rol. */
export function defaultAreaFor(role: Role): string {
  switch (role) {
    case 'ADMINISTRADOR':
      return '/admin';
    case 'INSTRUCTOR':
      return '/instructor';
    case 'ESTUDIANTE':
    default:
      return '/student';
  }
}
