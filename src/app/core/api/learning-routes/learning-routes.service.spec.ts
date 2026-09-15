import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { LearningRoute } from './learning-route.dto';
import { LearningRoutesService } from './learning-routes.service';

/**
 * Pruebas del servicio HTTP de rutas de aprendizaje (RF-008, RF-009).
 *
 * <p>Verifica que cada operación construya la URL, el método HTTP y los
 * parámetros esperados por el backend en {@code /api/learning-routes},
 * incluyendo el endpoint {@code /manage} reservado para instructores y
 * administradores.</p>
 */
describe('LearningRoutesService', () => {
  let service: LearningRoutesService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/learning-routes`;

  const sampleRoute: LearningRoute = {
    id: 1,
    name: 'Fundamentos web',
    description: 'Aprende HTML, CSS y JS',
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

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LearningRoutesService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(LearningRoutesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listPublished', () => {
    it('usa page/size por defecto y omite filtros vacíos', () => {
      service.listPublished().subscribe();
      const req = http.expectOne((r) => r.url === baseUrl && r.method === 'GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('size')).toBe('12');
      expect(req.request.params.has('search')).toBeFalse();
      expect(req.request.params.has('difficulty')).toBeFalse();
      req.flush({ content: [], page: 0, size: 12, totalElements: 0, totalPages: 0 });
    });

    it('propaga search y difficulty cuando se pasan', () => {
      service.listPublished({ search: 'ang', difficulty: 'INTERMEDIO', page: 2, size: 6 }).subscribe();
      const req = http.expectOne((r) => r.url === baseUrl && r.method === 'GET');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('size')).toBe('6');
      expect(req.request.params.get('search')).toBe('ang');
      expect(req.request.params.get('difficulty')).toBe('INTERMEDIO');
      req.flush({ content: [sampleRoute], page: 2, size: 6, totalElements: 1, totalPages: 1 });
    });
  });

  describe('listAllForManagement', () => {
    it('pega a /manage con page/size por defecto', () => {
      service.listAllForManagement().subscribe();
      const req = http.expectOne(`${baseUrl}/manage?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 });
    });

    it('propaga todos los filtros (search, difficulty, status)', () => {
      service
        .listAllForManagement({
          search: 'html',
          difficulty: 'PRINCIPIANTE',
          status: 'BORRADOR',
          page: 1,
          size: 15,
        })
        .subscribe();
      const req = http.expectOne(
        (r) => r.url === `${baseUrl}/manage` && r.params.get('search') === 'html',
      );
      expect(req.request.params.get('difficulty')).toBe('PRINCIPIANTE');
      expect(req.request.params.get('status')).toBe('BORRADOR');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('size')).toBe('15');
      req.flush({ content: [], page: 1, size: 15, totalElements: 0, totalPages: 0 });
    });
  });

  describe('get', () => {
    it('devuelve el detalle de una ruta por id', (done) => {
      service.get(1).subscribe((r) => {
        expect(r.id).toBe(1);
        done();
      });
      const req = http.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(sampleRoute);
    });
  });

  describe('create', () => {
    it('envía POST con el payload y devuelve la ruta creada', (done) => {
      const payload = {
        name: 'Nueva ruta',
        description: 'Descripción',
        objective: null,
        coverImageUrl: null,
        difficulty: null,
        estimatedDurationHours: null,
        technologies: null,
      };
      service.create(payload).subscribe((r) => {
        expect(r).toEqual(sampleRoute);
        done();
      });
      const req = http.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(sampleRoute);
    });
  });

  describe('update', () => {
    it('envía PATCH al endpoint de la ruta con el payload parcial', (done) => {
      const payload = { name: 'Renombrada' };
      service.update(1, payload).subscribe((r) => {
        expect(r.name).toBe('Fundamentos web');
        done();
      });
      const req = http.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(payload);
      req.flush(sampleRoute);
    });
  });

  describe('changeStatus', () => {
    it('envía PATCH a /status con el nuevo estado envuelto', (done) => {
      service.changeStatus(1, 'PUBLICADO').subscribe((r) => {
        expect(r).toEqual(sampleRoute);
        done();
      });
      const req = http.expectOne(`${baseUrl}/1/status`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ status: 'PUBLICADO' });
      req.flush(sampleRoute);
    });
  });
});
