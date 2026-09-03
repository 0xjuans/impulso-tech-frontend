import { User } from './user.model';

/**
 * Contratos de datos intercambiados con la API de autenticación del
 * backend. Cada interfaz corresponde a un DTO expuesto por Spring Boot y
 * documentado en {@code AuthController}.
 */

/** Respuesta emitida por el backend tras un inicio de sesión exitoso. */
export interface AuthResponse {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly expiresAt: string;
  readonly user: User;
}

/** Credenciales suministradas para iniciar sesión con correo y contraseña. */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

/** Datos necesarios para registrar un nuevo estudiante en la plataforma. */
export interface RegisterRequest {
  readonly email: string;
  readonly username: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
}

/**
 * Solicitud para reenviar la verificación de correo o para iniciar la
 * recuperación de contraseña. En ambos endpoints el backend responde
 * siempre con éxito para no revelar si la cuenta existe.
 */
export interface ForgotPasswordRequest {
  readonly email: string;
}

/** Solicitud para establecer una nueva contraseña desde el enlace enviado por correo. */
export interface ResetPasswordRequest {
  readonly token: string;
  readonly newPassword: string;
}

/** Solicitud de inicio de sesión mediante Google Identity Services. */
export interface GoogleLoginRequest {
  readonly idToken: string;
}

/** Mensaje simple devuelto por endpoints que solo confirman la acción. */
export interface MessageResponse {
  readonly message: string;
}

/**
 * Estructura estándar de error de la API. Se utiliza para transformar
 * respuestas HTTP fallidas en mensajes accesibles para el usuario final.
 */
export interface ApiError {
  readonly timestamp: string;
  readonly status: number;
  readonly error: string;
  readonly message: string;
  readonly path: string;
  readonly details?: readonly string[] | null;
}
