import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  Badge,
  RankingPeriod,
  RankingResponse,
  UserBadge,
  UserStreak,
  UserXp,
} from './gamification.dto';

/**
 * Servicio que consume los endpoints de gamificación (RF-018 a RF-021).
 *
 * Ofrece lecturas puntuales del estado de XP, racha, insignias y
 * ranking del estudiante autenticado. Las mutaciones ocurren en el
 * backend como efecto secundario de completar lecciones, retos y
 * proyectos, por lo que aquí solo se exponen operaciones de lectura.
 */
@Injectable({ providedIn: 'root' })
export class GamificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /** Recupera el estado de XP y nivel del usuario autenticado. */
  getMyXp(): Observable<UserXp> {
    return this.http.get<UserXp>(`${this.baseUrl}/users/me/xp`);
  }

  /** Recupera la racha actual y el récord histórico. */
  getMyStreak(): Observable<UserStreak> {
    return this.http.get<UserStreak>(`${this.baseUrl}/users/me/streak`);
  }

  /** Lista las insignias obtenidas por el usuario autenticado. */
  listMyBadges(): Observable<readonly UserBadge[]> {
    return this.http.get<readonly UserBadge[]>(`${this.baseUrl}/users/me/badges`);
  }

  /** Consulta el ranking global por el periodo indicado. */
  getRanking(period: RankingPeriod = 'ALL_TIME', limit = 10): Observable<RankingResponse> {
    const params = new HttpParams().set('period', period).set('limit', limit);
    return this.http.get<RankingResponse>(`${this.baseUrl}/rankings`, { params });
  }

  /** Devuelve el catálogo completo de insignias activas. */
  listCatalog(): Observable<readonly Badge[]> {
    return this.http.get<readonly Badge[]>(`${this.baseUrl}/badges`);
  }
}
