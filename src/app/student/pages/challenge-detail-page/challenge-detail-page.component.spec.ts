import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Challenge, ChallengeAttempt } from '../../../core/api/challenges/challenge.dto';
import { ChallengeDetailPageComponent } from './challenge-detail-page.component';

/**
 * Pruebas del detalle de reto en el estudiante (RF-014).
 */
describe('ChallengeDetailPageComponent', () => {
  let fixture: ComponentFixture<ChallengeDetailPageComponent>;
  let component: ChallengeDetailPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const challenge: Challenge = {
    id: 1, name: 'Suma', description: 'x', objective: null, instructions: null,
    difficulty: 'PRINCIPIANTE', allowedLanguages: 'python, javascript',
    ioExamples: null, restrictions: null, publicTestCases: null, hiddenTestCases: null,
    xpReward: 50, estimatedMinutes: 20, status: 'PUBLICADO',
    learningRouteId: null, courseId: null, moduleId: null, lessonId: null,
    instructorId: 5, instructorFullName: 'Ana',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  const attempt: ChallengeAttempt = {
    id: 10, challengeId: 1, challengeName: 'Suma',
    userId: 20, userFullName: 'Luis', attemptNumber: 1,
    language: 'python', code: 'print(1)', status: 'PENDIENTE',
    feedback: null, reviewedById: null, reviewedAt: null,
    submittedAt: '2026-09-05T00:00:00Z', updatedAt: '2026-09-05T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ChallengeDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(idParam ? { id: idParam } : {}) },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChallengeDetailPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga el reto y los intentos propios al iniciar', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/challenges/1`).flush(challenge);
    http.expectOne(`${baseUrl}/challenges/1/attempts/mine`).flush([attempt]);
    expect(component['challenge']()?.name).toBe('Suma');
    expect(component['attempts']().length).toBe(1);
    expect(component['language']()).toBe('python');
    expect(component['languageOptions']()).toEqual(['python', 'javascript']);
  });

  it('marca error si el id no es numérico', async () => {
    await setup('abc');
    fixture.detectChanges();
    expect(component['error']()).toContain('no existe');
    http.expectNone((r) => r.url.startsWith(`${baseUrl}/challenges/abc`));
  });

  it('envía un intento y lo agrega al historial', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/challenges/1`).flush(challenge);
    http.expectOne(`${baseUrl}/challenges/1/attempts/mine`).flush([]);

    component['code'].set('print(1)');
    component['submit']();
    const req = http.expectOne(`${baseUrl}/challenges/1/attempts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ language: 'python', code: 'print(1)' });
    req.flush(attempt);
    expect(component['attempts']().length).toBe(1);
    expect(component['submitOk']()).toContain('enviado');
    expect(component['code']()).toBe('');
  });

  it('muestra mensaje del backend al fallar el envío', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/challenges/1`).flush(challenge);
    http.expectOne(`${baseUrl}/challenges/1/attempts/mine`).flush([]);

    component['code'].set('print(1)');
    component['submit']();
    const req = http.expectOne(`${baseUrl}/challenges/1/attempts`);
    req.flush({ message: 'Lenguaje no permitido.' }, { status: 400, statusText: 'Bad Request' });
    expect(component['submitError']()).toBe('Lenguaje no permitido.');
  });
});
