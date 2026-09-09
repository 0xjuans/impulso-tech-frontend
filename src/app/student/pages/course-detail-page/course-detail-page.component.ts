import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';

import { Course, CourseModule } from '../../../core/api/courses/course.dto';
import { CoursesService } from '../../../core/api/courses/courses.service';
import { CourseProgress } from '../../../core/api/enrollments/enrollment.dto';
import { EnrollmentsService } from '../../../core/api/enrollments/enrollments.service';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { LessonsService } from '../../../core/api/lessons/lessons.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

/**
 * Página de detalle de un curso (RF-040, RF-011).
 *
 * Muestra la información general del curso, los módulos que lo componen
 * con sus lecciones y el progreso del estudiante autenticado si ya se
 * ha inscrito. Permite iniciar la inscripción con un único clic.
 */
@Component({
  selector: 'app-course-detail-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIconComponent],
  templateUrl: './course-detail-page.component.html',
  styleUrl: './course-detail-page.component.scss',
})
export class CourseDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly coursesService = inject(CoursesService);
  private readonly lessonsService = inject(LessonsService);
  private readonly enrollmentsService = inject(EnrollmentsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly enrolling = signal(false);
  protected readonly enrollmentError = signal<string | null>(null);

  protected readonly course = signal<Course | null>(null);
  protected readonly modules = signal<readonly CourseModule[]>([]);
  protected readonly lessonsByModule = signal<Record<number, readonly Lesson[]>>({});
  protected readonly progress = signal<CourseProgress | null>(null);

  /** Conjunto de lecciones completadas, derivado del progreso. */
  protected readonly completedLessonIds = computed(
    () => new Set(this.progress()?.completedLessonIds ?? []),
  );

  /** Indica si el estudiante ya está inscrito. */
  protected readonly enrolled = computed(() => this.progress() !== null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const courseId = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(courseId)) {
      this.error.set('Curso no válido.');
      this.loading.set(false);
      return;
    }

    this.coursesService
      .get(courseId)
      .pipe(
        switchMap((course) =>
          forkJoin({
            course: of(course),
            modules: this.coursesService.listModules(course.id),
            progress: this.enrollmentsService.getProgress(course.id).pipe(
              catchError(() => of(null as CourseProgress | null)),
            ),
          }),
        ),
        switchMap((data) =>
          forkJoin({
            base: of(data),
            lessons: data.modules.length
              ? forkJoin(
                  Object.fromEntries(
                    data.modules.map((m) => [m.id, this.lessonsService.listByModule(m.id)]),
                  ),
                )
              : of({} as Record<string, readonly Lesson[]>),
          }),
        ),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: ({ base, lessons }) => {
          this.course.set(base.course);
          this.modules.set(base.modules);
          this.progress.set(base.progress);
          const normalized: Record<number, readonly Lesson[]> = {};
          for (const [key, value] of Object.entries(lessons)) {
            normalized[Number(key)] = value;
          }
          this.lessonsByModule.set(normalized);
        },
        error: () =>
          this.error.set(
            'No pudimos cargar este curso en este momento. Inténtalo nuevamente en unos minutos.',
          ),
      });
  }

  /** Inicia la inscripción del estudiante autenticado y refresca el progreso. */
  protected enroll(): void {
    const course = this.course();
    if (!course || this.enrolling()) {
      return;
    }
    this.enrolling.set(true);
    this.enrollmentError.set(null);
    this.enrollmentsService
      .enroll(course.id)
      .pipe(
        switchMap(() => this.enrollmentsService.getProgress(course.id)),
        finalize(() => this.enrolling.set(false)),
      )
      .subscribe({
        next: (progress) => this.progress.set(progress),
        error: () =>
          this.enrollmentError.set(
            'No pudimos completar la inscripción. Inténtalo nuevamente.',
          ),
      });
  }
}
