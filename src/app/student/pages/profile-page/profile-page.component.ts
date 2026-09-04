import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/auth/services/auth.service';
import { UsersService } from '../../../core/api/users/users.service';

/**
 * Página de gestión del perfil del usuario autenticado (RF-005).
 *
 * Ofrece dos flujos independientes:
 *
 * 1. Actualización de la información pública del perfil (nombre,
 *    apellido, nombre de usuario y foto).
 * 2. Cambio de contraseña, que requiere la contraseña actual como
 *    control de seguridad, tal como exige el backend.
 *
 * Los datos siempre provienen del backend a través de {@link UsersService},
 * y al guardar un cambio se sincroniza el usuario autenticado en
 * {@link AuthService} para que el resto de la aplicación refleje la
 * actualización de forma inmediata.
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usersService = inject(UsersService);

  /** Usuario autenticado, expuesto de forma reactiva a la plantilla. */
  protected readonly user = this.auth.currentUser;

  protected readonly profileSubmitting = signal(false);
  protected readonly profileMessage = signal<string | null>(null);
  protected readonly profileError = signal<string | null>(null);

  protected readonly passwordSubmitting = signal(false);
  protected readonly passwordMessage = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);

  /** Formulario reactivo con la información editable del perfil. */
  protected readonly profileForm = this.fb.nonNullable.group({
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
    profilePhotoUrl: ['', [Validators.maxLength(500)]],
  });

  /** Formulario reactivo para el cambio de contraseña. */
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(100),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
      ],
    ],
  });

  ngOnInit(): void {
    // Cargar el perfil fresco desde el backend para no depender solo del
    // usuario cacheado en localStorage.
    this.usersService.getProfile().subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.profileForm.reset({
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          profilePhotoUrl: user.profilePhotoUrl ?? '',
        });
      },
      error: () => {
        // Se conserva el usuario cacheado; el formulario se rellenará con
        // sus datos como fallback.
        const cached = this.user();
        if (cached) {
          this.profileForm.reset({
            firstName: cached.firstName,
            lastName: cached.lastName,
            username: cached.username,
            profilePhotoUrl: cached.profilePhotoUrl ?? '',
          });
        }
      },
    });
  }

  protected submitProfile(): void {
    if (this.profileForm.invalid || this.profileSubmitting()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.profileError.set(null);
    this.profileMessage.set(null);
    this.profileSubmitting.set(true);

    const raw = this.profileForm.getRawValue();
    this.usersService
      .updateProfile({
        firstName: raw.firstName,
        lastName: raw.lastName,
        username: raw.username,
        profilePhotoUrl: raw.profilePhotoUrl || null,
      })
      .pipe(finalize(() => this.profileSubmitting.set(false)))
      .subscribe({
        next: (user) => {
          this.auth.updateCurrentUser(user);
          this.profileMessage.set('Tu perfil ha sido actualizado correctamente.');
        },
        error: (err: unknown) =>
          this.profileError.set(this.extractMessage(err, 'No pudimos actualizar tu perfil.')),
      });
  }

  protected submitPassword(): void {
    if (this.passwordForm.invalid || this.passwordSubmitting()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.passwordError.set(null);
    this.passwordMessage.set(null);
    this.passwordSubmitting.set(true);

    this.usersService
      .changePassword(this.passwordForm.getRawValue())
      .pipe(finalize(() => this.passwordSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.passwordMessage.set(
            'Tu contraseña ha sido actualizada. Úsala la próxima vez que inicies sesión.',
          );
          this.passwordForm.reset({ currentPassword: '', newPassword: '' });
        },
        error: (err: unknown) =>
          this.passwordError.set(this.extractMessage(err, 'No pudimos cambiar tu contraseña.')),
      });
  }

  /** Extrae un mensaje comprensible desde los errores tipados de la API. */
  private extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message) || fallback;
    }
    return fallback;
  }
}
