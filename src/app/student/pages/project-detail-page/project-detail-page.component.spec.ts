import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Project, ProjectSubmission } from '../../../core/api/projects/project.dto';
import { ProjectDetailPageComponent } from './project-detail-page.component';

/**
 * Pruebas del detalle de proyecto para el estudiante (RF-023).
 */
describe('ProjectDetailPageComponent', () => {
  let fixture: ComponentFixture<ProjectDetailPageComponent>;
  let component: ProjectDetailPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const project: Project = {
    id: 1, name: 'Portafolio', description: 'x',
    objective: null, instructions: null, requirements: null,
    difficulty: 'PRINCIPIANTE', technologies: 'HTML',
    resources: null, evaluationCriteria: null,
    maxScore: 100, xpReward: 200, deadlineAt: null,
    status: 'PUBLICADO', learningRouteId: null, courseId: null, moduleId: null,
    instructorId: 5, instructorFullName: 'Ana',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  const submission: ProjectSubmission = {
    id: 10, projectId: 1, projectName: 'Portafolio',
    userId: 20, userFullName: 'Luis', submissionNumber: 1,
    submissionUrl: 'https://x/y', studentNotes: null,
    status: 'ENVIADA', grade: null, feedback: null,
    reviewedById: null, reviewedAt: null,
    submittedAt: '2026-09-05T00:00:00Z', updatedAt: '2026-09-05T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [ProjectDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(idParam ? { id: idParam } : {}) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProjectDetailPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga el proyecto y las entregas propias', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    http.expectOne(`${baseUrl}/projects/1/submissions/mine`).flush([submission]);
    expect(component['project']()?.name).toBe('Portafolio');
    expect(component['submissions']().length).toBe(1);
  });

  it('marca error si el id no es numérico', async () => {
    await setup('abc');
    fixture.detectChanges();
    expect(component['error']()).toContain('no existe');
  });

  it('envía una entrega válida y la agrega al historial', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    http.expectOne(`${baseUrl}/projects/1/submissions/mine`).flush([]);

    component['submissionUrl'].set('https://github.com/mia/porta');
    component['submit']();
    const req = http.expectOne(`${baseUrl}/projects/1/submissions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ submissionUrl: 'https://github.com/mia/porta', studentNotes: null });
    req.flush(submission);
    expect(component['submissions']().length).toBe(1);
    expect(component['submitOk']()).toContain('enviada');
    expect(component['submissionUrl']()).toBe('');
  });

  it('bloquea el envío cuando la URL está vacía', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/projects/1`).flush(project);
    http.expectOne(`${baseUrl}/projects/1/submissions/mine`).flush([]);

    component['submissionUrl'].set('   ');
    expect(component['canSubmit']()).toBeFalse();
    component['submit']();
    http.expectNone((r) => r.method === 'POST');
  });
});
