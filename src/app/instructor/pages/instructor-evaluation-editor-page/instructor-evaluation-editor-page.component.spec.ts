import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { convertToParamMap } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { Evaluation, EvaluationQuestion } from '../../../core/api/evaluations/evaluation.dto';
import { InstructorEvaluationEditorPageComponent } from './instructor-evaluation-editor-page.component';

/**
 * Pruebas del editor de evaluaciones (RF-020).
 *
 * <p>Cubre creación bajo una lección, edición con hidratación,
 * agregar/eliminar preguntas, y la serialización de la configuración
 * de cada tipo de pregunta al JSON esperado por el backend.</p>
 */
describe('InstructorEvaluationEditorPageComponent', () => {
  let fixture: ComponentFixture<InstructorEvaluationEditorPageComponent>;
  let component: InstructorEvaluationEditorPageComponent;
  let http: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  const question: EvaluationQuestion = {
    id: 100,
    orderIndex: 1,
    type: 'SELECCION_MULTIPLE',
    questionText: '¿Cuál es la respuesta?',
    score: 1,
    config: '{"options":["a","b","c"],"correctIndex":1}',
  };

  const existing: Evaluation = {
    id: 5,
    lessonId: 12,
    name: 'Quiz de fundamentos',
    description: 'Descripción',
    instructions: 'Instrucciones',
    timeLimitMinutes: 15,
    passingPercentage: 70,
    maxAttempts: 2,
    orderIndex: 1,
    status: 'BORRADOR',
    questions: [question],
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  };

  async function setup(params: { id?: string; lessonId?: string }): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [InstructorEvaluationEditorPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(params as Record<string, string>),
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(InstructorEvaluationEditorPageComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  }

  afterEach(() => http.verify());

  describe('creación', () => {
    it('crea la evaluación bajo la lección indicada y redirige', async () => {
      await setup({ lessonId: '12' });
      fixture.detectChanges();
      const nav = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      component['name'].set('Nueva');
      component['passingPercentage'].set(80);
      component['maxAttempts'].set(3);
      component['submit']();
      const req = http.expectOne(`${baseUrl}/lessons/12/evaluations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Nueva');
      expect(req.request.body.passingPercentage).toBe(80);
      expect(req.request.body.maxAttempts).toBe(3);
      req.flush({ ...existing, id: 99 });
      expect(nav).toHaveBeenCalledWith(['/instructor/evaluations', 99]);
    });

    it('no permite enviar sin nombre', async () => {
      await setup({ lessonId: '12' });
      fixture.detectChanges();
      expect(component['canSubmit']()).toBeFalse();
      component['name'].set('X');
      expect(component['canSubmit']()).toBeTrue();
    });

    it('reporta error si intenta guardar sin lección ni id', async () => {
      await setup({});
      fixture.detectChanges();
      component['name'].set('Sin destino');
      component['submit']();
      http.expectNone((r) => r.method === 'POST');
      expect(component['saveError']()).toContain('lección');
    });
  });

  describe('edición', () => {
    it('carga la evaluación e hidrata los campos', async () => {
      await setup({ id: '5' });
      fixture.detectChanges();
      const req = http.expectOne(`${baseUrl}/evaluations/5`);
      req.flush(existing);
      expect(component['name']()).toBe('Quiz de fundamentos');
      expect(component['passingPercentage']()).toBe(70);
      expect(component['lessonId']()).toBe(12);
      expect(component['loaded']()!.questions.length).toBe(1);
    });

    it('marca error si el id no es numérico', async () => {
      await setup({ id: 'abc' });
      fixture.detectChanges();
      expect(component['error']()).toContain('no existe');
      http.expectNone((r) => r.url.startsWith(`${baseUrl}/evaluations/abc`));
    });

    it('actualiza con PATCH parcial', async () => {
      await setup({ id: '5' });
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/evaluations/5`).flush(existing);
      component['name'].set('Quiz renombrado');
      component['submit']();
      const req = http.expectOne(`${baseUrl}/evaluations/5`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body.name).toBe('Quiz renombrado');
      req.flush({ ...existing, name: 'Quiz renombrado' });
      expect(component['loaded']()!.name).toBe('Quiz renombrado');
    });
  });

  describe('preguntas', () => {
    beforeEach(async () => {
      await setup({ id: '5' });
      fixture.detectChanges();
      http.expectOne(`${baseUrl}/evaluations/5`).flush({ ...existing, questions: [] });
    });

    it('agrega una pregunta de selección múltiple con configuración serializada', () => {
      component['questionType'].set('SELECCION_MULTIPLE');
      component['questionText'].set('¿Cuál lenguaje?');
      component['questionScore'].set(2);
      component['setOption'](0, 'Python');
      component['setOption'](1, 'JavaScript');
      component['setOption'](2, '');
      component['setOption'](3, '');
      component['questionCorrectIndex'].set(1);
      expect(component['canAddQuestion']()).toBeTrue();
      component['addQuestion']();
      const req = http.expectOne(`${baseUrl}/evaluations/5/questions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.type).toBe('SELECCION_MULTIPLE');
      expect(req.request.body.orderIndex).toBe(1);
      expect(req.request.body.score).toBe(2);
      const cfg = JSON.parse(req.request.body.config);
      expect(cfg.options).toEqual(['Python', 'JavaScript']);
      expect(cfg.correctIndex).toBe(1);
      req.flush({ ...existing, questions: [question] });
      expect(component['loaded']()!.questions.length).toBe(1);
      expect(component['questionText']()).toBe('');
    });

    it('rechaza selección múltiple con menos de dos opciones', () => {
      component['questionType'].set('SELECCION_MULTIPLE');
      component['questionText'].set('X');
      component['setOption'](0, 'única');
      expect(component['canAddQuestion']()).toBeFalse();
    });

    it('serializa correctamente V/F', () => {
      component['questionType'].set('VERDADERO_FALSO');
      component['questionText'].set('¿Es cierto?');
      component['questionBoolAnswer'].set(false);
      component['addQuestion']();
      const req = http.expectOne(`${baseUrl}/evaluations/5/questions`);
      expect(JSON.parse(req.request.body.config)).toEqual({ correct: false });
      req.flush(existing);
    });

    it('serializa respuesta corta con caseSensitive', () => {
      component['questionType'].set('RESPUESTA_CORTA');
      component['questionText'].set('Escribe DOCTYPE');
      component['questionExpected'].set('<!DOCTYPE html>');
      component['questionCaseSensitive'].set(true);
      component['addQuestion']();
      const req = http.expectOne(`${baseUrl}/evaluations/5/questions`);
      expect(JSON.parse(req.request.body.config)).toEqual({
        expected: '<!DOCTYPE html>',
        caseSensitive: true,
      });
      req.flush(existing);
    });

    it('elimina una pregunta tras confirmación y recarga', () => {
      // Simulamos que ya hay una pregunta cargada.
      component['loaded'].set(existing);
      spyOn(window, 'confirm').and.returnValue(true);
      component['deleteQuestion'](question);
      const del = http.expectOne(`${baseUrl}/evaluation-questions/${question.id}`);
      expect(del.request.method).toBe('DELETE');
      del.flush(null);
      // Recarga automática tras eliminar
      const reload = http.expectOne(`${baseUrl}/evaluations/5`);
      reload.flush({ ...existing, questions: [] });
      expect(component['loaded']()!.questions.length).toBe(0);
    });
  });

  it('describeQuestion resume la config JSON de forma legible', async () => {
    await setup({ id: '5' });
    fixture.detectChanges();
    http.expectOne(`${baseUrl}/evaluations/5`).flush(existing);
    expect(component['describeQuestion'](question)).toContain('correcta: "b"');
    expect(
      component['describeQuestion']({
        ...question,
        type: 'VERDADERO_FALSO',
        config: '{"correct":true}',
      }),
    ).toContain('Verdadero');
    expect(
      component['describeQuestion']({
        ...question,
        type: 'RESPUESTA_CORTA',
        config: '{"expected":"hola"}',
      }),
    ).toContain('"hola"');
  });
});
