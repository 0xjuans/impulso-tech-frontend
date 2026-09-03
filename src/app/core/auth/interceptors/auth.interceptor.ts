import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP encargado de dos responsabilidades:
 *
 * 1. Añadir automáticamente el encabezado {@code Authorization: Bearer ...}
 *    a cada petición saliente cuando existe una sesión iniciada.
 * 2. Detectar respuestas {@code 401 Unauthorized}, limpiar la sesión
 *    local y redirigir al usuario al formulario de inicio de sesión.
 *
 * El interceptor no toca peticiones dirigidas al propio endpoint de
 * autenticación para evitar reintentos innecesarios y para permitir que
 * el backend responda con su mensaje de error específico.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getAccessToken();
  const isAuthEndpoint = req.url.includes('/api/auth/');

  const authorized =
    token && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        auth.clearSession();
        void router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url },
        });
      }
      return throwError(() => error);
    }),
  );
};
