import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { LearningRoute } from '../../../core/api/learning-routes/learning-route.dto';
import { InstructorRoutesPageComponent } from './instructor-routes-page.component';

/**
 * Pruebas del panel de gestión de rutas del instructor (RF-009).
 *
 * <p>Cubre la carga inicial contra el endpoint {@code /manage}, la
 * propagación de filtros y el flujo de cambio de estado con marcador
 * de pendiente para evitar dobles envíos.</p>
 */
describe('InstructorRoutesPageComponent', () => {
  let fixture: ComponentFixture<InstructorRoutesPageComponent>;
  let component: InstructorRoutesPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/learning-routes`;

  const draft: LearningRoute = {
    id: 1,
    name: 'Fundamentos web',
    description: 'HTML, CSS, JS',
    objective: null,
    coverImageUrl: null,
    difficulty: 'PRINCIPIANTE',
    estimatedDurationHours: 20,
    technologies: 'HTML, CSS',
    status: 'BORRADOR',
    instructorId: 5,
    instructorFullName: 'Ana Rueda',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const published: LearningRoute = { ...draft, id: 2, name: 'Angular', status: 'PUBLICADO' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorRoutesPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorRoutesPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitial(list: LearningRoute[] = [draft, published]): void {
    const req = http.expectOne((r) => r.url === `${baseUrl}/manage` && r.method === 'GET');
    req.flush({ content: list, page: 0, size: 50, totalElements: list.length, totalPages: 1 });
  }

  it('carga las rutas del endpoint /manage al iniciar', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['loading']()).toBeFalse();
    expect(component['routes']().length).toBe(2);
  });

  it('muestra error si la carga falla', () => {
    fixture.detectChanges();
    const req = http.expectOne(`${baseUrl}/manage?page=0&size=50`);
    req.flush({}, { status: 403, statusText: 'Forbidden' });
    expect(component['error']()).toContain('No pudimos cargar tus rutas');
  });

  it('propaga los filtros al aplicar', () => {
    fixture.detectChanges();
    flushInitial();
    component['search'].set('ang');
    component['statusFilter'].set('PUBLICADO');
    component['difficultyFilter'].set('AVANZADO');
    component['apply']();
    const req = http.expectOne(
      (r) => r.url === `${baseUrl}/manage` && r.params.get('search') === 'ang',
    );
    expect(req.request.params.get('status')).toBe('PUBLICADO');
    expect(req.request.params.get('difficulty')).toBe('AVANZADO');
    req.flush({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
  });

  it('calcula los contadores por estado', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['counts']().total).toBe(2);
    expect(component['counts']().published).toBe(1);
    expect(component['counts']().draft).toBe(1);
    expect(component['counts']().disabled).toBe(0);
  });

  it('publica una ruta borrador y refleja el nuevo estado', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](draft, 'PUBLICADO');
    const req = http.expectOne(`${baseUrl}/${draft.id}/status`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'PUBLICADO' });
    req.flush({ ...draft, status: 'PUBLICADO' });
    const updated = component['routes']().find((r) => r.id === draft.id);
    expect(updated?.status).toBe('PUBLICADO');
    expect(component['pendingStatusId']()).toBeNull();
  });

  it('no envía cambio de estado si ya está en ese estado', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](published, 'PUBLICADO');
    http.expectNone((r) => r.url.endsWith('/status'));
    expect(component['pendingStatusId']()).toBeNull();
  });

  it('marca error si el cambio de estado falla', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](draft, 'PUBLICADO');
    const req = http.expectOne(`${baseUrl}/${draft.id}/status`);
    req.flush({}, { status: 500, statusText: 'Server Error' });
    expect(component['error']()).toContain('No pudimos actualizar');
    expect(component['pendingStatusId']()).toBeNull();
  });

  it('renderiza en el DOM las rutas cargadas', () => {
    fixture.detectChanges();
    flushInitial();
    fixture.detectChanges();
    const rendered = fixture.nativeElement as HTMLElement;
    const items = rendered.querySelectorAll('.route');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.route__title')?.textContent).toContain('Fundamentos web');
  });
});
