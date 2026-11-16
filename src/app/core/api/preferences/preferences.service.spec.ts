import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { PreferencesService, UserPreferences } from './preferences.service';

/**
 * Pruebas del servicio HTTP de preferencias del usuario autenticado
 * (RF-060). Verifican los verbos, rutas y payloads que se envían al
 * backend.
 */
describe('PreferencesService', () => {
  let service: PreferencesService;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/users/me/preferences`;

  const sample: UserPreferences = {
    notifyProgress: true,
    notifyChallenges: true,
    notifyEvaluations: true,
    notifyAchievements: true,
    notifyReminders: true,
    notifyMascot: true,
    notifyByEmail: false,
    aiMascotEnabled: true,
    profilePublic: true,
    preferredLanguage: 'es',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PreferencesService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PreferencesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getMine hace GET al endpoint de preferencias', () => {
    service.getMine().subscribe((prefs) => expect(prefs).toEqual(sample));
    const req = http.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(sample);
  });

  it('updateMine envía un PATCH con los cambios solicitados', () => {
    service.updateMine({ notifyAchievements: false }).subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ notifyAchievements: false });
    req.flush(sample);
  });
});
