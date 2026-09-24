import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';
import { AppIconComponent } from '../app-icon/app-icon.component';

/**
 * Píldora de usuario del shell privado.
 *
 * <p>Muestra la foto de perfil del usuario autenticado o, en su defecto,
 * sus iniciales sobre un círculo con la identidad naranja. Al hacer
 * clic abre un menú compacto con acceso al perfil y cierre de sesión.
 * El menú vive dentro del propio componente para poder reutilizarse
 * desde los shells de estudiante, instructor y administrador sin
 * duplicar la lógica.</p>
 *
 * <p>Resuelve el destino del enlace "Mi perfil" a partir del rol del
 * usuario autenticado, para no cruzar las guardias de rol al navegar
 * desde un shell hacia otro.</p>
 */
@Component({
  selector: 'app-user-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppIconComponent],
  templateUrl: './user-pill.component.html',
  styleUrl: './user-pill.component.scss',
})
export class UserPillComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly open = signal(false);

  /** URL de la foto de perfil, si el usuario tiene una configurada. */
  protected readonly photoUrl = computed<string | null>(() => {
    const u = this.user();
    const url = u?.profilePhotoUrl?.trim();
    return url && url.length > 0 ? url : null;
  });

  /** Iniciales para el placeholder circular cuando no hay foto. */
  protected readonly initials = computed<string>(() => {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.[0] ?? '';
    const last = u.lastName?.[0] ?? '';
    const composed = `${first}${last}`.toUpperCase();
    return composed || u.username?.[0]?.toUpperCase() || '?';
  });

  /** Nombre completo mostrado al lado del avatar en desktop. */
  protected readonly displayName = computed<string>(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  });

  /** Etiqueta del rol para el menú desplegable. */
  protected readonly roleLabel = computed<string>(() => {
    switch (this.user()?.role) {
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'INSTRUCTOR':
        return 'Instructor';
      case 'ESTUDIANTE':
        return 'Estudiante';
      default:
        return '';
    }
  });

  /** Enlace a la página de perfil según el rol activo. */
  protected readonly profileUrl = computed<string>(() => {
    switch (this.user()?.role) {
      case 'ADMINISTRADOR':
        return '/admin/profile';
      case 'INSTRUCTOR':
        return '/instructor/profile';
      default:
        return '/student/profile';
    }
  });

  protected toggle(event: Event): void {
    event.stopPropagation();
    this.open.update((v) => !v);
  }

  protected close(): void {
    this.open.set(false);
  }

  /**
   * Cierra la sesión y redirige al login. La operación se dispara
   * antes de resetear el estado local del componente para que la
   * transición sea inmediata.
   */
  protected logout(event: Event): void {
    event.stopPropagation();
    this.close();
    this.auth.logout().subscribe({
      complete: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }

  /**
   * Neutraliza los errores de carga de la imagen: si la URL falla,
   * el signal de foto se resetea y el placeholder de iniciales toma
   * su lugar.
   */
  protected onPhotoError(): void {
    // Al fallar la carga (URL 404 o CORS) forzamos el placeholder de
    // iniciales limpiando la URL. Como la fuente proviene del signal
    // del usuario autenticado, actualizamos el usuario en memoria.
    const u = this.user();
    if (u) {
      this.auth.updateCurrentUser({ ...u, profilePhotoUrl: null });
    }
  }

  @HostListener('document:click')
  protected onDocumentClick(): void {
    if (this.open()) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  protected stop(event: Event): void {
    event.stopPropagation();
  }
}
