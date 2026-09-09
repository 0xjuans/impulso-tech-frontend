import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { AdminUser } from '../../../core/api/admin/admin-user.dto';
import { AdminUsersService } from '../../../core/api/admin/admin-users.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Role, UserStatus } from '../../../core/auth/models/user.model';

/**
 * Página de gestión administrativa de usuarios (RF-030, RF-031).
 *
 * Permite listar los usuarios registrados, filtrar por rol y estado,
 * buscar por texto y cambiar el rol o el estado de cualquiera de ellos.
 * El backend impide que el administrador modifique su propio rol o
 * estado para evitar bloqueos accidentales.
 */
@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [DatePipe, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-users-page.component.html',
  styleUrl: './admin-users-page.component.scss',
})
export class AdminUsersPageComponent implements OnInit {
  private readonly service = inject(AdminUsersService);
  private readonly auth = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly users = signal<readonly AdminUser[]>([]);

  protected readonly search = signal('');
  protected readonly roleFilter = signal<Role | ''>('');
  protected readonly statusFilter = signal<UserStatus | ''>('');

  /** Identificador del administrador autenticado, para bloquear acciones sobre sí mismo. */
  protected readonly meId = this.auth.currentUser()?.id ?? null;

  protected readonly roles: readonly Role[] = ['ESTUDIANTE', 'INSTRUCTOR', 'ADMINISTRADOR'];
  protected readonly statuses: readonly UserStatus[] = [
    'PENDIENTE_VERIFICACION',
    'ACTIVA',
    'DESACTIVADA',
  ];

  ngOnInit(): void {
    this.reload();
  }

  protected apply(): void {
    this.reload();
  }

  protected changeRole(user: AdminUser, role: Role): void {
    if (user.role === role || user.id === this.meId) return;
    this.service.updateRole(user.id, role).subscribe({
      next: (updated) =>
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u))),
    });
  }

  protected changeStatus(user: AdminUser, status: UserStatus): void {
    if (user.status === status || user.id === this.meId) return;
    this.service.updateStatus(user.id, status).subscribe({
      next: (updated) =>
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u))),
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list({
        search: this.search().trim() || undefined,
        role: this.roleFilter() || undefined,
        status: this.statusFilter() || undefined,
        page: 0,
        size: 50,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (page) => this.users.set(page.content),
        error: () =>
          this.error.set(
            'No pudimos cargar los usuarios en este momento. Inténtalo nuevamente.',
          ),
      });
  }
}
