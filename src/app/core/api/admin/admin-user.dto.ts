/**
 * DTOs del panel administrativo de usuarios (RF-030, RF-031).
 */
import { Role, UserStatus } from '../../auth/models/user.model';

/** Representación administrativa detallada de un usuario. */
export interface AdminUser {
  readonly id: number;
  readonly email: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly profilePhotoUrl: string | null;
  readonly role: Role;
  readonly status: UserStatus;
  readonly emailVerifiedAt: string | null;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
