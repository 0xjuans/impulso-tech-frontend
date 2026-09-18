import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Project } from '../../../core/api/projects/project.dto';
import { InstructorProjectsPageComponent } from './instructor-projects-page.component';

/**
 * Pruebas del panel de gestión de proyectos del instructor (RF-023).
 */
describe('InstructorProjectsPageComponent', () => {
  let fixture: ComponentFixture<InstructorProjectsPageComponent>;
  let component: InstructorProjectsPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const draft: Project = {
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

  const published: Project = { ...draft, id: 2, name: 'API', status: 'PUBLICADO' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorProjectsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorProjectsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitial(list: Project[] = [draft, published]): void {
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects/manage`);
    req.flush({ content: list, page: 0, size: 50, totalElements: list.length, totalPages: 1 });
  }

  it('carga los proyectos del endpoint /manage al iniciar', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['loading']()).toBeFalse();
    expect(component['projects']().length).toBe(2);
  });

  it('propaga los filtros al aplicar', () => {
    fixture.detectChanges();
    flushInitial();
    component['search'].set('porta');
    component['difficultyFilter'].set('AVANZADO');
    component['statusFilter'].set('PUBLICADO');
    component['apply']();
    const req = http.expectOne((r) => r.url === `${baseUrl}/projects/manage` && r.params.get('search') === 'porta');
    expect(req.request.params.get('difficulty')).toBe('AVANZADO');
    expect(req.request.params.get('status')).toBe('PUBLICADO');
    req.flush({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
  });

  it('publica un proyecto borrador reflejando el nuevo estado', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](draft, 'PUBLICADO');
    const req = http.expectOne(`${baseUrl}/projects/${draft.id}/status`);
    expect(req.request.body).toEqual({ status: 'PUBLICADO' });
    req.flush({ ...draft, status: 'PUBLICADO' });
    expect(component['projects']().find((p) => p.id === draft.id)?.status).toBe('PUBLICADO');
  });

  it('no envía cambio de estado si ya está en ese estado', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](published, 'PUBLICADO');
    http.expectNone((r) => r.url.endsWith('/status'));
    expect(component['pendingActionId']()).toBeNull();
  });

  it('elimina un proyecto tras confirmación', () => {
    fixture.detectChanges();
    flushInitial();
    spyOn(window, 'confirm').and.returnValue(true);
    component['deleteProject'](draft);
    const req = http.expectOne(`${baseUrl}/projects/${draft.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(component['projects']().find((p) => p.id === draft.id)).toBeUndefined();
  });

  it('no elimina si se cancela la confirmación', () => {
    fixture.detectChanges();
    flushInitial();
    const spy = spyOn(window, 'confirm').and.returnValue(false);
    component['deleteProject'](draft);
    expect(spy).toHaveBeenCalled();
    http.expectNone((r) => r.method === 'DELETE');
  });

  it('calcula contadores por estado', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['counts']().total).toBe(2);
    expect(component['counts']().published).toBe(1);
    expect(component['counts']().draft).toBe(1);
  });

  it('renderiza los proyectos en el DOM', () => {
    fixture.detectChanges();
    flushInitial();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.project');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.project__title')?.textContent).toContain('Portafolio');
  });
});
