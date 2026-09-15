import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { convertToParamMap } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Course, CourseModule } from '../../../core/api/courses/course.dto';
import { Evaluation } from '../../../core/api/evaluations/evaluation.dto';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { InstructorEvaluationsPageComponent } from './instructor-evaluations-page.component';

/**
 * Pruebas del panel de gestión de evaluaciones (RF-020).
 *
 * <p>Cubre el flujo del selector en cascada curso → módulo → lección,
 * las acciones sobre evaluaciones y la sincronización de query params
 * para navegación por enlace directo.</p>
 */
describe('InstructorEvaluationsPageComponent', () => {
  let fixture: ComponentFixture<InstructorEvaluationsPageComponent>;
  let component: InstructorEvaluationsPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const course: Course = {
    id: 5,
    name: 'HTML y CSS',
    description: 'Curso base',
    objective: null,
    coverImageUrl: null,
    difficulty: 'PRINCIPIANTE',
    estimatedDurationHours: 16,
    technology: 'HTML',
    learningRouteId: null,
    learningRouteName: null,
    instructorId: 1,
    instructorFullName: 'Ana',
    status: 'PUBLICADO',
    generatesCertificate: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const courseModule: CourseModule = {
    id: 8,
    courseId: 5,
    name: 'Introducción',
    description: null,
    objective: null,
    orderIndex: 1,
    optional: false,
    status: 'PUBLICADO',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const lesson: Lesson = {
    id: 12,
    moduleId: 8,
    title: 'Estructura mínima',
    description: null,
    objective: null,
    content: null,
    estimatedDurationMinutes: 25,
    orderIndex: 1,
    optional: false,
    status: 'PUBLICADO',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const draft: Evaluation = {
    id: 1,
    lessonId: 12,
    name: 'Quiz A',
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

  async function setup(qp: Record<string, string> = {}): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorEvaluationsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(qp),
              paramMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorEvaluationsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga los cursos gestionados al iniciar', async () => {
    await setup();
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === `${baseUrl}/courses/manage`);
    req.flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    expect(component['courses']().length).toBe(1);
    expect(component['loadingCourses']()).toBeFalse();
  });

  it('al elegir un curso carga sus módulos y limpia módulo/lección', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`)
      .flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component['onCourseChange'](5);
    fixture.detectChanges();

    const modReq = http.expectOne(`${baseUrl}/courses/5/modules`);
    modReq.flush([courseModule]);

    expect(component['modules']().length).toBe(1);
    expect(component['moduleId']()).toBeNull();
    expect(component['lessonId']()).toBeNull();
  });

  it('al elegir un módulo carga sus lecciones', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`)
      .flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component['onCourseChange'](5);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);

    component['onModuleChange'](8);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);
    expect(component['lessons']().length).toBe(1);
  });

  it('al elegir una lección carga sus evaluaciones', async () => {
    await setup();
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`)
      .flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });

    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    component['onCourseChange'](5);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    component['onModuleChange'](8);
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);

    component['onLessonChange'](12);
    const req = http.expectOne(`${baseUrl}/lessons/12/evaluations`);
    req.flush([draft]);

    expect(component['evaluations']().length).toBe(1);
    expect(component['selectedLessonTitle']()).toBe('Estructura mínima');
  });

  it('restaura la selección desde query params al entrar por enlace', async () => {
    await setup({ course: '5', module: '8', lesson: '12' });
    fixture.detectChanges();

    // Carga inicial de cursos
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`)
      .flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    // Efectos disparados por los signals con los ids restaurados
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);
    http.expectOne(`${baseUrl}/lessons/12/evaluations`).flush([draft]);

    expect(component['courseId']()).toBe(5);
    expect(component['moduleId']()).toBe(8);
    expect(component['lessonId']()).toBe(12);
    expect(component['evaluations']().length).toBe(1);
  });

  it('publica una evaluación borrador y refleja el nuevo estado', async () => {
    await setup({ course: '5', module: '8', lesson: '12' });
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`)
      .flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);
    http.expectOne(`${baseUrl}/lessons/12/evaluations`).flush([draft]);

    component['changeStatus'](draft, 'PUBLICADO');
    const req = http.expectOne(`${baseUrl}/evaluations/${draft.id}/status`);
    expect(req.request.body).toEqual({ status: 'PUBLICADO' });
    req.flush({ ...draft, status: 'PUBLICADO' });
    expect(component['evaluations']()[0].status).toBe('PUBLICADO');
  });

  it('elimina una evaluación tras confirmación', async () => {
    await setup({ course: '5', module: '8', lesson: '12' });
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`)
      .flush({ content: [course], page: 0, size: 100, totalElements: 1, totalPages: 1 });
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);
    http.expectOne(`${baseUrl}/lessons/12/evaluations`).flush([draft]);

    spyOn(window, 'confirm').and.returnValue(true);
    component['deleteEvaluation'](draft);
    const req = http.expectOne(`${baseUrl}/evaluations/${draft.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(component['evaluations']().length).toBe(0);
  });
});
