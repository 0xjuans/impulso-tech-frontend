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
  Challenge,
  ChallengeAttempt,
  ChallengeAttemptStatus,
  ReviewChallengeAttemptRequest,
} from '../../../core/api/challenges/challenge.dto';
import { ChallengesService } from '../../../core/api/challenges/challenges.service';

/**
 * Panel de revisión de intentos recibidos por un reto (RF-038).
 *
 * <p>El instructor ve los intentos pendientes por defecto, puede
 * cambiar el filtro por estado, revisar el código enviado y aplicar
 * una revisión con estado + feedback. La aprobación otorga la XP
 * asociada al reto según la lógica del backend.</p>
 */
@Component({
  selector: 'app-instructor-challenge-attempts-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-challenge-attempts-page.component.html',
  styleUrl: './instructor-challenge-attempts-page.component.scss',
})
export class InstructorChallengeAttemptsPageComponent implements OnInit {
  private readonly service = inject(ChallengesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly challengeId = signal<number | null>(null);
  protected readonly challenge = signal<Challenge | null>(null);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly attempts = signal<readonly ChallengeAttempt[]>([]);

  protected readonly statusFilter = signal<ChallengeAttemptStatus | ''>('PENDIENTE');
  protected readonly statuses: readonly ChallengeAttemptStatus[] = [
    'PENDIENTE',
    'APROBADO',
    'RECHAZADO',
  ];

  /** Formulario ligero de revisión abierto por intento (uno a la vez). */
  protected readonly reviewingId = signal<number | null>(null);
  protected readonly reviewStatus = signal<ChallengeAttemptStatus>('APROBADO');
  protected readonly reviewFeedback = signal('');
  protected readonly submittingReview = signal(false);
  protected readonly reviewError = signal<string | null>(null);

  protected readonly counts = computed(() => {
    const list = this.attempts();
    return {
      total: list.length,
      pending: list.filter((a) => a.status === 'PENDIENTE').length,
      approved: list.filter((a) => a.status === 'APROBADO').length,
      rejected: list.filter((a) => a.status === 'RECHAZADO').length,
    };
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      this.error.set('El reto solicitado no existe.');
      this.loading.set(false);
      return;
    }
    this.challengeId.set(id);
    this.loadChallenge(id);
    this.reload();
  }

  private loadChallenge(id: number): void {
    this.service.get(id).subscribe({
      next: (c) => this.challenge.set(c),
      error: () => this.challenge.set(null),
    });
  }

  protected apply(): void {
    this.reload();
  }

  protected startReview(attempt: ChallengeAttempt): void {
    this.reviewingId.set(attempt.id);
    this.reviewStatus.set(attempt.status === 'PENDIENTE' ? 'APROBADO' : attempt.status);
    this.reviewFeedback.set(attempt.feedback ?? '');
    this.reviewError.set(null);
  }

  protected cancelReview(): void {
    this.reviewingId.set(null);
    this.reviewFeedback.set('');
    this.reviewError.set(null);
  }

  protected submitReview(attempt: ChallengeAttempt): void {
    if (this.submittingReview()) return;
    this.submittingReview.set(true);
    this.reviewError.set(null);
    const payload: ReviewChallengeAttemptRequest = {
      status: this.reviewStatus(),
      feedback: this.reviewFeedback().trim() || null,
    };
    this.service
      .reviewAttempt(attempt.id, payload)
      .pipe(finalize(() => this.submittingReview.set(false)))
      .subscribe({
        next: (updated) => {
          this.attempts.update((list) =>
            list.map((a) => (a.id === updated.id ? updated : a)),
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
    const id = this.challengeId();
    if (id === null) return;
    this.loading.set(true);
    this.error.set(null);
    this.service
      .listChallengeAttempts(id, {
        status: this.statusFilter() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los intentos.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.attempts.set(response.content));
  }
}
