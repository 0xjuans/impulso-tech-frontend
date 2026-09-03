import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Formulario para establecer una nueva contraseña a partir del token
 * emitido por el enlace de recuperación.
 *
 * El token viaja como parámetro de query (por ejemplo,
 * {@code /auth/reset-password?token=...}). Si no está presente se
 * bloquea el envío y se invita al usuario a solicitar un nuevo enlace.
 */
@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reset-password-page.component.html',
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly submitting = signal(false);
  protected readonly succeeded = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly missingToken = signal(false);

  /**
   * Token de recuperación tomado de la URL. Se guarda en un signal para
   * facilitar su acceso desde el método de envío sin volver a leer los
   * parámetros de ruta.
   */
  private token = '';

  protected readonly form = this.fb.nonNullable.group({
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.missingToken.set(!this.token);
  }

  /** Indica si las dos contraseñas coinciden para mostrar un error en tiempo real. */
  protected passwordsMatch(): boolean {
    return this.form.controls.newPassword.value === this.form.controls.confirmPassword.value;
  }

  protected submit(): void {
    if (this.form.invalid || this.submitting() || this.missingToken()) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.passwordsMatch()) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth
      .resetPassword({
        token: this.token,
        newPassword: this.form.controls.newPassword.value,
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.succeeded.set(true),
        error: (err: Error) => this.errorMessage.set(err.message),
      });
  }
}
