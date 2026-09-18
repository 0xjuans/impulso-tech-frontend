import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { Project } from '../../../core/api/projects/project.dto';
import { ProjectsService } from '../../../core/api/projects/projects.service';
import { DifficultyLevel } from '../../../core/api/learning-routes/learning-route.dto';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

/**
 * Catálogo de proyectos publicados para el estudiante (RF-023).
 *
 * <p>Consume {@code /api/projects} (solo proyectos publicados) con
 * filtros de texto y dificultad. Cada tarjeta muestra las tecnologías
 * requeridas, el puntaje máximo, la XP y la fecha límite si aplica.</p>
 */
@Component({
  selector: 'app-student-projects-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projects-page.component.html',
  styleUrl: './projects-page.component.scss',
})
export class ProjectsPageComponent implements OnInit {
  private readonly service = inject(ProjectsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly projects = signal<readonly Project[]>([]);

  protected readonly search = signal('');
  protected readonly difficultyFilter = signal<DifficultyLevel | ''>('');

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listPublished({
        search: this.search().trim() || undefined,
        difficulty: this.difficultyFilter() || undefined,
        page: 0,
        size: 24,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los proyectos. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((res) => this.projects.set(res.content));
  }
}
