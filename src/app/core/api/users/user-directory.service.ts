import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Role } from '../../auth/models/user.model';

/**
 * Coincidencia devuelta por el directorio público de usuarios
 * (RF-061). No incluye datos sensibles como el correo.
 */
export interface UserDirectoryResult {
  readonly id: number;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly profilePhotoUrl: string | null;
  readonly role: Role;
}

/**
 * Servicio que consume el directorio público para poblar el buscador
 * de destinatarios de la mensajería directa.
 */
@Injectable({ providedIn: 'root' })
export class UserDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users/directory`;

  /** Busca hasta {@code limit} coincidencias por username, nombre o apellido. */
  search(query: string, limit = 10): Observable<UserDirectoryResult[]> {
    const params = new HttpParams().set('q', query).set('limit', limit);
    return this.http.get<UserDirectoryResult[]>(`${this.baseUrl}/search`, { params });
  }
}
