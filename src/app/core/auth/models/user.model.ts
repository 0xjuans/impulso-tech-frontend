/**
 * Roles funcionales definidos por Impulso Tech.
 *
 * Refleja el enum {@code Role} del backend y se utiliza en el frontend
 * únicamente para adaptar la interfaz al perfil del usuario autenticado.
 * La autoridad final sobre los permisos siempre recae en el backend.
 */
export type Role = 'ESTUDIANTE' | 'INSTRUCTOR' | 'ADMINISTRADOR';

/**
 * Estados posibles del ciclo de vida de una cuenta de usuario, reflejo
 * del enum {@code UserStatus} del backend.
 */
export type UserStatus = 'PENDIENTE_VERIFICACION' | 'ACTIVA' | 'DESACTIVADA';

/**
 * Representación pública de un usuario autenticado.
 *
 * Contiene únicamente la información necesaria para renderizar la interfaz
 * y tomar decisiones de navegación. Nunca incluye datos sensibles como
 * hashes de contraseña o tokens internos.
 */
export interface User {
  readonly id: number;
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly profilePhotoUrl: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly emailVerifiedAt: string | null;
  readonly createdAt: string;
}
