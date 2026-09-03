import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';

/**
 * Formulario de registro de un nuevo estudiante.
 *
 * Refleja las reglas de validación declaradas por el backend en
 * {@code RegisterRequest}: nombre de usuario alfanumérico con puntos,
 * guiones y guiones bajos, contraseña de al menos ocho caracteres con
 * letras y números, y datos personales obligatorios.
 *
 * Tras un registro exitoso se muestra una confirmación indicando que se
 * envió un correo de verificación. El usuario no queda autenticado
 * automáticamente: debe confirmar su correo y luego iniciar sesión.
 */
@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  /** Indica si la petición de registro está en curso. */
  protected readonly submitting = signal(false);

  /** Mensaje de error de negocio devuelto por el backend, si aplica. */
  protected readonly errorMessage = signal<string | null>(null);

  /** Se activa cuando el registro fue exitoso para mostrar la confirmación. */
  protected readonly succeeded = signal(false);

  /**
   * Formulario reactivo con los datos del nuevo usuario.
   *
   * Los patrones de nombre de usuario y contraseña se mantienen alineados
   * con las restricciones declaradas en el DTO del backend, evitando así
   * envíos que serán rechazados por validación en el servidor.
   */
  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(60),
        Validators.pattern(/^[a-zA-Z0-9._-]+$/),
      ],
    ],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  protected submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.errorMessage.set(null);
    this.submitting.set(true);

    this.auth
      .register(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => this.succeeded.set(true),
        error: (err: Error) => this.errorMessage.set(err.message),
      });
  }
}
