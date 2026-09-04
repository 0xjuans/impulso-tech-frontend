import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';

/** Entrada del menú lateral del área del estudiante. */
interface NavItem {
  readonly path: string;
  readonly icon: string;
  readonly label: string;
}

/**
 * Layout principal del área privada del estudiante.
 *
 * Presenta una barra lateral fija con la navegación entre secciones,
 * una cabecera superior con el usuario autenticado y un contenedor
 * principal donde se renderiza cada página. En viewports estrechos la
 * barra lateral se convierte en un cajón desplegable controlado por un
 * botón hamburguesa.
 */
@Component({
  selector: 'app-student-shell',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-shell.component.html',
  styleUrl: './student-shell.component.scss',
})
export class StudentShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Usuario autenticado, expuesto de forma reactiva a la plantilla. */
  protected readonly user = this.auth.currentUser;

  /** Iniciales del usuario para el avatar circular de la cabecera. */
  protected readonly initials = computed(() => {
    const u = this.user();
    if (!u) {
      return '?';
    }
    const first = u.firstName?.[0] ?? '';
    const last = u.lastName?.[0] ?? '';
    return `${first}${last}`.toUpperCase() || u.username[0]?.toUpperCase() || '?';
  });

  /** Nombre para mostrar en la cabecera. */
  protected readonly displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  /** Estado del menú lateral en mobile: abierto o cerrado. */
  protected readonly menuOpen = signal(false);

  /**
   * Entradas del menú lateral. El listado se mantiene estático porque el
   * área del estudiante tiene un número acotado y estable de secciones
   * en esta fase del producto.
   */
  protected readonly navItems: readonly NavItem[] = [
    { path: 'home', icon: '🏠', label: 'Inicio' },
    { path: 'routes', icon: '🧭', label: 'Rutas' },
    { path: 'profile', icon: '👤', label: 'Mi perfil' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  /** Cierra el menú al presionar la tecla escape. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }

  /**
   * Cierra sesión invalidando el token en el backend y redirige al
   * inicio de sesión. Si la petición falla, la limpieza local ya la
   * realiza {@link AuthService#logout}.
   */
  protected logout(): void {
    this.auth.logout().subscribe({
      complete: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }
}
