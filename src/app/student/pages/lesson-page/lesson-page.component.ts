import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { CourseProgress } from '../../../core/api/enrollments/enrollment.dto';
import { EnrollmentsService } from '../../../core/api/enrollments/enrollments.service';
import { Lesson } from '../../../core/api/lessons/lesson.dto';
import { LessonsService } from '../../../core/api/lessons/lessons.service';

/**
 * Página del contenido de una lección (RF-041).
 *
 * Muestra el contenido textual de la lección y permite al estudiante
 * marcarla como completada, avanzando su progreso en el curso.
 */
@Component({
  selector: 'app-lesson-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './lesson-page.component.html',
  styleUrl: './lesson-page.component.scss',
})
export class LessonPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly lessonsService = inject(LessonsService);
  private readonly enrollmentsService = inject(EnrollmentsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly lesson = signal<Lesson | null>(null);
  protected readonly progress = signal<CourseProgress | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const lessonId = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(lessonId)) {
      this.error.set('Lección no válida.');
      this.loading.set(false);
      return;
    }
    this.lessonsService
      .get(lessonId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (lesson) => this.lesson.set(lesson),
        error: () =>
          this.error.set(
            'No pudimos cargar esta lección en este momento. Inténtalo nuevamente.',
          ),
      });
  }

  protected complete(): void {
    const lesson = this.lesson();
    if (!lesson || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.saveError.set(null);
    this.enrollmentsService
      .completeLesson(lesson.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (progress) => this.progress.set(progress),
        error: () =>
          this.saveError.set(
            'No pudimos registrar el avance. Verifica que estés inscrito en el curso.',
          ),
      });
  }

  /** Indica si la lección ya está marcada como completada por el estudiante. */
  protected isCompleted(): boolean {
    const lesson = this.lesson();
    const progress = this.progress();
    return lesson != null && progress != null && progress.completedLessonIds.includes(lesson.id);
  }
}
