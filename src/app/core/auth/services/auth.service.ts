import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ApiError,
  AuthResponse,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '../models/auth.dto';
import { User } from '../models/user.model';
import { AuthStorageService } from './auth-storage.service';

/**
 * Servicio central de autenticación.
 *
 * Encapsula las llamadas HTTP al módulo {@code /api/auth} del backend,
 * mantiene el estado de la sesión mediante {@link signal}s y coordina la
 * persistencia local del token JWT a través de {@link AuthStorageService}.
 *
 * El servicio no toma decisiones de autorización por sí mismo: solo
 * facilita la comunicación con el backend, expone el usuario autenticado
 * y ofrece utilidades para leer el token en interceptores y guards. La
 * autoridad final sobre los permisos siempre recae en el backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(AuthStorageService);

  /** URL base del módulo de autenticación en el backend. */
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /** Señal reactiva con el usuario autenticado actual, o `null` si no lo hay. */
  private readonly _currentUser = signal<User | null>(null);

  /** Señal reactiva con el token JWT vigente, o `null` si no hay sesión. */
  private readonly _accessToken = signal<string | null>(null);

  /** Vista pública del usuario autenticado. */
  readonly currentUser = this._currentUser.asReadonly();

  /** Indica de forma reactiva si existe una sesión iniciada. */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    // Restaurar la sesión persistida al arrancar la aplicación.
    const stored = this.storage.read();
    if (stored) {
      this._accessToken.set(stored.accessToken);
      this._currentUser.set(stored.user);
    }
  }

  /** Devuelve el token JWT actual para su uso en interceptores. */
  getAccessToken(): string | null {
    return this._accessToken();
  }

  /**
   * Registra un nuevo estudiante en la plataforma.
   *
   * El backend crea la cuenta en estado {@code PENDIENTE_VERIFICACION} y
   * envía un enlace de verificación al correo indicado. No emite token
   * JWT: el usuario deberá confirmar su correo y luego iniciar sesión.
   */
  register(request: RegisterRequest): Observable<User> {
    return this.http
      .post<User>(`${this.baseUrl}/register`, request)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /**
   * Autentica al usuario con correo y contraseña y persiste la sesión
   * resultante en el navegador.
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.persistSession(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  /** Autentica al usuario mediante un id token emitido por Google Identity Services. */
  loginWithGoogle(request: GoogleLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/google`, request).pipe(
      tap((response) => this.persistSession(response)),
      catchError((error) => this.handleError(error)),
    );
  }

  /** Invalida la sesión actual tanto en el backend como en el navegador. */
  logout(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError((error) => {
        // Aun si el backend rechaza la petición, limpiamos localmente
        // para evitar que el usuario quede atrapado con una sesión
        // corrupta.
        this.clearSession();
        return this.handleError(error);
      }),
    );
  }

  /**
   * Limpia la sesión localmente sin contactar al backend. Se utiliza
   * cuando el token ya ha expirado o el interceptor detecta un 401.
   */
  clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this.storage.clear();
  }

  /** Solicita al backend el reenvío del correo de verificación. */
  resendVerification(email: string): Observable<MessageResponse> {
    const request: ForgotPasswordRequest = { email };
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/verify/resend`, request)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** Confirma la verificación del correo utilizando el token del enlace. */
  verifyEmail(token: string): Observable<MessageResponse> {
    const params = new HttpParams().set('token', token);
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/verify`, null, { params })
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** Solicita el envío del enlace de recuperación de contraseña. */
  requestPasswordReset(request: ForgotPasswordRequest): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/password/forgot`, request)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** Establece una nueva contraseña utilizando el token de recuperación. */
  resetPassword(request: ResetPasswordRequest): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.baseUrl}/password/reset`, request)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** Persiste la respuesta de autenticación en memoria y en el navegador. */
  private persistSession(response: AuthResponse): void {
    this._accessToken.set(response.accessToken);
    this._currentUser.set(response.user);
    this.storage.save(response);
  }

  /**
   * Transforma los errores HTTP crudos en mensajes comprensibles para el
   * usuario final. Nunca se exponen trazas ni detalles internos.
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Ocurrió un error inesperado. Inténtalo nuevamente en unos minutos.';

    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const apiError = error.error as ApiError;
      message = apiError.message || message;
    } else if (error.status === 0) {
      message =
        'No pudimos conectarnos con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';
    } else if (error.status === 401) {
      message = 'Las credenciales suministradas no son correctas.';
    } else if (error.status === 403) {
      message = 'Tu cuenta no tiene permisos para realizar esta acción.';
    }

    return throwError(() => new Error(message));
  }
}
