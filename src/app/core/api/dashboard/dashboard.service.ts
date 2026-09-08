import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AdminDashboard, InstructorDashboard } from './dashboard.dto';

/**
 * Servicio que consume los paneles consolidados (RF-032, RF-033).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/dashboard`;

  /** Métricas del panel del instructor autenticado. */
  getInstructor(): Observable<InstructorDashboard> {
    return this.http.get<InstructorDashboard>(`${this.baseUrl}/instructor`);
  }

  /** Métricas globales del panel administrativo. */
  getAdmin(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.baseUrl}/admin`);
  }
}
