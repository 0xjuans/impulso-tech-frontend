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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import {
  Project,
  ProjectSubmission,
} from '../../../core/api/projects/project.dto';
import { ProjectsService } from '../../../core/api/projects/projects.service';

/**
 * Detalle de proyecto para el estudiante (RF-023).
 *
 * <p>Muestra las instrucciones, requisitos, recursos y criterios de
 * evaluación del proyecto. Permite enviar una nueva entrega con la
 * URL del trabajo y notas opcionales, y lista el historial de entregas
 * propias del estudiante ordenadas por fecha.</p>
 */
@Component({
  selector: 'app-student-project-detail-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-detail-page.component.html',
  styleUrl: './project-detail-page.component.scss',
})
export class ProjectDetailPageComponent implements OnInit {
  private readonly service = inject(ProjectsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly project = signal<Project | null>(null);
  protected readonly submissions = signal<readonly ProjectSubmission[]>([]);

  protected readonly submissionUrl = signal('');
  protected readonly studentNotes = signal('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitOk = signal<string | null>(null);

  protected readonly canSubmit = computed(() => this.submissionUrl().trim().length > 0);

  protected readonly sortedSubmissions = computed(() =>
    [...this.submissions()].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    ),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error.set('El proyecto solicitado no existe.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.service
      .get(id)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar el proyecto. Puede haber sido retirado.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((project) => {
        this.project.set(project);
        if (project) this.loadSubmissions(id);
      });
  }

  private loadSubmissions(id: number): void {
    this.service.listMySubmissions(id).subscribe({
      next: (list) => this.submissions.set(list),
      error: () => this.submissions.set([]),
    });
  }

  protected submit(): void {
    const p = this.project();
    if (!p || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitOk.set(null);
    this.service
      .submitEntry(p.id, {
        submissionUrl: this.submissionUrl().trim(),
        studentNotes: this.studentNotes().trim() || null,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (submission) => {
          this.submissions.update((list) => [submission, ...list]);
          this.submitOk.set('Tu entrega fue enviada correctamente.');
          this.submissionUrl.set('');
          this.studentNotes.set('');
        },
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.submitError.set(
            message ?? 'No pudimos enviar tu entrega. Inténtalo nuevamente.',
          );
        },
      });
  }
}
