import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

/**
 * Layout compartido por todas las pantallas del módulo de autenticación.
 *
 * Presenta una composición de dos columnas: a la izquierda un panel de
 * marca con la propuesta de valor, y a la derecha el {@link RouterOutlet}
 * donde se renderiza el formulario activo (login, registro, recuperación
 * de contraseña, etc.). En viewports reducidos el panel de marca se
 * colapsa a una franja superior compacta para dar todo el ancho al
 * formulario.
 */
@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-shell.component.html',
  styleUrl: './auth-shell.component.scss',
})
export class AuthShellComponent {}
