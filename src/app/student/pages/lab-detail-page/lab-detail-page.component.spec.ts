import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Lab, LabSubmission } from '../../../core/api/labs/lab.dto';
import { LabDetailPageComponent } from './lab-detail-page.component';

/**
 * Pruebas del detalle de laboratorio para el estudiante (RF-053).
 */
describe('LabDetailPageComponent', () => {
  let fixture: ComponentFixture<LabDetailPageComponent>;
  let component: LabDetailPageComponent;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/labs`;

  const lab: Lab = {
    id: 1, title: 'Hola', description: 'x', instructions: 'y',
    language: 'python', starterCode: 'print("hi")', expectedOutput: 'hi',
    courseId: null, lessonId: null, instructorId: 5, status: 'PUBLICADO',
    createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z',
  };

  const submission: LabSubmission = {
    id: 10, labId: 1, code: 'print("hi")',
    stdout: 'hi\n', stderr: null, exitCode: 0, executionTimeMs: 42,
    submittedAt: '2026-09-05T00:00:00Z',
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [LabDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(idParam ? { id: idParam } : {}) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LabDetailPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  it('carga el laboratorio y pre-rellena el starter code', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/1`).flush(lab);
    http.expectOne(`${baseUrl}/1/submissions/mine`).flush([]);
    expect(component['lab']()?.title).toBe('Hola');
    expect(component['code']()).toBe('print("hi")');
  });

  it('ejecuta código en el sandbox y guarda el resultado', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/1`).flush(lab);
    http.expectOne(`${baseUrl}/1/submissions/mine`).flush([]);

    component['code'].set('print("hola")');
    component['stdin'].set('input');
    component['tryExecute']();
    const req = http.expectOne(`${baseUrl}/1/executions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ code: 'print("hola")', stdin: 'input' });
    req.flush({ stdout: 'hola\n', stderr: null, exitCode: 0, executionTimeMs: 20, message: null });
    expect(component['runResult']()?.stdout).toBe('hola\n');
  });

  it('envía una entrega y la agrega al historial', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/1`).flush(lab);
    http.expectOne(`${baseUrl}/1/submissions/mine`).flush([]);

    component['code'].set('print("hi")');
    component['submit']();
    const req = http.expectOne(`${baseUrl}/1/submissions`);
    expect(req.request.method).toBe('POST');
    req.flush(submission);
    expect(component['submissions']().length).toBe(1);
    expect(component['submitOk']()).toContain('enviada');
  });

  it('bloquea ejecución y envío si el código está vacío', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/1`).flush({ ...lab, starterCode: null });
    http.expectOne(`${baseUrl}/1/submissions/mine`).flush([]);
    component['code'].set('   ');
    expect(component['canRun']()).toBeFalse();
    component['tryExecute']();
    component['submit']();
    http.expectNone((r) => r.method === 'POST');
  });
});
