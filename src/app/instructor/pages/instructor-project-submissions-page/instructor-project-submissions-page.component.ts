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
  ProjectSubmissionStatus,
  ReviewSubmissionRequest,
} from '../../../core/api/projects/project.dto';
import { ProjectsService } from '../../../core/api/projects/projects.service';

/**
 * Panel de revisión de entregas de un proyecto (RF-045).
 *
 * <p>Muestra por defecto las entregas enviadas y en revisión. Permite
 * abrir la URL de la entrega, aplicar un estado (aprobar, solicitar
 * correcciones, rechazar) y otorgar una calificación de 0 a 100 con
 * retroalimentación textual.</p>
 */
@Component({
  selector: 'app-instructor-project-submissions-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-project-submissions-page.component.html',
  styleUrl: './instructor-project-submissions-page.component.scss',
})
export class InstructorProjectSubmissionsPageComponent implements OnInit {
  private readonly service = inject(ProjectsService);
  private readonly route = inject(ActivatedRoute);

  protected readonly projectId = signal<number | null>(null);
  protected readonly project = signal<Project | null>(null);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly submissions = signal<readonly ProjectSubmission[]>([]);

  protected readonly statusFilter = signal<ProjectSubmissionStatus | ''>('ENVIADA');
  protected readonly statuses: readonly ProjectSubmissionStatus[] = [
    'ENVIADA',
    'EN_REVISION',
    'APROBADA',
    'CORRECCION_SOLICITADA',
    'RECHAZADA',
  ];

  protected readonly reviewingId = signal<number | null>(null);
  protected readonly reviewStatus = signal<ProjectSubmissionStatus>('APROBADA');
  protected readonly reviewGrade = signal<number | null>(null);
  protected readonly reviewFeedback = signal('');
  protected readonly submittingReview = signal(false);
  protected readonly reviewError = signal<string | null>(null);

  protected readonly counts = computed(() => {
    const list = this.submissions();
    return {
      total: list.length,
      pending: list.filter((s) => s.status === 'ENVIADA' || s.status === 'EN_REVISION').length,
      approved: list.filter((s) => s.status === 'APROBADA').length,
      correction: list.filter((s) => s.status === 'CORRECCION_SOLICITADA').length,
      rejected: list.filter((s) => s.status === 'RECHAZADA').length,
    };
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.error.set('El proyecto solicitado no existe.');
      this.loading.set(false);
      return;
    }
    this.projectId.set(id);
    this.loadProject(id);
    this.reload();
  }

  private loadProject(id: number): void {
    this.service.get(id).subscribe({
      next: (p) => this.project.set(p),
      error: () => this.project.set(null),
    });
  }

  protected apply(): void {
    this.reload();
  }

  protected startReview(submission: ProjectSubmission): void {
    this.reviewingId.set(submission.id);
    this.reviewStatus.set(
      submission.status === 'ENVIADA' || submission.status === 'EN_REVISION'
        ? 'APROBADA'
        : submission.status,
    );
    this.reviewGrade.set(submission.grade);
    this.reviewFeedback.set(submission.feedback ?? '');
    this.reviewError.set(null);
  }

  protected cancelReview(): void {
    this.reviewingId.set(null);
    this.reviewGrade.set(null);
    this.reviewFeedback.set('');
    this.reviewError.set(null);
  }

  protected submitReview(submission: ProjectSubmission): void {
    if (this.submittingReview()) return;
    this.submittingReview.set(true);
    this.reviewError.set(null);
    const payload: ReviewSubmissionRequest = {
      status: this.reviewStatus(),
      grade: this.reviewGrade(),
      feedback: this.reviewFeedback().trim() || null,
    };
    this.service
      .reviewSubmission(submission.id, payload)
      .pipe(finalize(() => this.submittingReview.set(false)))
      .subscribe({
        next: (updated) => {
          this.submissions.update((list) =>
            list.map((s) => (s.id === updated.id ? updated : s)),
          );
          this.cancelReview();
        },
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.reviewError.set(
            message ?? 'No pudimos guardar la revisión. Inténtalo nuevamente.',
          );
        },
      });
  }

  private reload(): void {
    const id = this.projectId();
    if (id === null) return;
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listProjectSubmissions(id, {
        status: this.statusFilter() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar las entregas.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.submissions.set(response.content));
  }
}
