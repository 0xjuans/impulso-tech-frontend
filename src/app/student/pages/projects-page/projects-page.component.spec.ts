import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Project } from '../../../core/api/projects/project.dto';
import { ProjectsPageComponent } from './projects-page.component';

/**
 * Pruebas del catálogo de proyectos del estudiante (RF-023).
 */
describe('ProjectsPageComponent (student)', () => {
  let fixture: ComponentFixture<ProjectsPageComponent>;
  let component: ProjectsPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const sample: Project = {
    id: 1, name: 'Portafolio', description: 'x',
    objective: null, instructions: null, requirements: null,
    difficulty: 'PRINCIPIANTE', technologies: 'HTML',
    resources: null, evaluationCriteria: null,
    maxScore: 100, xpReward: 200, deadlineAt: null,
    status: 'PUBLICADO', learningRouteId: null, courseId: null, moduleId: null,
    instructorId: 5, instructorFullName: 'Ana',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProjectsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga los proyectos publicados al iniciar', () => {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects`);
    req.flush({ content: [sample], page: 0, size: 24, totalElements: 1, totalPages: 1 });
    expect(component['projects']().length).toBe(1);
  });

  it('aplica filtros de búsqueda y dificultad', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/projects`).flush({
      content: [], page: 0, size: 24, totalElements: 0, totalPages: 0,
    });
    component['search'].set('port');
    component['difficultyFilter'].set('AVANZADO');
    component['apply']();
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects` && r.params.get('search') === 'port');
    expect(req.request.params.get('difficulty')).toBe('AVANZADO');
    req.flush({ content: [], page: 0, size: 24, totalElements: 0, totalPages: 0 });
  });
});
