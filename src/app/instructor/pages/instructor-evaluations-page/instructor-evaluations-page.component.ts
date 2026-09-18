import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { Course, CourseModule } from '../../../core/api/courses/course.dto';
import { CoursesService } from '../../../core/api/courses/courses.service';
import { Evaluation } from '../../../core/api/evaluations/evaluation.dto';
import { EvaluationsService } from '../../../core/api/evaluations/evaluations.service';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { LessonsService } from '../../../core/api/lessons/lessons.service';
import { ContentStatus } from '../../../core/api/learning-routes/learning-route.dto';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

/**
 * Panel de gestión de evaluaciones del instructor (RF-020).
 *
 * <p>Presenta un selector en cascada <strong>curso → módulo → lección</strong>
 * para elegir la lección de contexto sin exigir al instructor que
 * conozca IDs internos. Una vez seleccionada la lección se cargan sus
 * evaluaciones y se ofrecen las acciones de crear, publicar, editar y
 * eliminar. El estado del selector se refleja en query params para
 * poder compartir enlaces o refrescar sin perder el contexto.</p>
 */
@Component({
  selector: 'app-instructor-evaluations-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-evaluations-page.component.html',
  styleUrl: './instructor-evaluations-page.component.scss',
})
export class InstructorEvaluationsPageComponent implements OnInit {
  private readonly evaluationsService = inject(EvaluationsService);
  private readonly coursesService = inject(CoursesService);
  private readonly lessonsService = inject(LessonsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly evaluations = signal<readonly Evaluation[]>([]);

  // Selectores en cascada -------------------------------------------------
  protected readonly courses = signal<readonly Course[]>([]);
  protected readonly modules = signal<readonly CourseModule[]>([]);
  protected readonly lessons = signal<readonly Lesson[]>([]);
  protected readonly loadingCourses = signal(true);
  protected readonly loadingModules = signal(false);
  protected readonly loadingLessons = signal(false);

  protected readonly courseId = signal<number | null>(null);
  protected readonly moduleId = signal<number | null>(null);
  protected readonly lessonId = signal<number | null>(null);

  protected readonly pendingActionId = signal<number | null>(null);

  protected readonly selectedLessonTitle = computed(() => {
    const id = this.lessonId();
    if (id === null) return '';
    return this.lessons().find((l) => l.id === id)?.title ?? '';
  });

  protected readonly counts = computed(() => {
    const list = this.evaluations();
    return {
      total: list.length,
      published: list.filter((e) => e.status === 'PUBLICADO').length,
      draft: list.filter((e) => e.status === 'BORRADOR').length,
      disabled: list.filter((e) => e.status === 'DESHABILITADO').length,
    };
  });

  private loadModulesFor(courseId: number): void {
    this.loadingModules.set(true);
    this.coursesService
      .listModules(courseId)
      .pipe(finalize(() => this.loadingModules.set(false)))
      .subscribe({
        next: (list) => this.modules.set(list),
        error: () => this.modules.set([]),
      });
  }

  private loadLessonsFor(moduleId: number): void {
    this.loadingLessons.set(true);
    this.lessonsService
      .listByModule(moduleId)
      .pipe(finalize(() => this.loadingLessons.set(false)))
      .subscribe({
        next: (list) => this.lessons.set(list),
        error: () => this.lessons.set([]),
      });
  }

  ngOnInit(): void {
    this.loadCourses();
    // Restaurar selección desde query params al entrar por enlace directo.
    const qp = this.route.snapshot.queryParamMap;
    const cid = Number(qp.get('course'));
    const mid = Number(qp.get('module'));
    const lid = Number(qp.get('lesson'));
    if (Number.isFinite(cid) && cid > 0) {
      this.courseId.set(cid);
      this.loadModulesFor(cid);
    }
    if (Number.isFinite(mid) && mid > 0) {
      this.moduleId.set(mid);
      this.loadLessonsFor(mid);
    }
    if (Number.isFinite(lid) && lid > 0) {
      this.lessonId.set(lid);
      this.reload();
    }
  }

  private loadCourses(): void {
    this.loadingCourses.set(true);
    this.coursesService
      .listManaged({ page: 0, size: 100 })
      .pipe(finalize(() => this.loadingCourses.set(false)))
      .subscribe({
        next: (res) => this.courses.set(res.content),
        error: () => this.courses.set([]),
      });
  }

  protected onCourseChange(id: number | null): void {
    this.courseId.set(id);
    this.moduleId.set(null);
    this.lessonId.set(null);
    this.modules.set([]);
    this.lessons.set([]);
    this.evaluations.set([]);
    if (id !== null) this.loadModulesFor(id);
    this.syncQueryParams();
  }

  protected onModuleChange(id: number | null): void {
    this.moduleId.set(id);
    this.lessonId.set(null);
    this.lessons.set([]);
    this.evaluations.set([]);
    if (id !== null) this.loadLessonsFor(id);
    this.syncQueryParams();
  }

  protected onLessonChange(id: number | null): void {
    this.lessonId.set(id);
    this.syncQueryParams();
    if (id !== null) this.reload();
    else this.evaluations.set([]);
  }

  protected changeStatus(evaluation: Evaluation, status: ContentStatus): void {
    if (evaluation.status === status) return;
    this.pendingActionId.set(evaluation.id);
    this.evaluationsService
      .changeStatus(evaluation.id, status)
      .pipe(finalize(() => this.pendingActionId.set(null)))
      .subscribe({
        next: (updated) =>
          this.evaluations.update((list) =>
            list.map((e) => (e.id === updated.id ? updated : e)),
          ),
        error: () =>
          this.error.set('No pudimos actualizar el estado de la evaluación. Inténtalo nuevamente.'),
      });
  }

  protected deleteEvaluation(evaluation: Evaluation): void {
    const confirmed = window.confirm(
      `¿Eliminar la evaluación "${evaluation.name}"? Se borrarán también sus preguntas e intentos.`,
    );
    if (!confirmed) return;
    this.pendingActionId.set(evaluation.id);
    this.evaluationsService
      .delete(evaluation.id)
      .pipe(finalize(() => this.pendingActionId.set(null)))
      .subscribe({
        next: () =>
          this.evaluations.update((list) => list.filter((e) => e.id !== evaluation.id)),
        error: () =>
          this.error.set('No pudimos eliminar la evaluación. Inténtalo nuevamente.'),
      });
  }

  private reload(): void {
    const id = this.lessonId();
    if (id === null) return;
    this.loading.set(true);
    this.error.set(null);
    this.evaluationsService
      .listByLesson(id)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar las evaluaciones de esta lección.');
          return of([] as readonly Evaluation[]);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((list) => this.evaluations.set(list));
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        course: this.courseId(),
        module: this.moduleId(),
        lesson: this.lessonId(),
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
