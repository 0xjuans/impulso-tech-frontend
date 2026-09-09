import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Role, UserStatus } from '../../auth/models/user.model';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import { AdminUser } from './admin-user.dto';

/**
 * Servicio que consume la gestión administrativa de usuarios
 * (RF-030, RF-031).
 */
@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/users`;

  /** Lista usuarios con filtros opcionales y paginación. */
  list(options: {
    search?: string;
    role?: Role;
    status?: UserStatus;
    page?: number;
    size?: number;
  } = {}): Observable<PagedResponse<AdminUser>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.search) params = params.set('search', options.search);
    if (options.role) params = params.set('role', options.role);
    if (options.status) params = params.set('status', options.status);
    return this.http.get<PagedResponse<AdminUser>>(this.baseUrl, { params });
  }

  /** Devuelve el detalle administrativo de un usuario. */
  get(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.baseUrl}/${id}`);
  }

  /** Cambia el rol funcional del usuario. */
  updateRole(id: number, role: Role): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/role`, { role });
  }

  /** Activa o desactiva una cuenta de usuario. */
  updateStatus(id: number, status: UserStatus): Observable<AdminUser> {
    return this.http.patch<AdminUser>(`${this.baseUrl}/${id}/status`, { status });
  }
}
