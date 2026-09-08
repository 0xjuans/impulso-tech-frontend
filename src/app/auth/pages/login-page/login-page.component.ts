import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { defaultAreaFor } from '../../../core/auth/guards/role.guard';
import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Formulario de inicio de sesión con correo y contraseña.
 *
 * Valida los campos en el cliente para brindar retroalimentación
 * inmediata, pero la validación definitiva la realiza siempre el
 * backend. Tras un inicio exitoso, el usuario es redirigido a la URL
 * indicada por el parámetro {@code returnUrl} o a la raíz de la
 * aplicación en su defecto.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Indica si la petición de login está en curso. */
  protected readonly submitting = signal(false);

  /** Último mensaje de error mostrado al usuario, si aplica. */
  protected readonly errorMessage = signal<string | null>(null);

  /** Formulario reactivo con las credenciales del usuario. */
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          const target = this.resolveReturnUrl();
          void this.router.navigateByUrl(target);
        },
        error: (err: Error) => this.errorMessage.set(err.message),
      });
  }

  /**
   * Devuelve la URL de destino tras el login. Sólo acepta rutas
   * internas relativas y descarta las que apuntan al propio flujo de
   * autenticación, para evitar bucles o redirecciones a rutas rotas
   * que caigan en el wildcard {@code **} y devuelvan al landing.
   */
  private resolveReturnUrl(): string {
    const fallback = defaultAreaFor(this.auth.currentUser()?.role ?? 'ESTUDIANTE');
    const raw = this.route.snapshot.queryParamMap.get('returnUrl');
    if (!raw) {
      return fallback;
    }
    const trimmed = raw.trim();
    const isInternal = trimmed.startsWith('/') && !trimmed.startsWith('//');
    const isAuthFlow = trimmed === '/' || trimmed === '' || trimmed.startsWith('/auth');
    if (!isInternal || isAuthFlow) {
      return fallback;
    }
    return trimmed;
  }
}
