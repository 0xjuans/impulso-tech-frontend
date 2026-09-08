import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ContentStatus } from '../../../core/api/learning-routes/learning-route.dto';
import { Course, CreateCourseRequest } from '../../../core/api/courses/course.dto';
import { CoursesService } from '../../../core/api/courses/courses.service';

/**
 * Página con los cursos gestionados por el instructor (RF-040).
 *
 * Ofrece un listado con filtros por estado, la posibilidad de crear un
 * curso rápido con datos mínimos y acceso al editor completo de cada
 * curso.
 */
@Component({
  selector: 'app-instructor-courses-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-courses-page.component.html',
  styleUrl: './instructor-courses-page.component.scss',
})
export class InstructorCoursesPageComponent implements OnInit {
  private readonly service = inject(CoursesService);
  private readonly router = inject(Router);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly courses = signal<readonly Course[]>([]);
  protected readonly statusFilter = signal<ContentStatus | ''>('');
  protected readonly search = signal('');

  protected readonly creating = signal(false);
  protected readonly createError = signal<string | null>(null);
  protected readonly showForm = signal(false);
  protected readonly draft = signal<CreateCourseRequest>({
    name: '',
    description: '',
    difficulty: 'PRINCIPIANTE',
  });

  ngOnInit(): void {
    this.reload();
  }

  protected applyFilters(): void {
    this.reload();
  }

  protected toggleForm(): void {
    this.showForm.update((v) => !v);
    if (!this.showForm()) {
      this.createError.set(null);
    }
  }

  protected updateDraft<K extends keyof CreateCourseRequest>(
    key: K,
    value: CreateCourseRequest[K],
  ): void {
    this.draft.update((d) => ({ ...d, [key]: value }));
  }

  protected create(): void {
    const draft = this.draft();
    if (!draft.name.trim() || !draft.description.trim() || this.creating()) {
      this.createError.set('Nombre y descripción son obligatorios.');
      return;
    }
    this.creating.set(true);
    this.createError.set(null);
    this.service
      .create({
        name: draft.name.trim(),
        description: draft.description.trim(),
        objective: draft.objective?.trim() || null,
        difficulty: draft.difficulty,
        technology: draft.technology?.trim() || null,
        estimatedDurationHours: draft.estimatedDurationHours ?? null,
        generatesCertificate: draft.generatesCertificate ?? false,
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (created) => {
          void this.router.navigate(['/instructor/courses', created.id]);
        },
        error: () =>
          this.createError.set(
            'No pudimos crear el curso. Verifica los datos e inténtalo nuevamente.',
          ),
      });
  }

  protected quickPublish(course: Course): void {
    if (course.status === 'PUBLICADO') return;
    this.service.changeStatus(course.id, 'PUBLICADO').subscribe({
      next: (updated) =>
        this.courses.update((list) =>
          list.map((c) => (c.id === updated.id ? updated : c)),
        ),
    });
  }

  protected quickDisable(course: Course): void {
    if (course.status === 'DESHABILITADO') return;
    this.service.changeStatus(course.id, 'DESHABILITADO').subscribe({
      next: (updated) =>
        this.courses.update((list) =>
          list.map((c) => (c.id === updated.id ? updated : c)),
        ),
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listManaged({
        search: this.search().trim() || undefined,
        status: this.statusFilter() || undefined,
        page: 0,
        size: 30,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.courses.set(page.content),
        error: () =>
          this.error.set(
            'No pudimos cargar tus cursos en este momento. Inténtalo nuevamente.',
          ),
      });
  }
}
