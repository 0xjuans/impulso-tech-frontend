import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { MessageResponse } from '../../auth/models/auth.dto';
import { User } from '../../auth/models/user.model';

/**
 * Datos que el usuario autenticado puede modificar en su propio perfil
 * (RF-005). Todos los campos son opcionales: un valor {@code null}
 * significa que el campo no se actualiza.
 */
export interface UpdateProfileRequest {
  readonly username?: string | null;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly profilePhotoUrl?: string | null;
  readonly showInRanking?: boolean | null;
}

/** Solicitud para cambiar la contraseña del usuario autenticado. */
export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/**
 * Servicio que encapsula las operaciones sobre el propio perfil del
 * usuario autenticado, expuestas por el backend en
 * {@code /api/users/me}.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users/me`;

  /** Recupera el perfil actualizado del usuario autenticado. */
  getProfile(): Observable<User> {
    return this.http.get<User>(this.baseUrl);
  }

  /** Actualiza los campos permitidos del perfil del usuario autenticado. */
  updateProfile(request: UpdateProfileRequest): Observable<User> {
    return this.http.patch<User>(this.baseUrl, request);
  }

  /** Cambia la contraseña del usuario autenticado. */
  changePassword(request: ChangePasswordRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/password`, request);
  }
}
