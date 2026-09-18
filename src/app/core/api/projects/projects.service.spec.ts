import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Project, ProjectSubmission } from './project.dto';
import { ProjectsService } from './projects.service';

/**
 * Pruebas del servicio HTTP de proyectos (RF-023, RF-045).
 *
 * <p>Cubre URL, método y parámetros de los endpoints
 * {@code /api/projects}, {@code /api/projects/manage} y del endpoint
 * de revisión {@code /api/project-submissions/{id}/review}.</p>
 */
describe('ProjectsService', () => {
  let service: ProjectsService;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const sampleProject: Project = {
    id: 1,
    name: 'Portafolio',
    description: 'Página estática',
    objective: null,
    instructions: null,
    requirements: null,
    difficulty: 'PRINCIPIANTE',
    technologies: 'HTML, CSS',
    resources: null,
    evaluationCriteria: null,
    maxScore: 100,
    xpReward: 200,
    deadlineAt: null,
    status: 'BORRADOR',
    learningRouteId: null,
    courseId: null,
    moduleId: null,
    instructorId: 5,
    instructorFullName: 'Ana Rueda',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const sampleSubmission: ProjectSubmission = {
    id: 10,
    projectId: 1,
    projectName: 'Portafolio',
    userId: 20,
    userFullName: 'Luis Torres',
    submissionNumber: 1,
    submissionUrl: 'https://github.com/luis/porta',
    studentNotes: null,
    status: 'ENVIADA',
    grade: null,
    feedback: null,
    reviewedById: null,
    reviewedAt: null,
    submittedAt: '2026-09-05T00:00:00Z',
    updatedAt: '2026-09-05T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjectsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('listPublished pega a /projects con page/size por defecto', () => {
    service.listPublished().subscribe();
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects` && r.method === 'GET');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('20');
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('listPublished propaga todos los filtros', () => {
    service
      .listPublished({
        search: 'porta',
        difficulty: 'PRINCIPIANTE',
        learningRouteId: 3,
        courseId: 5,
        moduleId: 7,
        page: 1,
        size: 10,
      })
      .subscribe();
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects`);
    expect(req.request.params.get('search')).toBe('porta');
    expect(req.request.params.get('difficulty')).toBe('PRINCIPIANTE');
    expect(req.request.params.get('learningRouteId')).toBe('3');
    expect(req.request.params.get('courseId')).toBe('5');
    expect(req.request.params.get('moduleId')).toBe('7');
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('size')).toBe('10');
    req.flush({ content: [sampleProject], page: 1, size: 10, totalElements: 1, totalPages: 1 });
  });

  it('listAllForManagement pega a /manage', () => {
    service.listAllForManagement({ status: 'PUBLICADO' }).subscribe();
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects/manage`);
    expect(req.request.params.get('status')).toBe('PUBLICADO');
    req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
  });

  it('get devuelve el detalle', (done) => {
    service.get(1).subscribe((r) => {
      expect(r.id).toBe(1);
      done();
    });
    http.expectOne(`${baseUrl}/projects/1`).flush(sampleProject);
  });

  it('create hace POST y devuelve el creado', (done) => {
    const payload = { name: 'Nuevo', description: 'Desc', difficulty: 'PRINCIPIANTE' as const };
    service.create(payload).subscribe((r) => {
      expect(r).toEqual(sampleProject);
      done();
    });
    const req = http.expectOne(`${baseUrl}/projects`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(sampleProject);
  });

  it('update envía PATCH con payload parcial', () => {
    service.update(1, { name: 'renamed' }).subscribe();
    const req = http.expectOne(`${baseUrl}/projects/1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'renamed' });
    req.flush(sampleProject);
  });

  it('changeStatus envía el nuevo estado envuelto', () => {
    service.changeStatus(1, 'PUBLICADO').subscribe();
    const req = http.expectOne(`${baseUrl}/projects/1/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'PUBLICADO' });
    req.flush(sampleProject);
  });

  it('delete emite DELETE', () => {
    service.delete(9).subscribe();
    const req = http.expectOne(`${baseUrl}/projects/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  describe('submissions', () => {
    it('submitEntry hace POST a /submissions', (done) => {
      const payload = { submissionUrl: 'https://x/y', studentNotes: 'notas' };
      service.submitEntry(1, payload).subscribe((r) => {
        expect(r).toEqual(sampleSubmission);
        done();
      });
      const req = http.expectOne(`${baseUrl}/projects/1/submissions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(sampleSubmission);
    });

    it('listMySubmissions hace GET a /submissions/mine', () => {
      service.listMySubmissions(1).subscribe();
      const req = http.expectOne(`${baseUrl}/projects/1/submissions/mine`);
      expect(req.request.method).toBe('GET');
      req.flush([sampleSubmission]);
    });

    it('listProjectSubmissions filtra por estado y pagina', () => {
      service.listProjectSubmissions(1, { status: 'ENVIADA', page: 2, size: 5 }).subscribe();
      const req = http.expectOne((r) => r.url === `${baseUrl}/projects/1/submissions`);
      expect(req.request.params.get('status')).toBe('ENVIADA');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('5');
      req.flush({ content: [], page: 2, size: 5, totalElements: 0, totalPages: 0 });
    });

    it('reviewSubmission hace PATCH al endpoint de revisión', () => {
      const payload = { status: 'APROBADA' as const, grade: 95, feedback: 'Muy bien' };
      service.reviewSubmission(10, payload).subscribe();
      const req = http.expectOne(`${baseUrl}/project-submissions/10/review`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush({ ...sampleSubmission, status: 'APROBADA', grade: 95, feedback: 'Muy bien' });
    });
  });
});
