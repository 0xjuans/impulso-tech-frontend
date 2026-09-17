import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';

import { Challenge } from '../../../core/api/challenges/challenge.dto';
import { ChallengesService } from '../../../core/api/challenges/challenges.service';
import { DifficultyLevel } from '../../../core/api/learning-routes/learning-route.dto';
import { StripHtmlPipe } from '../../../shared/pipes/strip-html.pipe';

/**
 * Catálogo de retos publicados para el estudiante (RF-014).
 *
 * <p>Consume el endpoint público {@code /api/challenges} (solo retos
 * en estado {@code PUBLICADO}) y presenta filtros por dificultad y
 * lenguaje. Al hacer clic en un reto se navega al detalle para leer
 * las instrucciones y enviar un intento.</p>
 */
@Component({
  selector: 'app-student-challenges-page',
  standalone: true,
  imports: [FormsModule, RouterLink, StripHtmlPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './challenges-page.component.html',
  styleUrl: './challenges-page.component.scss',
})
export class ChallengesPageComponent implements OnInit {
  private readonly service = inject(ChallengesService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly challenges = signal<readonly Challenge[]>([]);

  protected readonly search = signal('');
  protected readonly difficultyFilter = signal<DifficultyLevel | ''>('');
  protected readonly languageFilter = signal('');

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
        language: this.languageFilter().trim() || undefined,
        page: 0,
        size: 30,
      })
      .pipe(
        catchError(() => {
          this.error.set('No pudimos cargar los retos. Inténtalo nuevamente.');
          return of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 });
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((res) => this.challenges.set(res.content));
  }
}
