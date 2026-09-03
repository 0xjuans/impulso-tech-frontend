import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Pantalla a la que llegan los usuarios desde el enlace de verificación
 * enviado por correo.
 *
 * Toma el token del parámetro {@code token} de la URL, lo envía al
 * backend y muestra el resultado. Si no hay token, invita al usuario a
 * solicitar un nuevo enlace desde su bandeja de entrada.
 */
@Component({
  selector: 'app-verify-page',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verify-page.component.html',
})
export class VerifyPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  /** Estado de la operación: cargando, éxito, error o token ausente. */
  protected readonly state = signal<'loading' | 'success' | 'error' | 'missing'>('loading');

  /** Mensaje asociado al resultado, mostrado al usuario. */
  protected readonly message = signal<string>('Verificando tu correo, espera un momento...');

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('missing');
      this.message.set(
        'No encontramos un token en el enlace. Revisa el correo que te enviamos y vuelve a intentarlo.',
      );
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: (response) => {
        this.state.set('success');
        this.message.set(response.message);
      },
      error: (err: Error) => {
        this.state.set('error');
        this.message.set(err.message);
      },
    });
  }
}
