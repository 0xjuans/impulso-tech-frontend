import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Barra de navegación superior de la aplicación pública.
 *
 * Presenta el logotipo, los enlaces principales del sitio y las acciones
 * de autenticación. Cuando el usuario desplaza la página, la barra adopta
 * un fondo sólido con sombra sutil para preservar la legibilidad sobre
 * secciones de fondo oscuro (como el hero con video).
 */
@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NgClass, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  /** Indica si el usuario ya se ha desplazado desde la parte superior. */
  protected readonly scrolled = signal(false);

  /** Controla la apertura del menú móvil (hamburguesa). */
  protected readonly menuOpen = signal(false);

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.scrolled.set(window.scrollY > 24);
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
