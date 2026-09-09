import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';

/** Entrada del menú lateral del área administrativa. */
interface NavItem {
  readonly path: string;
  readonly icon: string;
  readonly label: string;
}

/**
 * Layout principal del área privada del administrador.
 *
 * Comparte la estructura con los demás shells de la plataforma pero
 * expone la navegación específica del rol y una etiqueta identificando
 * la sección administrativa.
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;

  protected readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const f = u.firstName?.[0] ?? '';
    const l = u.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || (u.username?.[0]?.toUpperCase() ?? '?');
  });

  protected readonly displayName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  });

  protected readonly menuOpen = signal(false);

  protected readonly navItems: readonly NavItem[] = [
    { path: 'dashboard', icon: '📊', label: 'Panel' },
    { path: 'users', icon: '👥', label: 'Usuarios' },
    { path: 'support', icon: '🛠️', label: 'Soporte' },
  ];

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }

  protected logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/auth/login']),
      error: () => void this.router.navigate(['/auth/login']),
    });
  }
}
