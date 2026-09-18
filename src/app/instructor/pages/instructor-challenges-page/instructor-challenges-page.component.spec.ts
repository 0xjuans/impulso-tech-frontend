import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Challenge } from '../../../core/api/challenges/challenge.dto';
import { InstructorChallengesPageComponent } from './instructor-challenges-page.component';

/**
 * Pruebas del panel de gestión de retos del instructor (RF-013).
 *
 * <p>Cubre la carga inicial contra {@code /challenges/manage}, filtros,
 * cambio de estado con marcador de pendiente y eliminación con
 * confirmación previa.</p>
 */
describe('InstructorChallengesPageComponent', () => {
  let fixture: ComponentFixture<InstructorChallengesPageComponent>;
  let component: InstructorChallengesPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const draft: Challenge = {
    id: 1,
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

  const published: Challenge = { ...draft, id: 2, name: 'Palíndromo', status: 'PUBLICADO' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorChallengesPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorChallengesPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function flushInitial(list: Challenge[] = [draft, published]): void {
    const req = http.expectOne((r) => r.url === `${baseUrl}/challenges/manage`);
    req.flush({ content: list, page: 0, size: 50, totalElements: list.length, totalPages: 1 });
  }

  it('carga los retos del endpoint /manage al iniciar', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['loading']()).toBeFalse();
    expect(component['challenges']().length).toBe(2);
  });

  it('propaga todos los filtros al aplicar', () => {
    fixture.detectChanges();
    flushInitial();
    component['search'].set('sum');
    component['difficultyFilter'].set('AVANZADO');
    component['statusFilter'].set('PUBLICADO');
    component['languageFilter'].set('python');
    component['apply']();
    const req = http.expectOne((r) => r.url === `${baseUrl}/challenges/manage` && r.params.get('search') === 'sum');
    expect(req.request.params.get('difficulty')).toBe('AVANZADO');
    expect(req.request.params.get('status')).toBe('PUBLICADO');
    expect(req.request.params.get('language')).toBe('python');
    req.flush({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
  });

  it('calcula contadores por estado', () => {
    fixture.detectChanges();
    flushInitial();
    expect(component['counts']().total).toBe(2);
    expect(component['counts']().published).toBe(1);
    expect(component['counts']().draft).toBe(1);
  });

  it('publica un reto borrador reflejando el nuevo estado', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](draft, 'PUBLICADO');
    const req = http.expectOne(`${baseUrl}/challenges/${draft.id}/status`);
    expect(req.request.body).toEqual({ status: 'PUBLICADO' });
    req.flush({ ...draft, status: 'PUBLICADO' });
    const updated = component['challenges']().find((c) => c.id === draft.id);
    expect(updated?.status).toBe('PUBLICADO');
  });

  it('no envía cambio de estado a un reto ya en ese estado', () => {
    fixture.detectChanges();
    flushInitial();
    component['changeStatus'](published, 'PUBLICADO');
    http.expectNone((r) => r.url.endsWith('/status'));
    expect(component['pendingActionId']()).toBeNull();
  });

  it('elimina un reto tras confirmación', () => {
    fixture.detectChanges();
    flushInitial();
    spyOn(window, 'confirm').and.returnValue(true);
    component['deleteChallenge'](draft);
    const req = http.expectOne(`${baseUrl}/challenges/${draft.id}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
    expect(component['challenges']().find((c) => c.id === draft.id)).toBeUndefined();
  });

  it('no elimina si el usuario cancela la confirmación', () => {
    fixture.detectChanges();
    flushInitial();
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    component['deleteChallenge'](draft);
    expect(confirmSpy).toHaveBeenCalled();
    http.expectNone((r) => r.method === 'DELETE');
  });

  it('renderiza los retos en el DOM', () => {
    fixture.detectChanges();
    flushInitial();
    fixture.detectChanges();
    const items = (fixture.nativeElement as HTMLElement).querySelectorAll('.challenge');
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.challenge__title')?.textContent).toContain('Suma');
  });
});
