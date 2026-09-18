import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Lab, LabSubmission } from './lab.dto';
import { LabsService } from './labs.service';

/**
 * Pruebas del servicio HTTP de laboratorios (RF-053).
 */
describe('LabsService', () => {
  let service: LabsService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/labs`;

  const sample: Lab = {
    id: 1,
    title: 'Hola mundo',
    description: 'Primer script',
    instructions: 'Escribe print("Hola")',
    language: 'python',
    starterCode: null,
    expectedOutput: 'Hola',
    courseId: null,
    lessonId: null,
    instructorId: 5,
    status: 'BORRADOR',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const submission: LabSubmission = {
    id: 10,
    labId: 1,
    code: 'print("Hola")',
    stdout: 'Hola\n',
    stderr: null,
    exitCode: 0,
    executionTimeMs: 42,
    submittedAt: '2026-09-05T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LabsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LabsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('search omite filtros vacíos y usa page/size por defecto', () => {
    service.search().subscribe();
    const req = http.expectOne((r) => r.url === baseUrl && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    expect(req.request.params.has('q')).toBeFalse();
    expect(req.request.params.has('language')).toBeFalse();
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('search propaga los filtros suministrados', () => {
    service.search({ q: 'hola', language: 'python', courseId: 5, page: 2, size: 10 }).subscribe();
    const req = http.expectOne((r) => r.url === baseUrl);
    expect(req.request.params.get('q')).toBe('hola');
    expect(req.request.params.get('language')).toBe('python');
    expect(req.request.params.get('courseId')).toBe('5');
    expect(req.request.params.get('page')).toBe('2');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ content: [sample], page: 2, size: 10, totalElements: 1, totalPages: 1 });
  });

  it('get devuelve el detalle por id', (done) => {
    service.get(1).subscribe((r) => {
      expect(r.id).toBe(1);
      done();
    });
    http.expectOne(`${baseUrl}/1`).flush(sample);
  });

  it('create envía POST con el payload completo', (done) => {
    const payload = {
      title: 't', description: 'd', instructions: 'i', language: 'python',
    };
    service.create(payload).subscribe((r) => {
      expect(r).toEqual(sample);
      done();
    });
    const req = http.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(sample);
  });

  it('update envía PUT con el payload', () => {
    const payload = {
      title: 't2', description: 'd', instructions: 'i', language: 'python',
    };
    service.update(1, payload).subscribe();
    const req = http.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(sample);
  });

  it('delete envía DELETE', () => {
    service.delete(1).subscribe();
    const req = http.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('tryExecute envía POST a /executions', (done) => {
    const payload = { code: 'print(1)', stdin: null };
    service.tryExecute(1, payload).subscribe((r) => {
      expect(r.stdout).toBe('1\n');
      done();
    });
    const req = http.expectOne(`${baseUrl}/1/executions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ stdout: '1\n', stderr: null, exitCode: 0, executionTimeMs: 12, message: null });
  });

  it('submit envía POST a /submissions', () => {
    service.submit(1, { code: 'x', stdin: null }).subscribe();
    const req = http.expectOne(`${baseUrl}/1/submissions`);
    expect(req.request.method).toBe('POST');
    req.flush(submission);
  });

  it('listMySubmissions hace GET a /submissions/mine', () => {
    service.listMySubmissions(1).subscribe();
    const req = http.expectOne(`${baseUrl}/1/submissions/mine`);
    expect(req.request.method).toBe('GET');
    req.flush([submission]);
  });
});
