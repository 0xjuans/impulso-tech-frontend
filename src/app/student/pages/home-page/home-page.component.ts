import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { Enrollment } from '../../../core/api/enrollments/enrollment.dto';
import { EnrollmentsService } from '../../../core/api/enrollments/enrollments.service';

/**
 * Página de inicio del estudiante.
 *
 * Da la bienvenida al usuario autenticado y ofrece un vistazo a las
 * inscripciones activas para retomar el estudio con un solo clic. La
 * información proviene del backend a través de {@link EnrollmentsService}
 * y se muestra con estados de carga, vacío y error explícitos.
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

  ngOnInit(): void {
    this.enrollmentsService
      .listMine(0, 6)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.enrollments.set(page.content),
        error: () =>
          this.error.set(
            'No pudimos cargar tus cursos por ahora. Vuelve a intentarlo en unos minutos.',
          ),
      });
  }
}
