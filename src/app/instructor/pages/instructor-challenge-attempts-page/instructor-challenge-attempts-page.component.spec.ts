import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Challenge, ChallengeAttempt } from '../../../core/api/challenges/challenge.dto';
import { InstructorChallengeAttemptsPageComponent } from './instructor-challenge-attempts-page.component';

/**
 * Pruebas del panel de revisión de intentos (RF-038).
 *
 * <p>Verifica la carga inicial (detalle del reto + intentos filtrados
 * por PENDIENTE), el cambio de filtro, el flujo de revisión con estado
 * y feedback, y el manejo del mensaje de error del backend.</p>
 */
describe('InstructorChallengeAttemptsPageComponent', () => {
  let fixture: ComponentFixture<InstructorChallengeAttemptsPageComponent>;
  let component: InstructorChallengeAttemptsPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const challenge: Challenge = {
    id: 1,
    name: 'Suma',
    description: 'Suma dos enteros',
    objective: null,
    instructions: null,
    difficulty: 'PRINCIPIANTE',
    allowedLanguages: 'python',
    ioExamples: null,
    restrictions: null,
    publicTestCases: null,
    hiddenTestCases: null,
    xpReward: 50,
    estimatedMinutes: 30,
    status: 'PUBLICADO',
    learningRouteId: null,
    courseId: null,
    moduleId: null,
    lessonId: null,
    instructorId: 5,
    instructorFullName: 'Ana Rueda',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const attempt: ChallengeAttempt = {
    id: 10,
    challengeId: 1,
    challengeName: 'Suma',
    userId: 20,
    userFullName: 'Luis Torres',
    attemptNumber: 1,
    language: 'python',
    code: 'print(a+b)',
    status: 'PENDIENTE',
    feedback: null,
    reviewedById: null,
    reviewedAt: null,
    submittedAt: '2026-09-05T00:00:00Z',
    updatedAt: '2026-09-05T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorChallengeAttemptsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? idParam : null) } } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorChallengeAttemptsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga detalle del reto e intentos pendientes al iniciar', async () => {
    await setup('1');
    fixture.detectChanges();

    // Se dispara la carga de detalle + la de intentos con status=PENDIENTE.
    const detailReq = http.expectOne(`${baseUrl}/challenges/1`);
    detailReq.flush(challenge);

    const listReq = http.expectOne(
      (r) => r.url === `${baseUrl}/challenges/1/attempts` && r.params.get('status') === 'PENDIENTE',
    );
    listReq.flush({ content: [attempt], page: 0, size: 50, totalElements: 1, totalPages: 1 });

    expect(component['challenge']()!.name).toBe('Suma');
    expect(component['attempts']().length).toBe(1);
    expect(component['counts']().pending).toBe(1);
  });

  it('marca error si el id no es numérico', async () => {
    await setup('abc');
    fixture.detectChanges();
    expect(component['error']()).toContain('no existe');
    http.expectNone((r) => r.url.startsWith(`${baseUrl}/challenges/abc`));
  });

  it('recarga con nuevo filtro al cambiar el estado seleccionado', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/challenges/1`).flush(challenge);
    http.expectOne((r) => r.url === `${baseUrl}/challenges/1/attempts`).flush({
      content: [attempt],
      page: 0,
      size: 50,
      totalElements: 1,
      totalPages: 1,
    });

    component['statusFilter'].set('APROBADO');
    component['apply']();
    const req = http.expectOne(
      (r) => r.url === `${baseUrl}/challenges/1/attempts` && r.params.get('status') === 'APROBADO',
    );
    req.flush({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
    expect(component['attempts']().length).toBe(0);
  });

  it('publica la revisión y refleja el nuevo estado del intento', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/challenges/1`).flush(challenge);
    http
      .expectOne((r) => r.url === `${baseUrl}/challenges/1/attempts`)
      .flush({ content: [attempt], page: 0, size: 50, totalElements: 1, totalPages: 1 });

    component['startReview'](attempt);
    expect(component['reviewingId']()).toBe(attempt.id);
    component['reviewStatus'].set('APROBADO');
    component['reviewFeedback'].set('Bien hecho');
    component['submitReview'](attempt);

    const req = http.expectOne(`${baseUrl}/challenge-attempts/${attempt.id}/review`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'APROBADO', feedback: 'Bien hecho' });
    req.flush({ ...attempt, status: 'APROBADO', feedback: 'Bien hecho' });

    const updated = component['attempts']().find((a) => a.id === attempt.id);
    expect(updated?.status).toBe('APROBADO');
    expect(component['reviewingId']()).toBeNull();
  });

  it('muestra el mensaje del backend cuando la revisión falla', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/challenges/1`).flush(challenge);
    http
      .expectOne((r) => r.url === `${baseUrl}/challenges/1/attempts`)
      .flush({ content: [attempt], page: 0, size: 50, totalElements: 1, totalPages: 1 });

    component['startReview'](attempt);
    component['submitReview'](attempt);
    const req = http.expectOne(`${baseUrl}/challenge-attempts/${attempt.id}/review`);
    req.flush({ message: 'Estado inválido' }, { status: 400, statusText: 'Bad Request' });
    expect(component['reviewError']()).toBe('Estado inválido');
    expect(component['submittingReview']()).toBeFalse();
  });
});
