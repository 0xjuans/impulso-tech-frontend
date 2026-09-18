import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Challenge, ChallengeAttempt } from './challenge.dto';
import { ChallengesService } from './challenges.service';

/**
 * Pruebas del servicio HTTP de retos (RF-013, RF-037, RF-038).
 *
 * <p>Verifica URL, método y parámetros de cada endpoint contra el
 * contrato del backend en {@code /api/challenges} y del endpoint
 * {@code /api/challenge-attempts/{id}/review}.</p>
 */
describe('ChallengesService', () => {
  let service: ChallengesService;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const sampleChallenge: Challenge = {
    id: 1,
    name: 'Suma binaria',
    description: 'Suma dos enteros positivos',
    objective: null,
    instructions: null,
    difficulty: 'PRINCIPIANTE',
    allowedLanguages: 'python',
    ioExamples: '2 3 -> 5',
    restrictions: null,
    publicTestCases: null,
    hiddenTestCases: null,
    xpReward: 50,
    estimatedMinutes: 30,
    status: 'BORRADOR',
    learningRouteId: null,
    courseId: null,
    moduleId: null,
    lessonId: null,
    instructorId: 5,
    instructorFullName: 'Ana Rueda',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const sampleAttempt: ChallengeAttempt = {
    id: 10,
    challengeId: 1,
    challengeName: 'Suma binaria',
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ChallengesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ChallengesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listPublished', () => {
    it('usa page/size por defecto sin filtros', () => {
      service.listPublished().subscribe();
      const req = http.expectOne((r) => r.url === `${baseUrl}/challenges` && r.method === 'GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('20');
      expect(req.request.params.has('search')).toBeFalse();
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });

    it('propaga los filtros suministrados', () => {
      service
        .listPublished({
          search: 'sum',
          difficulty: 'PRINCIPIANTE',
          language: 'python',
          learningRouteId: 3,
          courseId: 5,
          moduleId: 7,
          lessonId: 9,
          page: 1,
          size: 10,
        })
        .subscribe();
      const req = http.expectOne((r) => r.url === `${baseUrl}/challenges`);
      expect(req.request.params.get('search')).toBe('sum');
      expect(req.request.params.get('difficulty')).toBe('PRINCIPIANTE');
      expect(req.request.params.get('language')).toBe('python');
      expect(req.request.params.get('learningRouteId')).toBe('3');
      expect(req.request.params.get('courseId')).toBe('5');
      expect(req.request.params.get('moduleId')).toBe('7');
      expect(req.request.params.get('lessonId')).toBe('9');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('10');
      req.flush({ content: [sampleChallenge], page: 1, size: 10, totalElements: 1, totalPages: 1 });
    });
  });

  describe('listAllForManagement', () => {
    it('pega a /challenges/manage con parámetros', () => {
      service.listAllForManagement({ status: 'PUBLICADO' }).subscribe();
      const req = http.expectOne((r) => r.url === `${baseUrl}/challenges/manage`);
      expect(req.request.params.get('status')).toBe('PUBLICADO');
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });
  });

  describe('get / create / update / changeStatus / delete', () => {
    it('get devuelve el detalle', (done) => {
      service.get(1).subscribe((r) => {
        expect(r.id).toBe(1);
        done();
      });
      http.expectOne(`${baseUrl}/challenges/1`).flush(sampleChallenge);
    });

    it('create hace POST y devuelve el creado', (done) => {
      const payload = {
        name: 'Nuevo',
        description: 'Desc',
        difficulty: 'PRINCIPIANTE' as const,
        allowedLanguages: 'python',
      };
      service.create(payload).subscribe((r) => {
        expect(r).toEqual(sampleChallenge);
        done();
      });
      const req = http.expectOne(`${baseUrl}/challenges`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(sampleChallenge);
    });

    it('update envía PATCH con payload parcial', () => {
      service.update(1, { name: 'renamed' }).subscribe();
      const req = http.expectOne(`${baseUrl}/challenges/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ name: 'renamed' });
      req.flush(sampleChallenge);
    });

    it('changeStatus envía el nuevo estado envuelto', () => {
      service.changeStatus(1, 'PUBLICADO').subscribe();
      const req = http.expectOne(`${baseUrl}/challenges/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'PUBLICADO' });
      req.flush(sampleChallenge);
    });

    it('delete emite DELETE al endpoint del reto', () => {
      service.delete(9).subscribe();
      const req = http.expectOne(`${baseUrl}/challenges/9`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('attempts', () => {
    it('submitAttempt hace POST a /attempts', (done) => {
      const payload = { language: 'python', code: 'print(1)' };
      service.submitAttempt(1, payload).subscribe((r) => {
        expect(r).toEqual(sampleAttempt);
        done();
      });
      const req = http.expectOne(`${baseUrl}/challenges/1/attempts`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(sampleAttempt);
    });

    it('listMyAttempts hace GET a /attempts/mine', () => {
      service.listMyAttempts(1).subscribe();
      const req = http.expectOne(`${baseUrl}/challenges/1/attempts/mine`);
      expect(req.request.method).toBe('GET');
      req.flush([sampleAttempt]);
    });

    it('listChallengeAttempts pagina y filtra por estado', () => {
      service.listChallengeAttempts(1, { status: 'PENDIENTE', page: 2, size: 5 }).subscribe();
      const req = http.expectOne((r) => r.url === `${baseUrl}/challenges/1/attempts`);
      expect(req.request.params.get('status')).toBe('PENDIENTE');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('5');
      req.flush({ content: [], page: 2, size: 5, totalElements: 0, totalPages: 0 });
    });

    it('reviewAttempt hace PATCH al endpoint de revisión', () => {
      const payload = { status: 'APROBADO' as const, feedback: 'Buen trabajo' };
      service.reviewAttempt(10, payload).subscribe();
      const req = http.expectOne(`${baseUrl}/challenge-attempts/10/review`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...sampleAttempt, status: 'APROBADO', feedback: 'Buen trabajo' });
    });
  });
});
