import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Challenge } from '../../../core/api/challenges/challenge.dto';
import { ChallengesPageComponent } from './challenges-page.component';

/**
 * Pruebas del catálogo de retos del estudiante (RF-014).
 */
describe('ChallengesPageComponent (student)', () => {
  let fixture: ComponentFixture<ChallengesPageComponent>;
  let component: ChallengesPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const sample: Challenge = {
    id: 1, name: 'Palíndromo', description: 'Detecta palíndromos',
    objective: null, instructions: null, difficulty: 'PRINCIPIANTE',
    allowedLanguages: 'python', ioExamples: null, restrictions: null,
    publicTestCases: null, hiddenTestCases: null, xpReward: 50, estimatedMinutes: 20,
    status: 'PUBLICADO', learningRouteId: null, courseId: null, moduleId: null, lessonId: null,
    instructorId: 5, instructorFullName: 'Ana', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChallengesPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ChallengesPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carga los retos publicados al iniciar', () => {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === `${baseUrl}/challenges`);
    req.flush({ content: [sample], page: 0, size: 30, totalElements: 1, totalPages: 1 });
    expect(component['challenges']().length).toBe(1);
  });

  it('propaga los filtros al aplicar', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url === `${baseUrl}/challenges`).flush({
      content: [], page: 0, size: 30, totalElements: 0, totalPages: 0,
    });
    component['search'].set('pal');
    component['difficultyFilter'].set('AVANZADO');
    component['languageFilter'].set('python');
    component['apply']();
    const req = http.expectOne((r) => r.url === `${baseUrl}/challenges` && r.params.get('search') === 'pal');
    expect(req.request.params.get('difficulty')).toBe('AVANZADO');
    expect(req.request.params.get('language')).toBe('python');
    req.flush({ content: [], page: 0, size: 30, totalElements: 0, totalPages: 0 });
  });

  it('muestra error si la carga falla', () => {
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url === `${baseUrl}/challenges`);
    req.flush({}, { status: 500, statusText: 'Server Error' });
    expect(component['error']()).toContain('No pudimos cargar');
  });
});
