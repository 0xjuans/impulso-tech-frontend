import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Project, ProjectSubmission } from '../../../core/api/projects/project.dto';
import { InstructorProjectSubmissionsPageComponent } from './instructor-project-submissions-page.component';

/**
 * Pruebas del panel de revisión de entregas de proyecto (RF-045).
 */
describe('InstructorProjectSubmissionsPageComponent', () => {
  let fixture: ComponentFixture<InstructorProjectSubmissionsPageComponent>;
  let component: InstructorProjectSubmissionsPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const project: Project = {
    id: 1,
    name: 'Portafolio',
    description: 'Página estática',
    objective: null, instructions: null, requirements: null,
    difficulty: 'PRINCIPIANTE',
    technologies: 'HTML', resources: null, evaluationCriteria: null,
    maxScore: 100, xpReward: 200, deadlineAt: null, status: 'PUBLICADO',
    learningRouteId: null, courseId: null, moduleId: null,
    instructorId: 5, instructorFullName: 'Ana Rueda',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  const submission: ProjectSubmission = {
    id: 10, projectId: 1, projectName: 'Portafolio',
    userId: 20, userFullName: 'Luis Torres',
    submissionNumber: 1,
    submissionUrl: 'https://github.com/luis/porta',
    studentNotes: null,
    status: 'ENVIADA', grade: null, feedback: null,
    reviewedById: null, reviewedAt: null,
    submittedAt: '2026-09-05T00:00:00Z', updatedAt: '2026-09-05T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorProjectSubmissionsPageComponent],
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
    fixture = TestBed.createComponent(InstructorProjectSubmissionsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga detalle del proyecto e intentos ENVIADA al iniciar', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    const listReq = http.expectOne(
      (r) => r.url === `${baseUrl}/projects/1/submissions` && r.params.get('status') === 'ENVIADA',
    );
    listReq.flush({ content: [submission], page: 0, size: 50, totalElements: 1, totalPages: 1 });
    expect(component['project']()?.name).toBe('Portafolio');
    expect(component['submissions']().length).toBe(1);
    expect(component['counts']().pending).toBe(1);
  });

  it('marca error si el id no es numérico', async () => {
    await setup('abc');
    fixture.detectChanges();
    expect(component['error']()).toContain('no existe');
    http.expectNone((r) => r.url.startsWith(`${baseUrl}/projects/abc`));
  });

  it('recarga al cambiar el filtro por estado', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    http.expectOne((r) => r.url === `${baseUrl}/projects/1/submissions`).flush({
      content: [submission], page: 0, size: 50, totalElements: 1, totalPages: 1,
    });
    component['statusFilter'].set('APROBADA');
    component['apply']();
    const req = http.expectOne(
      (r) => r.url === `${baseUrl}/projects/1/submissions` && r.params.get('status') === 'APROBADA',
    );
    req.flush({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
    expect(component['submissions']().length).toBe(0);
  });

  it('aplica la revisión y refleja el nuevo estado', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    http.expectOne((r) => r.url === `${baseUrl}/projects/1/submissions`).flush({
      content: [submission], page: 0, size: 50, totalElements: 1, totalPages: 1,
    });
    component['startReview'](submission);
    expect(component['reviewingId']()).toBe(submission.id);
    component['reviewStatus'].set('APROBADA');
    component['reviewGrade'].set(95);
    component['reviewFeedback'].set('Buen trabajo');
    component['submitReview'](submission);
    const req = http.expectOne(`${baseUrl}/project-submissions/${submission.id}/review`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'APROBADA', grade: 95, feedback: 'Buen trabajo' });
    req.flush({ ...submission, status: 'APROBADA', grade: 95, feedback: 'Buen trabajo' });
    const updated = component['submissions']().find((s) => s.id === submission.id);
    expect(updated?.status).toBe('APROBADA');
    expect(updated?.grade).toBe(95);
    expect(component['reviewingId']()).toBeNull();
  });

  it('muestra el mensaje del backend cuando la revisión falla', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    http.expectOne((r) => r.url === `${baseUrl}/projects/1/submissions`).flush({
      content: [submission], page: 0, size: 50, totalElements: 1, totalPages: 1,
    });
    component['startReview'](submission);
    component['submitReview'](submission);
    const req = http.expectOne(`${baseUrl}/project-submissions/${submission.id}/review`);
    req.flush({ message: 'La calificación no puede superar 100.' }, { status: 400, statusText: 'Bad Request' });
    expect(component['reviewError']()).toBe('La calificación no puede superar 100.');
    expect(component['submittingReview']()).toBeFalse();
  });
});
