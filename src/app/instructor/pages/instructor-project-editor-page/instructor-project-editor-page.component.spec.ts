import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Project } from '../../../core/api/projects/project.dto';
import { InstructorProjectEditorPageComponent } from './instructor-project-editor-page.component';

/**
 * Pruebas del editor de proyectos (RF-023).
 */
describe('InstructorProjectEditorPageComponent', () => {
  let fixture: ComponentFixture<InstructorProjectEditorPageComponent>;
  let component: InstructorProjectEditorPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const existing: Project = {
    id: 7,
    name: 'API de tareas',
    description: 'REST',
    objective: null,
    instructions: null,
    requirements: null,
    difficulty: 'INTERMEDIO',
    technologies: 'Java',
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

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorProjectEditorPageComponent],
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
    fixture = TestBed.createComponent(InstructorProjectEditorPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  /** Responde a las requests del picker de contexto que ocurren cuando
   *  se renderiza el editor (rutas y cursos gestionados). */
  function flushPickerBoot(): void {
    http.expectOne((r) => r.url === `${baseUrl}/learning-routes/manage`).flush({
      content: [], page: 0, size: 200, totalElements: 0, totalPages: 0,
    });
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`).flush({
      content: [], page: 0, size: 200, totalElements: 0, totalPages: 0,
    });
  }

  describe('creación', () => {
    it('no permite enviar sin nombre, descripción y dificultad', async () => {
      await setup(null);
      fixture.detectChanges();
      flushPickerBoot();
      component['name'].set('X');
      component['description'].set('Y');
      expect(component['canSubmit']()).toBeFalse();
      component['difficulty'].set('PRINCIPIANTE');
      expect(component['canSubmit']()).toBeTrue();
    });

    it('envía POST y redirige al id devuelto', async () => {
      await setup(null);
      fixture.detectChanges();
      flushPickerBoot();
      const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      component['name'].set('Nuevo');
      component['description'].set('Desc');
      component['difficulty'].set('AVANZADO');
      component['maxScore'].set(120);
      component['submit']();
      const req = http.expectOne(`${baseUrl}/projects`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Nuevo');
      expect(req.request.body.difficulty).toBe('AVANZADO');
      expect(req.request.body.maxScore).toBe(120);
      req.flush({ ...existing, id: 42 });
      expect(nav).toHaveBeenCalledWith(['/instructor/projects', 42]);
    });
  });

  describe('edición', () => {
    it('carga el proyecto e hidrata los campos', async () => {
      await setup('7');
      fixture.detectChanges();
      // El picker solo se renderiza tras la carga inicial, así que el
      // GET del proyecto se atiende antes que las requests del picker.
      http.expectOne(`${baseUrl}/projects/7`).flush(existing);
      fixture.detectChanges();
      flushPickerBoot();
      expect(component['name']()).toBe('API de tareas');
      expect(component['difficulty']()).toBe('INTERMEDIO');
      expect(component['maxScore']()).toBe(100);
    });

    it('marca error si el id no es numérico', async () => {
      await setup('abc');
      fixture.detectChanges();
      expect(component['error']()).toContain('no existe');
      http.expectNone((r) => r.url.startsWith(`${baseUrl}/projects/abc`));
    });

    it('envía PATCH y refleja los cambios', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/projects/7`).flush(existing);
      fixture.detectChanges();
      flushPickerBoot();
      component['name'].set('API renombrada');
      component['submit']();
      const req = http.expectOne(`${baseUrl}/projects/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.name).toBe('API renombrada');
      req.flush({ ...existing, name: 'API renombrada' });
      expect(component['loaded']()!.name).toBe('API renombrada');
    });

    it('propaga el mensaje del backend en error', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/projects/7`).flush(existing);
      fixture.detectChanges();
      flushPickerBoot();
      component['submit']();
      const req = http.expectOne(`${baseUrl}/projects/7`);
      req.flush({ message: 'La descripción es obligatoria.' }, { status: 400, statusText: 'Bad Request' });
      expect(component['saveError']()).toBe('La descripción es obligatoria.');
    });
  });
});
