import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { convertToParamMap } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Lab } from '../../../core/api/labs/lab.dto';
import { InstructorLabEditorPageComponent } from './instructor-lab-editor-page.component';

/**
 * Pruebas del editor de laboratorios (RF-053).
 */
describe('InstructorLabEditorPageComponent', () => {
  let fixture: ComponentFixture<InstructorLabEditorPageComponent>;
  let component: InstructorLabEditorPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/labs`;

  const existing: Lab = {
    id: 7,
    title: 'Hola Python',
    description: 'd',
    instructions: 'i',
    language: 'python',
    starterCode: 'print("hi")',
    expectedOutput: 'hi',
    courseId: null,
    lessonId: null,
    instructorId: 5,
    status: 'BORRADOR',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorLabEditorPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(idParam ? { id: idParam } : {}),
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorLabEditorPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  /**
   * Consume las requests del content-context-picker (labs oculta la
   * ruta, así que solo llama a /courses/manage).
   */
  function flushPickerBoot(): void {
    http.expectOne((r) => r.url.endsWith('/courses/manage')).flush({
      content: [], page: 0, size: 200, totalElements: 0, totalPages: 0,
    });
  }

  afterEach(() => http.verify());

  describe('creación', () => {
    it('no permite enviar sin campos obligatorios', async () => {
      await setup(null);
      fixture.detectChanges();
      flushPickerBoot();
      component['title'].set('t');
      expect(component['canSubmit']()).toBeFalse();
      component['description'].set('d');
      component['instructions'].set('i');
      expect(component['canSubmit']()).toBeFalse();
      component['language'].set('python');
      expect(component['canSubmit']()).toBeTrue();
    });

    it('envía POST y redirige al id devuelto', async () => {
      await setup(null);
      fixture.detectChanges();
      flushPickerBoot();
      const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      component['title'].set('Nuevo');
      component['description'].set('d');
      component['instructions'].set('i');
      component['language'].set('python');
      component['submit']();
      const req = http.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.title).toBe('Nuevo');
      expect(req.request.body.language).toBe('python');
      req.flush({ ...existing, id: 42 });
      expect(nav).toHaveBeenCalledWith(['/instructor/labs', 42]);
    });
  });

  describe('edición', () => {
    it('carga el laboratorio e hidrata los campos', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/7`).flush(existing);
      fixture.detectChanges();
      flushPickerBoot();
      expect(component['title']()).toBe('Hola Python');
      expect(component['language']()).toBe('python');
      expect(component['starterCode']()).toBe('print("hi")');
    });

    it('marca error si el id no es numérico', async () => {
      await setup('abc');
      fixture.detectChanges();
      expect(component['error']()).toContain('no existe');
      http.expectNone((r) => r.url.startsWith(`${baseUrl}/abc`));
    });

    it('envía PUT al guardar en edición', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/7`).flush(existing);
      fixture.detectChanges();
      flushPickerBoot();
      component['title'].set('Renombrado');
      component['submit']();
      const req = http.expectOne(`${baseUrl}/7`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.title).toBe('Renombrado');
      req.flush({ ...existing, title: 'Renombrado' });
      expect(component['loaded']()!.title).toBe('Renombrado');
    });

    it('propaga el mensaje del backend al fallar', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/7`).flush(existing);
      fixture.detectChanges();
      flushPickerBoot();
      component['submit']();
      const req = http.expectOne(`${baseUrl}/7`);
      req.flush({ message: 'El lenguaje es obligatorio.' }, { status: 400, statusText: 'Bad Request' });
      expect(component['saveError']()).toBe('El lenguaje es obligatorio.');
    });
  });
});
