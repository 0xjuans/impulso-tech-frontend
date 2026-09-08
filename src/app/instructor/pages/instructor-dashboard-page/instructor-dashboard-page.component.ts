import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';

import { InstructorDashboard } from '../../../core/api/dashboard/dashboard.dto';
import { DashboardService } from '../../../core/api/dashboard/dashboard.service';

/**
 * Panel del instructor (RF-032).
 *
 * Muestra las métricas consolidadas de los contenidos gestionados, las
 * inscripciones recibidas y las tareas pendientes de revisión.
 */
@Component({
  selector: 'app-instructor-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-dashboard-page.component.html',
  styleUrl: './instructor-dashboard-page.component.scss',
})
export class InstructorDashboardPageComponent implements OnInit {
  private readonly service = inject(DashboardService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<InstructorDashboard | null>(null);

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
}
