import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AdminDashboard,
  InstructorDashboard,
  RecentEnrollmentRow,
  RecentSignupRow,
  TopCourseRow,
} from './dashboard.dto';

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

  /** Top cursos del instructor autenticado por inscripciones. */
  getInstructorTopCourses(limit = 5): Observable<readonly TopCourseRow[]> {
    return this.http.get<readonly TopCourseRow[]>(
      `${this.baseUrl}/instructor/top-courses`,
      { params: new HttpParams().set('limit', limit) },
    );
  }

  /** Últimas inscripciones a cursos del instructor autenticado. */
  getInstructorRecentEnrollments(limit = 10): Observable<readonly RecentEnrollmentRow[]> {
    return this.http.get<readonly RecentEnrollmentRow[]>(
      `${this.baseUrl}/instructor/recent-enrollments`,
      { params: new HttpParams().set('limit', limit) },
    );
  }

  /** Top cursos globales por inscripciones. */
  getAdminTopCourses(limit = 5): Observable<readonly TopCourseRow[]> {
    return this.http.get<readonly TopCourseRow[]>(
      `${this.baseUrl}/admin/top-courses`,
      { params: new HttpParams().set('limit', limit) },
    );
  }

  /** Últimas inscripciones globales. */
  getAdminRecentEnrollments(limit = 10): Observable<readonly RecentEnrollmentRow[]> {
    return this.http.get<readonly RecentEnrollmentRow[]>(
      `${this.baseUrl}/admin/recent-enrollments`,
      { params: new HttpParams().set('limit', limit) },
    );
  }

  /** Últimos usuarios registrados. */
  getAdminRecentSignups(limit = 10): Observable<readonly RecentSignupRow[]> {
    return this.http.get<readonly RecentSignupRow[]>(
      `${this.baseUrl}/admin/recent-signups`,
      { params: new HttpParams().set('limit', limit) },
    );
  }
}
