import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Evaluation, EvaluationAttempt } from './evaluation.dto';
import { EvaluationsService } from './evaluations.service';

/**
 * Pruebas del servicio HTTP de evaluaciones (RF-020, RF-046).
 */
describe('EvaluationsService', () => {
  let service: EvaluationsService;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const sample: Evaluation = {
    id: 1,
    lessonId: 12,
    name: 'Quiz',
    description: null,
    instructions: null,
    timeLimitMinutes: 15,
    passingPercentage: 70,
    maxAttempts: 2,
    orderIndex: 1,
    status: 'BORRADOR',
    questions: [],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const attempt: EvaluationAttempt = {
    id: 5,
    evaluationId: 1,
    startedAt: '2026-09-05T00:00:00Z',
    finishedAt: '2026-09-05T00:15:00Z',
    totalScore: 8,
    maxPossibleScore: 10,
    percentage: 80,
    passed: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EvaluationsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EvaluationsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listByLesson pega a /lessons/:id/evaluations', () => {
    service.listByLesson(12).subscribe();
    const req = http.expectOne(`${baseUrl}/lessons/12/evaluations`);
    expect(req.request.method).toBe('GET');
    req.flush([sample]);
  });

  it('get devuelve la evaluación por id', (done) => {
    service.get(1).subscribe((e) => {
      expect(e.id).toBe(1);
      done();
    });
    http.expectOne(`${baseUrl}/evaluations/1`).flush(sample);
  });

  it('create hace POST bajo /lessons/:id/evaluations', (done) => {
    const payload = { name: 'Nuevo', passingPercentage: 60, maxAttempts: 1, orderIndex: 1 };
    service.create(12, payload).subscribe((e) => {
      expect(e).toEqual(sample);
      done();
    });
    const req = http.expectOne(`${baseUrl}/lessons/12/evaluations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(sample);
  });

  it('update envía PATCH parcial', () => {
    service.update(1, { name: 'renamed' }).subscribe();
    const req = http.expectOne(`${baseUrl}/evaluations/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'renamed' });
    req.flush(sample);
  });

  it('changeStatus envía PATCH con el estado envuelto', () => {
    service.changeStatus(1, 'PUBLICADO').subscribe();
    const req = http.expectOne(`${baseUrl}/evaluations/1/status`);
    expect(req.request.body).toEqual({ status: 'PUBLICADO' });
    req.flush(sample);
  });

  it('delete envía DELETE', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(`${baseUrl}/evaluations/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('addQuestion hace POST a /evaluations/:id/questions', () => {
    const payload = {
      orderIndex: 1,
      type: 'VERDADERO_FALSO' as const,
      questionText: '¿Cierto o falso?',
      score: 1,
      config: '{"correct":true}',
    };
    service.addQuestion(1, payload).subscribe();
    const req = http.expectOne(`${baseUrl}/evaluations/1/questions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(sample);
  });

  it('deleteQuestion pega al endpoint de la pregunta', () => {
    service.deleteQuestion(99).subscribe();
    const req = http.expectOne(`${baseUrl}/evaluation-questions/99`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  describe('intentos', () => {
    it('startAttempt hace POST con body vacío', () => {
      service.startAttempt(1).subscribe();
      const req = http.expectOne(`${baseUrl}/evaluations/1/attempts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(attempt);
    });

    it('submitAttempt envía el JSON de respuestas', () => {
      const payload = { answers: '{"1":"a"}' };
      service.submitAttempt(1, payload).subscribe();
      const req = http.expectOne(`${baseUrl}/evaluations/1/attempts/submit`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(attempt);
    });

    it('listMyAttempts hace GET al endpoint de intentos', () => {
      service.listMyAttempts(1).subscribe();
      const req = http.expectOne(`${baseUrl}/evaluations/1/attempts`);
      expect(req.request.method).toBe('GET');
      req.flush([attempt]);
    });
  });
});
