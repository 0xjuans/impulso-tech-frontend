import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Challenge } from '../../../core/api/challenges/challenge.dto';
import { InstructorChallengeEditorPageComponent } from './instructor-challenge-editor-page.component';

/**
 * Pruebas del editor de retos (RF-013).
 *
 * <p>Cubre creación con validación de obligatorios, edición con
 * hidratación, guardado con PATCH y manejo de mensajes de error del
 * backend.</p>
 */
describe('InstructorChallengeEditorPageComponent', () => {
  let fixture: ComponentFixture<InstructorChallengeEditorPageComponent>;
  let component: InstructorChallengeEditorPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const existing: Challenge = {
    id: 7,
    name: 'Suma',
    description: 'Suma dos enteros',
    objective: null,
    instructions: null,
    difficulty: 'PRINCIPIANTE',
    allowedLanguages: 'python',
    ioExamples: null,
    restrictions: null,
    publicTestCases: null,
    hiddenTestCases: null,
    xpReward: 50,
    estimatedMinutes: 30,
    status: 'BORRADOR',
    learningRouteId: null,
    courseId: null,
    moduleId: null,
    lessonId: null,
    instructorId: 5,
    instructorFullName: 'Ana Rueda',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorChallengeEditorPageComponent],
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
    fixture = TestBed.createComponent(InstructorChallengeEditorPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  describe('creación', () => {
    it('no permite enviar sin dificultad ni lenguajes', async () => {
      await setup(null);
      fixture.detectChanges();
      component['name'].set('X');
      component['description'].set('Y');
      expect(component['canSubmit']()).toBeFalse();
      component['difficulty'].set('PRINCIPIANTE');
      expect(component['canSubmit']()).toBeFalse();
      component['allowedLanguages'].set('python');
      expect(component['canSubmit']()).toBeTrue();
    });

    it('envía POST y redirige al id devuelto', async () => {
      await setup(null);
      fixture.detectChanges();
      const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      component['name'].set('Nuevo');
      component['description'].set('Desc');
      component['difficulty'].set('AVANZADO');
      component['allowedLanguages'].set('python, java');
      component['xpReward'].set(100);
      component['submit']();
      const req = http.expectOne(`${baseUrl}/challenges`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Nuevo');
      expect(req.request.body.difficulty).toBe('AVANZADO');
      expect(req.request.body.allowedLanguages).toBe('python, java');
      expect(req.request.body.xpReward).toBe(100);
      req.flush({ ...existing, id: 42 });
      expect(nav).toHaveBeenCalledWith(['/instructor/challenges', 42]);
    });
  });

  describe('edición', () => {
    it('carga el reto e hidrata todos los campos', async () => {
      await setup('7');
      fixture.detectChanges();
      const req = http.expectOne(`${baseUrl}/challenges/7`);
      req.flush(existing);
      expect(component['name']()).toBe('Suma');
      expect(component['difficulty']()).toBe('PRINCIPIANTE');
      expect(component['allowedLanguages']()).toBe('python');
      expect(component['xpReward']()).toBe(50);
    });

    it('marca error si el id no es numérico', async () => {
      await setup('abc');
      fixture.detectChanges();
      expect(component['error']()).toContain('no existe');
      http.expectNone((r) => r.url.startsWith(`${baseUrl}/challenges/abc`));
    });

    it('envía PATCH con los datos actualizados', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/challenges/7`).flush(existing);
      component['name'].set('Suma binaria');
      component['submit']();
      const req = http.expectOne(`${baseUrl}/challenges/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.name).toBe('Suma binaria');
      req.flush({ ...existing, name: 'Suma binaria' });
      expect(component['loaded']()!.name).toBe('Suma binaria');
    });

    it('propaga el mensaje del backend al fallar', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/challenges/7`).flush(existing);
      component['submit']();
      const req = http.expectOne(`${baseUrl}/challenges/7`);
      req.flush({ message: 'La descripción es obligatoria.' }, { status: 400, statusText: 'Bad Request' });
      expect(component['saveError']()).toBe('La descripción es obligatoria.');
    });
  });
});
