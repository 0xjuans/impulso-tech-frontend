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
import { AppIconComponent, AppIconName } from '../../../shared/components/app-icon/app-icon.component';

/** Entrada del menú lateral del área del instructor. */
interface NavItem {
  readonly path: string;
  readonly icon: AppIconName;
  readonly label: string;
}

/**
 * Layout principal del área privada del instructor.
 *
 * Comparte la misma estructura visual que el shell del estudiante,
 * ajustando el color y la navegación a las secciones propias del rol.
 */
@Component({
  selector: 'app-instructor-shell',
  standalone: true,
  imports: [NgClass, RouterLink, RouterLinkActive, RouterOutlet, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './instructor-shell.component.html',
  styleUrl: './instructor-shell.component.scss',
})
export class InstructorShellComponent {
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
    { path: 'dashboard', icon: 'dashboard', label: 'Panel' },
    { path: 'courses', icon: 'book', label: 'Cursos' },
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
