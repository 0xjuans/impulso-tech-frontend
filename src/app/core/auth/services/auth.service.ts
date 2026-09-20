import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
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
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  /** URL base del módulo de autenticación en el backend. */
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;

  /** Señal reactiva con el usuario autenticado actual, o `null` si no lo hay. */
  private readonly _currentUser = signal<User | null>(null);

  /** Señal reactiva con el token JWT vigente, o `null` si no hay sesión. */
  private readonly _accessToken = signal<string | null>(null);

  /**
   * Identificador del temporizador que cierra la sesión al vencer el
   * token JWT. Se cancela cuando el usuario cierra sesión manualmente o
   * cuando persistimos una nueva sesión (login exitoso).
   */
  private expiryHandle: ReturnType<typeof setTimeout> | null = null;

  /** Vista pública del usuario autenticado. */
  readonly currentUser = this._currentUser.asReadonly();

  /** Indica de forma reactiva si existe una sesión iniciada. */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  constructor() {
    // Restaurar la sesión persistida al arrancar la aplicación.
    const stored = this.storage.read();
    if (stored) {
      const exp = decodeJwtExp(stored.accessToken);
      // Si el token guardado ya expiró (por ejemplo, el usuario dejó la
      // pestaña abierta más de una hora), lo desechamos y arrancamos sin
      // sesión para llevarlo a la landing en cuanto interactúe.
      if (exp !== null && exp * 1000 <= Date.now()) {
        this.storage.clear();
      } else {
        this._accessToken.set(stored.accessToken);
        this._currentUser.set(stored.user);
        this.scheduleAutoLogout(stored.accessToken);
      }
    }
  }

  /** Devuelve el token JWT actual para su uso en interceptores. */
  getAccessToken(): string | null {
    return this._accessToken();
  }

  /**
   * Reemplaza el usuario autenticado actual (por ejemplo, tras actualizar
   * el perfil desde {@code /api/users/me}) sin alterar el token vigente.
   */
  updateCurrentUser(user: User): void {
    this._currentUser.set(user);
    const token = this._accessToken();
    if (token) {
      this.storage.save({
        accessToken: token,
        tokenType: 'Bearer',
        expiresAt: '',
        user,
      });
    }
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
    this.cancelAutoLogout();
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
    this.scheduleAutoLogout(response.accessToken);
  }

  /**
   * Programa el cierre automático de sesión cuando venza el token JWT.
   *
   * <p>Al expirar, se limpia la sesión local y se redirige al usuario a
   * la landing pública. Así la plataforma no queda en un estado ambiguo
   * si el usuario deja la pestaña abierta más allá del tiempo de vida
   * del token: se le entrega de vuelta al espacio público, listo para
   * volver a iniciar sesión cuando lo necesite.</p>
   */
  private scheduleAutoLogout(token: string): void {
    this.cancelAutoLogout();
    const exp = decodeJwtExp(token);
    if (exp === null) {
      return;
    }
    const delay = exp * 1000 - Date.now();
    if (delay <= 0) {
      this.handleSessionExpired();
      return;
    }
    this.expiryHandle = setTimeout(() => this.handleSessionExpired(), delay);
  }

  /** Cancela el temporizador de expiración si estaba activo. */
  private cancelAutoLogout(): void {
    if (this.expiryHandle !== null) {
      clearTimeout(this.expiryHandle);
      this.expiryHandle = null;
    }
  }

  /**
   * Maneja el vencimiento del token: limpia la sesión y devuelve al
   * usuario a la landing principal de forma silenciosa.
   */
  private handleSessionExpired(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    this.storage.clear();
    this.cancelAutoLogout();
    // El evento notifica a otros componentes (por ejemplo, para mostrar
    // un aviso de "sesión expirada") sin acoplar el servicio de auth
    // con la capa de UI. Envolvemos en try/catch por precaución en SSR.
    try {
      this.document.dispatchEvent(new CustomEvent('impulso:session-expired'));
    } catch {
      // Ignorado: en entornos sin CustomEvent (SSR) simplemente no se dispara.
    }
    void this.router.navigateByUrl('/');
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

/**
 * Extrae el timestamp de expiración ({@code exp} en segundos Unix) de un
 * JWT sin verificar la firma. La firma la verifica exclusivamente el
 * backend; aquí solo necesitamos saber cuándo caduca para programar el
 * cierre proactivo de sesión.
 *
 * <p>Se soporta base64url (los caracteres {@code -} y {@code _}) porque
 * los JWT usan esa variante. Se devuelve {@code null} cuando el token
 * está malformado o no incluye el campo.</p>
 */
function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    // El padding puede faltar en el payload base64url; se completa aquí
    // para que atob() no falle.
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json = JSON.parse(atob(padded)) as { exp?: unknown };
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}
