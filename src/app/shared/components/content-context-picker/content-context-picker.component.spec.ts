import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { Course, CourseModule } from '../../../core/api/courses/course.dto';
import { LearningRoute } from '../../../core/api/learning-routes/learning-route.dto';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { ContentContextPickerComponent } from './content-context-picker.component';

/**
 * Pruebas del selector de contexto educativo reutilizable.
 *
 * <p>Cubre la carga inicial de rutas y cursos, la cascada al elegir
 * curso y módulo, la emisión del valor combinado y la aceptación del
 * valor entrante para modo edición.</p>
 */
describe('ContentContextPickerComponent', () => {
  let fixture: ComponentFixture<ContentContextPickerComponent>;
  let component: ContentContextPickerComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const route: LearningRoute = {
    id: 3,
    name: 'Fundamentos web',
    description: 'x',
    objective: null,
    coverImageUrl: null,
    difficulty: 'PRINCIPIANTE',
    estimatedDurationHours: 40,
    technologies: null,
    status: 'PUBLICADO',
    instructorId: 1,
    instructorFullName: 'Ana',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const course: Course = {
    id: 5,
    name: 'HTML',
    description: 'y',
    objective: null,
    coverImageUrl: null,
    difficulty: 'PRINCIPIANTE',
    estimatedDurationHours: 10,
    technology: 'HTML',
    learningRouteId: 3,
    learningRouteName: 'Fundamentos web',
    instructorId: 1,
    instructorFullName: 'Ana',
    status: 'PUBLICADO',
    generatesCertificate: false,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const courseOtherRoute: Course = { ...course, id: 6, name: 'JS', learningRouteId: 99 };

  const courseModule: CourseModule = {
    id: 8,
    courseId: 5,
    name: 'Intro',
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContentContextPickerComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ContentContextPickerComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitial(): void {
    http.expectOne((r) => r.url === `${baseUrl}/learning-routes/manage`).flush({
      content: [route], page: 0, size: 200, totalElements: 1, totalPages: 1,
    });
    http.expectOne((r) => r.url === `${baseUrl}/courses/manage`).flush({
      content: [course, courseOtherRoute], page: 0, size: 200, totalElements: 2, totalPages: 1,
    });
  }

  it('carga rutas y cursos al iniciar', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['routes']().length).toBe(1);
    expect(component['courses']().length).toBe(2);
  });

  it('filtra cursos por ruta seleccionada', () => {
    fixture.detectChanges();
    flushInitial();
    component['onRouteChange'](3);
    expect(component['filteredCourses']().map((c) => c.id)).toEqual([5]);
  });

  it('carga módulos al elegir curso y emite el nuevo valor', () => {
    fixture.detectChanges();
    flushInitial();
    const spy = spyOn(component.valueChange, 'emit');
    component['onCourseChange'](5);
    const req = http.expectOne(`${baseUrl}/courses/5/modules`);
    req.flush([courseModule]);
    expect(component['modules']().length).toBe(1);
    expect(spy).toHaveBeenCalledWith({ learningRouteId: null, courseId: 5, moduleId: null, lessonId: null });
  });

  it('carga lecciones al elegir módulo', () => {
    fixture.detectChanges();
    flushInitial();
    component['onCourseChange'](5);
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    component['onModuleChange'](8);
    const req = http.expectOne(`${baseUrl}/course-modules/8/lessons`);
    req.flush([lesson]);
    expect(component['lessons']().length).toBe(1);
  });

  it('emite valores con la lección incluida', () => {
    fixture.detectChanges();
    flushInitial();
    const spy = spyOn(component.valueChange, 'emit');
    component['onCourseChange'](5);
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    component['onModuleChange'](8);
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);
    component['onLessonChange'](12);
    const last = spy.calls.mostRecent().args[0];
    expect(last).toEqual({ learningRouteId: null, courseId: 5, moduleId: 8, lessonId: 12 });
  });

  it('al cambiar la ruta limpia curso/módulo/lección', () => {
    fixture.detectChanges();
    flushInitial();
    component['onCourseChange'](5);
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    component['onModuleChange'](8);
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);

    const spy = spyOn(component.valueChange, 'emit');
    component['onRouteChange'](3);
    expect(component['courseId']()).toBeNull();
    expect(component['moduleId']()).toBeNull();
    expect(component['lessonId']()).toBeNull();
    expect(spy).toHaveBeenCalledWith({ learningRouteId: 3, courseId: null, moduleId: null, lessonId: null });
  });

  it('acepta un valor externo y precarga módulos/lecciones', () => {
    component.value = { learningRouteId: 3, courseId: 5, moduleId: 8, lessonId: 12 };
    fixture.detectChanges();
    flushInitial();
    http.expectOne(`${baseUrl}/courses/5/modules`).flush([courseModule]);
    http.expectOne(`${baseUrl}/course-modules/8/lessons`).flush([lesson]);
    expect(component['routeId']()).toBe(3);
    expect(component['courseId']()).toBe(5);
    expect(component['moduleId']()).toBe(8);
    expect(component['lessonId']()).toBe(12);
  });

  it('oculta el selector de lección cuando showLesson es false', () => {
    component.showLesson = false;
    fixture.detectChanges();
    flushInitial();
    const selects = (fixture.nativeElement as HTMLElement).querySelectorAll('select');
    expect(selects.length).toBe(3);
  });
});
