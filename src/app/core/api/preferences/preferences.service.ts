import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

/**
 * Representación pública de las preferencias del usuario autenticado
 * (RF-060).
 */
export interface UserPreferences {
  readonly notifyProgress: boolean;
  readonly notifyChallenges: boolean;
  readonly notifyEvaluations: boolean;
  readonly notifyAchievements: boolean;
  readonly notifyReminders: boolean;
  readonly notifyMascot: boolean;
  readonly notifyByEmail: boolean;
  readonly aiMascotEnabled: boolean;
  readonly profilePublic: boolean;
  readonly preferredLanguage: string;
  readonly updatedAt: string;
}

/**
 * Cambios parciales aplicables a las preferencias del usuario. Un
 * valor {@code undefined} deja el campo sin modificar.
 */
export type UpdatePreferencesRequest = Partial<Omit<UserPreferences, 'updatedAt'>>;

/**
 * Servicio que expone el endpoint {@code /api/users/me/preferences}
 * para consultar y actualizar las preferencias personales del usuario
 * autenticado.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/users/me/preferences`;

  /** Consulta las preferencias del usuario autenticado. */
  getMine(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.baseUrl);
  }

  /** Aplica los cambios enviados sobre las preferencias del usuario. */
  updateMine(request: UpdatePreferencesRequest): Observable<UserPreferences> {
    return this.http.patch<UserPreferences>(this.baseUrl, request);
  }
}
