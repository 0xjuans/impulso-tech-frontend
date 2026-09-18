import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { LearningRoute } from '../../../core/api/learning-routes/learning-route.dto';
import { InstructorRouteEditorPageComponent } from './instructor-route-editor-page.component';

/**
 * Pruebas del editor de rutas del instructor (RF-009).
 *
 * <p>Verifica los dos modos: creación (sin id) y edición (con id). En
 * creación debe redirigir al editor de la ruta recién creada; en
 * edición debe cargar el detalle e hidratar el formulario. También
 * cubre el guardado con PATCH y los mensajes de error del backend.</p>
 */
describe('InstructorRouteEditorPageComponent', () => {
  let fixture: ComponentFixture<InstructorRouteEditorPageComponent>;
  let component: InstructorRouteEditorPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/learning-routes`;

  const existing: LearningRoute = {
    id: 7,
    name: 'Angular',
    description: 'Framework SPA',
    objective: 'Aprender Angular',
    coverImageUrl: null,
    difficulty: 'INTERMEDIO',
    estimatedDurationHours: 30,
    technologies: 'TypeScript, Angular',
    status: 'BORRADOR',
    instructorId: 5,
    instructorFullName: 'Ana Rueda',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorRouteEditorPageComponent],
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
    fixture = TestBed.createComponent(InstructorRouteEditorPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  describe('modo creación', () => {
    it('no dispara GET cuando no hay id', async () => {
      await setup(null);
      fixture.detectChanges();
      http.expectNone((r) => r.url === `${baseUrl}/undefined`);
      expect(component['isEditing']()).toBeFalse();
    });

    it('crea la ruta y redirige al editor con el id devuelto', async () => {
      await setup(null);
      fixture.detectChanges();

      const router = TestBed.inject(Router);
      const nav = spyOn(router, 'navigate').and.resolveTo(true);

      component['name'].set('Nueva');
      component['description'].set('Desc');
      component['difficulty'].set('PRINCIPIANTE');
      component['submit']();

      const req = http.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        name: 'Nueva',
        description: 'Desc',
        objective: null,
        coverImageUrl: null,
        difficulty: 'PRINCIPIANTE',
        estimatedDurationHours: null,
        technologies: null,
      });
      req.flush({ ...existing, id: 42, name: 'Nueva' });
      expect(nav).toHaveBeenCalledWith(['/instructor/routes', 42]);
      expect(component['loaded']()?.id).toBe(42);
    });

    it('no envía si faltan nombre o descripción', async () => {
      await setup(null);
      fixture.detectChanges();
      component['name'].set('  ');
      component['description'].set('Desc');
      expect(component['canSubmit']()).toBeFalse();
      component['submit']();
      http.expectNone(baseUrl);
    });
  });

  describe('modo edición', () => {
    it('carga la ruta e hidrata el formulario', async () => {
      await setup('7');
      fixture.detectChanges();
      const req = http.expectOne(`${baseUrl}/7`);
      expect(req.request.method).toBe('GET');
      req.flush(existing);
      expect(component['name']()).toBe('Angular');
      expect(component['difficulty']()).toBe('INTERMEDIO');
      expect(component['estimatedDurationHours']()).toBe(30);
      expect(component['loaded']()!.id).toBe(7);
    });

    it('marca error si el id no es numérico', async () => {
      await setup('abc');
      fixture.detectChanges();
      expect(component['error']()).toContain('no existe');
      http.expectNone((r) => r.url.startsWith(`${baseUrl}/abc`));
    });

    it('actualiza con PATCH y refleja lo devuelto por el backend', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/7`).flush(existing);

      component['name'].set('Angular avanzado');
      component['submit']();

      const req = http.expectOne(`${baseUrl}/7`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({
        name: 'Angular avanzado',
        description: existing.description,
        objective: existing.objective,
        coverImageUrl: null,
        difficulty: 'INTERMEDIO',
        estimatedDurationHours: 30,
        technologies: existing.technologies,
      });
      req.flush({ ...existing, name: 'Angular avanzado' });
      expect(component['loaded']()!.name).toBe('Angular avanzado');
    });

    it('muestra el mensaje del backend cuando el guardado falla', async () => {
      await setup('7');
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/7`).flush(existing);

      component['name'].set('X');
      component['submit']();
      const req = http.expectOne(`${baseUrl}/7`);
      req.flush({ message: 'El nombre debe tener al menos 3 caracteres.' }, { status: 400, statusText: 'Bad Request' });
      expect(component['saveError']()).toBe('El nombre debe tener al menos 3 caracteres.');
      expect(component['saving']()).toBeFalse();
    });
  });
});
