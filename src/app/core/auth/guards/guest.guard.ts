import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guard complementario a {@link authGuard} que impide el acceso a rutas
 * públicas (como login o registro) cuando el usuario ya tiene una sesión
 * iniciada.
 *
 * En ese caso se le redirige al dashboard principal para evitar mostrar
 * pantallas de autenticación innecesarias.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/']);
};
