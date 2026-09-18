import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Lab } from '../../../core/api/labs/lab.dto';
import { LabsPageComponent } from './labs-page.component';

/**
 * Pruebas del catálogo de laboratorios para el estudiante (RF-053).
 */
describe('LabsPageComponent (student)', () => {
  let fixture: ComponentFixture<LabsPageComponent>;
  let component: LabsPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/labs`;

  const sample: Lab = {
    id: 1, title: 'Hola', description: 'x', instructions: 'y',
    language: 'python', starterCode: null, expectedOutput: null,
    courseId: null, lessonId: null, instructorId: 5, status: 'PUBLICADO',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LabsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LabsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga los laboratorios al iniciar', () => {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === baseUrl);
    req.flush({ content: [sample], page: 0, size: 30, totalElements: 1, totalPages: 1 });
    expect(component['labs']().length).toBe(1);
  });

  it('aplica filtros de búsqueda y lenguaje', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url === baseUrl).flush({
      content: [], page: 0, size: 30, totalElements: 0, totalPages: 0,
    });
    component['q'].set('hola');
    component['language'].set('python');
    component['apply']();
    const req = http.expectOne((r) => r.url === baseUrl && r.params.get('q') === 'hola');
    expect(req.request.params.get('language')).toBe('python');
    req.flush({ content: [], page: 0, size: 30, totalElements: 0, totalPages: 0 });
  });
});
