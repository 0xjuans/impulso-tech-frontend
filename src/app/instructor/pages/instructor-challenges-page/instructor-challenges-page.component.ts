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

import { Challenge } from '../../../core/api/challenges/challenge.dto';
import { ChallengesService } from '../../../core/api/challenges/challenges.service';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';
import {
  ContentStatus,
  DifficultyLevel,
} from '../../../core/api/learning-routes/learning-route.dto';

/**
 * Panel de gestión de retos del instructor (RF-013).
 *
 * <p>Consume el endpoint {@code /api/challenges/manage}, permite
 * filtrar por texto, dificultad, estado y lenguaje, y ofrece acciones
 * rápidas para publicar, retirar o eliminar retos existentes.</p>
 */
@Component({
  selector: 'app-instructor-challenges-page',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-challenges-page.component.html',
  styleUrl: './instructor-challenges-page.component.scss',
})
export class InstructorChallengesPageComponent implements OnInit {
  private readonly service = inject(ChallengesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly challenges = signal<readonly Challenge[]>([]);

  protected readonly search = signal('');
  protected readonly difficultyFilter = signal<DifficultyLevel | ''>('');
  protected readonly statusFilter = signal<ContentStatus | ''>('');
  protected readonly languageFilter = signal('');

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
    const list = this.challenges();
    return {
      total: list.length,
      published: list.filter((c) => c.status === 'PUBLICADO').length,
      draft: list.filter((c) => c.status === 'BORRADOR').length,
      disabled: list.filter((c) => c.status === 'DESHABILITADO').length,
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected changeStatus(challenge: Challenge, status: ContentStatus): void {
    if (challenge.status === status) return;
    this.pendingActionId.set(challenge.id);
    this.service
      .changeStatus(challenge.id, status)
      .pipe(finalize(() => this.pendingActionId.set(null)))
      .subscribe({
        next: (updated) =>
          this.challenges.update((list) => list.map((c) => (c.id === updated.id ? updated : c))),
        error: () =>
          this.error.set('No pudimos actualizar el estado del reto. Inténtalo nuevamente.'),
      });
  }

  protected deleteChallenge(challenge: Challenge): void {
    const confirmed = window.confirm(
      `¿Eliminar el reto "${challenge.name}"? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    this.pendingActionId.set(challenge.id);
    this.service
      .delete(challenge.id)
      .pipe(finalize(() => this.pendingActionId.set(null)))
      .subscribe({
        next: () =>
          this.challenges.update((list) => list.filter((c) => c.id !== challenge.id)),
        error: () =>
          this.error.set('No pudimos eliminar el reto. Inténtalo nuevamente.'),
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
        language: this.languageFilter().trim() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los retos. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => this.challenges.set(response.content));
  }
}
