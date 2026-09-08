import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { finalize } from 'rxjs';

import { AdminDashboard } from '../../../core/api/dashboard/dashboard.dto';
import { DashboardService } from '../../../core/api/dashboard/dashboard.service';

/**
 * Panel del administrador (RF-033).
 *
 * Muestra las métricas globales de la plataforma: usuarios por rol y
 * estado, contenidos por estado y estado de los tickets de soporte.
 */
@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss',
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly service = inject(DashboardService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly data = signal<AdminDashboard | null>(null);

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
}
