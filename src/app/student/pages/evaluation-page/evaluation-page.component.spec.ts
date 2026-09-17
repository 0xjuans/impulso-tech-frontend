import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import {
  Evaluation,
  EvaluationAttempt,
} from '../../../core/api/evaluations/evaluation.dto';
import { EvaluationPageComponent } from './evaluation-page.component';

/**
 * Pruebas de la toma de evaluación por parte del estudiante (RF-020).
 *
 * <p>Cubre el flujo completo: cargar el detalle, iniciar un intento,
 * responder por tipo de pregunta, submit con el JSON esperado por el
 * backend y visualización del resultado. También cubre los bordes:
 * bloqueo por intentos agotados, id inválido y errores del backend.</p>
 */
describe('EvaluationPageComponent (student)', () => {
  let fixture: ComponentFixture<EvaluationPageComponent>;
  let component: EvaluationPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const evaluation: Evaluation = {
    id: 1,
    lessonId: 12,
    name: 'Quiz de fundamentos',
    description: null,
    instructions: null,
    timeLimitMinutes: 15,
    passingPercentage: 70,
    maxAttempts: 2,
    orderIndex: 1,
    status: 'PUBLICADO',
    questions: [
      {
        id: 100,
        orderIndex: 1,
        type: 'SELECCION_MULTIPLE',
        questionText: '¿Cuál?',
        score: 1,
        config: JSON.stringify({ options: ['A', 'B', 'C'], correctIndex: 1 }),
      },
      {
        id: 101,
        orderIndex: 2,
        type: 'VERDADERO_FALSO',
        questionText: '¿Cierto?',
        score: 1,
        config: JSON.stringify({ correct: true }),
      },
      {
        id: 102,
        orderIndex: 3,
        type: 'RESPUESTA_CORTA',
        questionText: 'Escribe algo',
        score: 2,
        config: JSON.stringify({ expected: 'hola' }),
      },
    ],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  const attemptStarted: EvaluationAttempt = {
    id: 200,
    evaluationId: 1,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    totalScore: 0,
    maxPossibleScore: 0,
    percentage: 0,
    passed: false,
  };

  const attemptFinished: EvaluationAttempt = {
    id: 200,
    evaluationId: 1,
    startedAt: '2026-09-05T00:00:00Z',
    finishedAt: '2026-09-05T00:10:00Z',
    totalScore: 3,
    maxPossibleScore: 4,
    percentage: 75,
    passed: true,
  };

  async function setup(idParam: string | null): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [EvaluationPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(idParam ? { id: idParam } : {}) },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EvaluationPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    component?.ngOnDestroy?.();
    http.verify();
  });

  it('carga la evaluación y los intentos previos', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush([attemptFinished]);
    expect(component['evaluation']()?.name).toBe('Quiz de fundamentos');
    expect(component['attempts']().length).toBe(1);
    expect(component['orderedQuestions']().length).toBe(3);
  });

  it('marca error si el id no es numérico', async () => {
    await setup('abc');
    fixture.detectChanges();
    expect(component['error']()).toContain('no existe');
    http.expectNone((r) => r.url.startsWith(`${baseUrl}/evaluations/abc`));
  });

  it('bloquea iniciar cuando se agotaron los intentos', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http
      .expectOne(`${baseUrl}/evaluations/1/attempts`)
      .flush([attemptFinished, { ...attemptFinished, id: 201 }]);
    expect(component['canStart']()).toBeFalse();
  });

  it('inicia un intento con POST y habilita el formulario', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush([]);

    component['startAttempt']();
    const req = http.expectOne(`${baseUrl}/evaluations/1/attempts`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(attemptStarted);
    expect(component['hasAttemptInProgress']()).toBeTrue();
    expect(component['currentAttempt']()?.id).toBe(200);
  });

  it('bloquea submit hasta responder todas las preguntas', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush([]);
    component['startAttempt']();
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush(attemptStarted);

    expect(component['canSubmit']()).toBeFalse();
    component['setAnswer'](evaluation.questions[0], 1);
    expect(component['canSubmit']()).toBeFalse();
    component['setAnswer'](evaluation.questions[1], true);
    expect(component['canSubmit']()).toBeFalse();
    component['setAnswer'](evaluation.questions[2], 'hola');
    expect(component['canSubmit']()).toBeTrue();
  });

  it('envía las respuestas serializadas como JSON y muestra el resultado', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush([]);
    component['startAttempt']();
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush(attemptStarted);

    component['setAnswer'](evaluation.questions[0], 1);
    component['setAnswer'](evaluation.questions[1], true);
    component['setAnswer'](evaluation.questions[2], 'hola');
    component['submit']();

    const req = http.expectOne(`${baseUrl}/evaluations/1/attempts/submit`);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as { answers: string };
    expect(JSON.parse(body.answers)).toEqual({ '100': 1, '101': true, '102': 'hola' });
    req.flush(attemptFinished);

    expect(component['lastResult']()?.percentage).toBe(75);
    expect(component['lastResult']()?.passed).toBeTrue();
    expect(component['hasAttemptInProgress']()).toBeFalse();
  });

  it('propaga el mensaje de error del backend al enviar', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush([]);
    component['startAttempt']();
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush(attemptStarted);

    component['setAnswer'](evaluation.questions[0], 0);
    component['setAnswer'](evaluation.questions[1], false);
    component['setAnswer'](evaluation.questions[2], 'x');
    component['submit']();
    const req = http.expectOne(`${baseUrl}/evaluations/1/attempts/submit`);
    req.flush({ message: 'Formato inválido' }, { status: 400, statusText: 'Bad Request' });
    expect(component['submitError']()).toBe('Formato inválido');
  });

  it('optionsFor devuelve las opciones parseadas de la config', async () => {
    await setup('1');
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/1`).flush(evaluation);
    http.expectOne(`${baseUrl}/evaluations/1/attempts`).flush([]);
    expect(component['optionsFor'](evaluation.questions[0])).toEqual(['A', 'B', 'C']);
    expect(component['optionsFor'](evaluation.questions[2])).toEqual([]);
  });
});
