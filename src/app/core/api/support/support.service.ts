import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../learning-routes/learning-route.dto';
import {
  SupportTicket,
  SupportTicketStatus,
  SupportTicketType,
  UpdateTicketRequest,
} from './support.dto';

/**
 * Servicio del módulo de soporte (RF-036).
 *
 * <p>Expone las operaciones administrativas (listar y actualizar
 * tickets asignados) que consume el panel del staff. Las operaciones
 * del estudiante se manejan por separado desde su propio flujo.</p>
 */
@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly adminBaseUrl = `${environment.apiBaseUrl}/admin/support/tickets`;

  /** Lista tickets con filtros opcionales, paginados. */
  listAdmin(options: {
    status?: SupportTicketStatus;
    type?: SupportTicketType;
    assigneeId?: number;
    page?: number;
    size?: number;
  } = {}): Observable<PagedResponse<SupportTicket>> {
    let params = new HttpParams()
      .set('page', options.page ?? 0)
      .set('size', options.size ?? 20);
    if (options.status) params = params.set('status', options.status);
    if (options.type) params = params.set('type', options.type);
    if (options.assigneeId != null) params = params.set('assigneeId', options.assigneeId);
    return this.http.get<PagedResponse<SupportTicket>>(this.adminBaseUrl, { params });
  }

  /** Actualiza el estado, la asignación o las notas de resolución. */
  update(id: number, request: UpdateTicketRequest): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.adminBaseUrl}/${id}`, request);
  }
}
