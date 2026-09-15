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
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { Project } from '../../../core/api/projects/project.dto';
import { ProjectsService } from '../../../core/api/projects/projects.service';
import {
  ContentStatus,
  DifficultyLevel,
} from '../../../core/api/learning-routes/learning-route.dto';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

/**
 * Panel de gestión de proyectos del instructor (RF-023).
 *
 * <p>Consume el endpoint {@code /api/projects/manage} que devuelve todos
 * los proyectos independientemente de su estado. Permite filtrar,
 * publicar, retirar y eliminar proyectos, además de acceder a la
 * bandeja de entregas por revisar.</p>
 */
@Component({
  selector: 'app-instructor-projects-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-projects-page.component.html',
  styleUrl: './instructor-projects-page.component.scss',
})
export class InstructorProjectsPageComponent implements OnInit {
  private readonly service = inject(ProjectsService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly projects = signal<readonly Project[]>([]);

  protected readonly search = signal('');
  protected readonly difficultyFilter = signal<DifficultyLevel | ''>('');
  protected readonly statusFilter = signal<ContentStatus | ''>('');

  protected readonly pendingActionId = signal<number | null>(null);

  protected readonly difficulties: readonly DifficultyLevel[] = [
    'PRINCIPIANTE',
    'INTERMEDIO',
    'AVANZADO',
  ];

  protected readonly statuses: readonly ContentStatus[] = [
    'BORRADOR',
    'PUBLICADO',
    'DESHABILITADO',
  ];

  protected readonly counts = computed(() => {
    const list = this.projects();
    return {
      total: list.length,
      published: list.filter((p) => p.status === 'PUBLICADO').length,
      draft: list.filter((p) => p.status === 'BORRADOR').length,
      disabled: list.filter((p) => p.status === 'DESHABILITADO').length,
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected changeStatus(project: Project, status: ContentStatus): void {
    if (project.status === status) return;
    this.pendingActionId.set(project.id);
    this.service
      .changeStatus(project.id, status)
      .pipe(finalize(() => this.pendingActionId.set(null)))
      .subscribe({
        next: (updated) =>
          this.projects.update((list) => list.map((p) => (p.id === updated.id ? updated : p))),
        error: () =>
          this.error.set('No pudimos actualizar el estado del proyecto. Inténtalo nuevamente.'),
      });
  }

  protected deleteProject(project: Project): void {
    const confirmed = window.confirm(
      `¿Eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    this.pendingActionId.set(project.id);
    this.service
      .delete(project.id)
      .pipe(finalize(() => this.pendingActionId.set(null)))
      .subscribe({
        next: () =>
          this.projects.update((list) => list.filter((p) => p.id !== project.id)),
        error: () =>
          this.error.set('No pudimos eliminar el proyecto. Inténtalo nuevamente.'),
      });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listAllForManagement({
        search: this.search().trim() || undefined,
        difficulty: this.difficultyFilter() || undefined,
        status: this.statusFilter() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los proyectos. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.projects.set(response.content));
  }
}
