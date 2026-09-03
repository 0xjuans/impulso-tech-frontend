import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guard que protege rutas exigiendo una sesión activa.
 *
 * Si el usuario no está autenticado se redirige al formulario de inicio
 * de sesión conservando la URL destino como {@code returnUrl}, para
 * llevarlo de vuelta una vez autenticado.
 *
 * Este guard solo mejora la experiencia y la navegación: cualquier
 * operación sensible debe seguir siendo validada por el backend, que es
 * la autoridad final sobre los permisos.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
