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
} from '../../../core/api/challenges/challenge.dto';
import { ChallengesService } from '../../../core/api/challenges/challenges.service';

/**
 * Detalle de un reto para el estudiante (RF-014).
 *
 * <p>Muestra las instrucciones del reto (HTML enriquecido), los
 * lenguajes permitidos, ejemplos de I/O y casos de prueba públicos.
 * Ofrece un panel para enviar un intento con el lenguaje y el código,
 * y lista el historial de intentos propios ordenado del más reciente
 * al más antiguo.</p>
 */
@Component({
  selector: 'app-student-challenge-detail-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './challenge-detail-page.component.html',
  styleUrl: './challenge-detail-page.component.scss',
})
export class ChallengeDetailPageComponent implements OnInit {
  private readonly service = inject(ChallengesService);
  private readonly route = inject(ActivatedRoute);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly challenge = signal<Challenge | null>(null);
  protected readonly attempts = signal<readonly ChallengeAttempt[]>([]);

  protected readonly language = signal('');
  protected readonly code = signal('');
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);
  protected readonly submitOk = signal<string | null>(null);

  /** Idiomas permitidos como arreglo limpio para el selector. */
  protected readonly languageOptions = computed<readonly string[]>(() => {
    const c = this.challenge();
    if (!c) return [];
    return c.allowedLanguages
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  });

  protected readonly canSubmit = computed(
    () => this.language().trim().length > 0 && this.code().trim().length > 0,
  );

  /** Intentos ordenados del más reciente al más antiguo. */
  protected readonly sortedAttempts = computed(() =>
    [...this.attempts()].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    ),
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(id)) {
      this.error.set('El reto solicitado no existe.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.service
      .get(id)
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar el reto. Puede haber sido retirado.');
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((challenge) => {
        this.challenge.set(challenge);
        if (challenge) {
          const options = challenge.allowedLanguages
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          if (options.length > 0) this.language.set(options[0]);
          this.loadAttempts(id);
        }
      });
  }

  private loadAttempts(id: number): void {
    this.service.listMyAttempts(id).subscribe({
      next: (list) => this.attempts.set(list),
      error: () => this.attempts.set([]),
    });
  }

  protected submit(): void {
    const c = this.challenge();
    if (!c || !this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.submitError.set(null);
    this.submitOk.set(null);
    this.service
      .submitAttempt(c.id, { language: this.language(), code: this.code() })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (attempt) => {
          this.attempts.update((list) => [attempt, ...list]);
          this.submitOk.set('Tu intento fue enviado. Recibirás la retroalimentación pronto.');
          this.code.set('');
        },
        error: (err) => {
          const message = (err?.error?.message as string | undefined) ?? null;
          this.submitError.set(
            message ?? 'No pudimos enviar tu intento. Inténtalo nuevamente en unos segundos.',
          );
        },
      });
  }
}
