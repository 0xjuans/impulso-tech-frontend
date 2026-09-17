import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Lab } from '../../../core/api/labs/lab.dto';
import { InstructorLabsPageComponent } from './instructor-labs-page.component';

/**
 * Pruebas del panel de gestión de laboratorios del instructor (RF-053).
 */
describe('InstructorLabsPageComponent', () => {
  let fixture: ComponentFixture<InstructorLabsPageComponent>;
  let component: InstructorLabsPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/labs`;

  const draft: Lab = {
    id: 1,
    title: 'Hola mundo',
    description: 'd',
    instructions: 'i',
    language: 'python',
    starterCode: null,
    expectedOutput: null,
    courseId: null,
    lessonId: null,
    instructorId: 5,
    status: 'BORRADOR',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const published: Lab = { ...draft, id: 2, title: 'Otro', status: 'PUBLICADO' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorLabsPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorLabsPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitial(list: Lab[] = [draft, published]): void {
    const req = http.expectOne((r) => r.url === baseUrl);
    req.flush({ content: list, page: 0, size: 50, totalElements: list.length, totalPages: 1 });
  }

  it('carga los laboratorios al iniciar', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['labs']().length).toBe(2);
    expect(component['counts']().published).toBe(1);
  });

  it('marca error si la carga inicial falla', () => {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === baseUrl);
    req.flush({}, { status: 500, statusText: 'Server Error' });
    expect(component['error']()).toContain('No pudimos cargar');
  });

  it('propaga los filtros al aplicar', () => {
    fixture.detectChanges();
    flushInitial();
    component['q'].set('hola');
    component['language'].set('python');
    component['apply']();
    const req = http.expectOne((r) => r.url === baseUrl && r.params.get('q') === 'hola');
    expect(req.request.params.get('language')).toBe('python');
    req.flush({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
  });

  it('elimina un laboratorio tras confirmación', () => {
    fixture.detectChanges();
    flushInitial();
    spyOn(window, 'confirm').and.returnValue(true);
    component['deleteLab'](draft);
    const req = http.expectOne(`${baseUrl}/${draft.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(component['labs']().find((l) => l.id === draft.id)).toBeUndefined();
  });

  it('no elimina si se cancela la confirmación', () => {
    fixture.detectChanges();
    flushInitial();
    const spy = spyOn(window, 'confirm').and.returnValue(false);
    component['deleteLab'](draft);
    expect(spy).toHaveBeenCalled();
    http.expectNone((r) => r.method === 'DELETE');
  });

  it('renderiza los laboratorios en el DOM', () => {
    fixture.detectChanges();
    flushInitial();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.lab');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.lab__title')?.textContent).toContain('Hola mundo');
  });
});
