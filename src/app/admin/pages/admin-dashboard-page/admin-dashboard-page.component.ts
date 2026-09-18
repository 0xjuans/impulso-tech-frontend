import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { AdminDashboard } from '../../../core/api/dashboard/dashboard.dto';
import { DashboardService } from '../../../core/api/dashboard/dashboard.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

/**
 * Panel del administrador (RF-033).
 *
 * <p>Ofrece una vista consolidada del estado de la plataforma: base de
 * usuarios por rol y por estado, salud del catálogo de contenidos y
 * gestión de tickets de soporte, con accesos rápidos a las secciones
 * más operativas del panel administrativo.</p>
 */
@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<AdminDashboard | null>(null);

  protected readonly firstName = computed(() => this.auth.currentUser()?.firstName ?? '');

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 6)  return 'Guardando el sistema';
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  /** Total de usuarios de la plataforma. */
  protected readonly totalUsers = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return d.students + d.instructors + d.administrators;
  });

  /** Porcentaje de usuarios activos sobre el total. */
  protected readonly activePct = computed(() =>
    this.percentage(this.data()?.activeUsers, this.totalUsers()),
  );

  /** Porcentaje de cursos publicados. */
  protected readonly coursesPublishedPct = computed(() =>
    this.percentage(this.data()?.coursesPublished, this.data()?.coursesTotal),
  );

  /** Porcentaje de rutas publicadas. */
  protected readonly routesPublishedPct = computed(() =>
    this.percentage(this.data()?.routesPublished, this.data()?.routesTotal),
  );

  /** Total de tickets independiente de su estado. */
  protected readonly totalTickets = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return d.openTickets + d.resolvedTickets + d.closedTickets;
  });

  ngOnInit(): void {
    this.service
      .getAdmin()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (d) => this.data.set(d),
        error: () =>
          this.error.set(
            'No pudimos cargar el panel administrativo en este momento. Inténtalo nuevamente.',
          ),
      });
  }

  private percentage(part?: number, total?: number): number {
    if (!part || !total) return 0;
    return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
  }
}
