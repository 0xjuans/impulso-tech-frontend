import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/services/auth.service';
import { Enrollment } from '../../../core/api/enrollments/enrollment.dto';
import { EnrollmentsService } from '../../../core/api/enrollments/enrollments.service';
import {
  RankingEntry,
  UserBadge,
  UserStreak,
  UserXp,
} from '../../../core/api/gamification/gamification.dto';
import { GamificationService } from '../../../core/api/gamification/gamification.service';

/**
 * Página de inicio del estudiante.
 *
 * Además de mostrar los cursos activos, presenta un resumen del estado
 * de gamificación (XP y nivel, racha, insignias recientes y las
 * primeras posiciones del ranking) para que el estudiante tenga a la
 * vista su progreso y motivación al entrar a la plataforma
 * (RF-018 a RF-021).
 */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [DatePipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly enrollmentsService = inject(EnrollmentsService);
  private readonly gamification = inject(GamificationService);

  /** Usuario autenticado expuesto a la plantilla. */
  protected readonly user = this.auth.currentUser;

  /** Saludo dinámico según la hora del día. */
  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly enrollments = signal<readonly Enrollment[]>([]);

  protected readonly xp = signal<UserXp | null>(null);
  protected readonly streak = signal<UserStreak | null>(null);
  protected readonly badges = signal<readonly UserBadge[]>([]);
  protected readonly rankingTop = signal<readonly RankingEntry[]>([]);
  protected readonly myRankingPosition = signal<RankingEntry | null>(null);

  /** Porcentaje de progreso hacia el siguiente nivel, acotado a [0, 100]. */
  protected readonly levelProgress = computed(() => {
    const xp = this.xp();
    if (!xp) return 0;
    const span = xp.xpForNextLevel - xp.xpForCurrentLevel;
    if (span <= 0) return 0;
    const pct = Math.round((xp.xpIntoCurrentLevel / span) * 100);
    return Math.max(0, Math.min(100, pct));
  });

  ngOnInit(): void {
    forkJoin({
      enrollments: this.enrollmentsService
        .listMine(0, 6)
        .pipe(catchError(() => of({ content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 }))),
      xp: this.gamification.getMyXp().pipe(catchError(() => of(null as UserXp | null))),
      streak: this.gamification
        .getMyStreak()
        .pipe(catchError(() => of(null as UserStreak | null))),
      badges: this.gamification
        .listMyBadges()
        .pipe(catchError(() => of([] as readonly UserBadge[]))),
      ranking: this.gamification
        .getRanking('ALL_TIME', 5)
        .pipe(catchError(() => of(null as { entries: readonly RankingEntry[]; me: RankingEntry | null } | null))),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ enrollments, xp, streak, badges, ranking }) => {
          this.enrollments.set(enrollments.content);
          this.xp.set(xp);
          this.streak.set(streak);
          this.badges.set(badges);
          this.rankingTop.set(ranking?.entries ?? []);
          this.myRankingPosition.set(ranking?.me ?? null);
        },
        error: () =>
          this.error.set(
            'No pudimos cargar el panel en este momento. Vuelve a intentarlo en unos minutos.',
          ),
      });
  }

  /** Devuelve las tres insignias más recientes del estudiante. */
  protected recentBadges(): readonly UserBadge[] {
    return this.badges().slice(0, 3);
  }
}
