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
import { InstructorDashboard } from '../../../core/api/dashboard/dashboard.dto';
import { DashboardService } from '../../../core/api/dashboard/dashboard.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

/**
 * Panel del instructor (RF-032).
 *
 * <p>Presenta un tablero visual con las métricas clave, una barra de
 * accesos rápidos a las acciones más comunes (crear ruta, curso, reto)
 * y desgloses por estado con barras de progreso para dar contexto
 * inmediato de la salud del contenido gestionado.</p>
 *
 * <p>La UI se prioriza sobre las tareas más urgentes para el
 * instructor: los "pendientes por revisar" quedan al principio con
 * énfasis visual cuando hay trabajo por hacer.</p>
 */
@Component({
  selector: 'app-instructor-dashboard-page',
  standalone: true,
  imports: [RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-dashboard-page.component.html',
  styleUrl: './instructor-dashboard-page.component.scss',
})
export class InstructorDashboardPageComponent implements OnInit {
  private readonly service = inject(DashboardService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<InstructorDashboard | null>(null);

  /** Nombre del instructor autenticado para el saludo del hero. */
  protected readonly firstName = computed(() => this.auth.currentUser()?.firstName ?? '');

  /** Saludo contextual según la hora local del navegador. */
  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 6)  return 'Trabajando de madrugada';
    if (hour < 12) return 'Buenos días';
    if (hour < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  /**
   * Total agregado de tareas pendientes; se usa para pintar la banda
   * superior de alertas cuando hay algo por revisar.
   */
  protected readonly totalPending = computed(() => {
    const d = this.data();
    if (!d) return 0;
    return d.pendingChallenges + d.pendingProjects + d.openAssignedTickets;
  });

  /** Porcentaje publicado sobre el total de rutas gestionadas. */
  protected readonly routesPublishedPct = computed(() =>
    this.percentage(this.data()?.routesPublished, this.data()?.routesTotal),
  );

  /** Porcentaje publicado sobre el total de cursos gestionados. */
  protected readonly coursesPublishedPct = computed(() =>
    this.percentage(this.data()?.coursesPublished, this.data()?.coursesTotal),
  );

  /** Promedio de inscripciones por estudiante único (retención). */
  protected readonly avgEnrollments = computed(() => {
    const d = this.data();
    if (!d || d.uniqueStudents === 0) return '0';
    return (d.totalEnrollments / d.uniqueStudents).toFixed(1);
  });

  ngOnInit(): void {
    this.service
      .getInstructor()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (d) => this.data.set(d),
        error: () =>
          this.error.set(
            'No pudimos cargar el panel en este momento. Inténtalo nuevamente en unos minutos.',
          ),
      });
  }

  /** Calcula un porcentaje entero acotado [0, 100]. */
  private percentage(part?: number, total?: number): number {
    if (!part || !total) return 0;
    return Math.max(0, Math.min(100, Math.round((part / total) * 100)));
  }
}
