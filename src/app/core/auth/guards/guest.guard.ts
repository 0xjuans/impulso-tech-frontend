import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Guard complementario a {@link authGuard} para rutas públicas de
 * autenticación (login, registro, recuperación de contraseña).
 *
 * <p>A diferencia de un guest guard clásico, aquí <strong>no</strong> se
 * bloquea el acceso cuando el usuario ya tiene sesión iniciada: en su
 * lugar se invalida la sesión existente (localmente y contra el backend)
 * y se permite el acceso al formulario. Esto evita el bug de "no pasa
 * nada" al presionar "Iniciar sesión" desde la landing con sesión activa,
 * y garantiza que el flujo de autenticación siempre parta de un estado
 * limpio.</p>
 *
 * <p>El logout contra el backend se dispara en modo fire-and-forget: no
 * bloquea la navegación aunque el token ya haya expirado o el servidor
 * responda con error, porque {@link AuthService#logout} igual limpia la
 * sesión local.</p>
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    auth.logout().subscribe({
      next: () => undefined,
      error: () => undefined,
    });
  }
  return true;
};
