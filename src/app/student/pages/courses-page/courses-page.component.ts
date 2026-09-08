import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Course } from '../../../core/api/courses/course.dto';
import { CoursesService } from '../../../core/api/courses/courses.service';

/**
 * Página que muestra el catálogo de cursos publicados (RF-040).
 *
 * Presenta una vista en grilla con la información clave de cada curso y
 * un enlace hacia el detalle, desde donde el estudiante podrá
 * inscribirse y avanzar por sus módulos.
 */
@Component({
  selector: 'app-courses-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './courses-page.component.html',
  styleUrl: './courses-page.component.scss',
})
export class CoursesPageComponent implements OnInit {
  private readonly coursesService = inject(CoursesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly courses = signal<readonly Course[]>([]);

  ngOnInit(): void {
    this.coursesService
      .listPublished({ page: 0, size: 24 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.courses.set(page.content),
        error: () =>
          this.error.set(
            'No pudimos cargar los cursos en este momento. Inténtalo nuevamente en unos minutos.',
          ),
      });
  }
}
