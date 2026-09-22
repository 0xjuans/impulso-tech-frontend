import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../core/auth/services/auth.service';
import { Role } from '../../../core/auth/models/user.model';
import {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UsersService,
} from '../../../core/api/users/users.service';
import { AppIconComponent } from '../../components/app-icon/app-icon.component';

/**
 * Página de perfil compartida entre instructores y administradores
 * (RF-005 y RF-006).
 *
 * <p>Ofrece dos pestañas: la primera para actualizar la información
 * pública del perfil, la segunda para cambiar la contraseña. Reutiliza
 * el {@link UsersService} común y evita duplicar la lógica de
 * validación entre roles. Los estudiantes cuentan con una página propia
 * más rica (racha, insignias y XP), por lo que este componente se
 * mantiene enfocado en los datos esenciales.</p>
 */
@Component({
  selector: 'app-account-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-profile-page.component.html',
  styleUrl: './account-profile-page.component.scss',
})
export class AccountProfilePageComponent {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tab = signal<'perfil' | 'seguridad'>('perfil');

  /** Estado de envío del formulario de perfil. */
  protected readonly savingProfile = signal(false);
  /** Mensaje de éxito / error para el formulario de perfil. */
  protected readonly profileMessage = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);

  /** Estado de envío del formulario de contraseña. */
  protected readonly savingPassword = signal(false);
  /** Mensaje de éxito / error para el formulario de contraseña. */
  protected readonly passwordMessage = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);

  protected readonly currentUser = this.auth.currentUser;

  protected readonly roleLabel = computed<string>(() =>
    AccountProfilePageComponent.labelFor(this.currentUser()?.role),
  );

  protected readonly initials = computed<string>(() => {
    const u = this.currentUser();
    if (!u) return '?';
    const a = (u.firstName ?? '').trim();
    const b = (u.lastName ?? '').trim();
    return ((a.charAt(0) + b.charAt(0)) || u.email.charAt(0)).toUpperCase();
  });

  /** Formulario reactivo de datos de perfil. */
  protected readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
  });

  /** Formulario reactivo de cambio de contraseña. */
  protected readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.minLength(8)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    const u = this.currentUser();
    if (u) {
      this.profileForm.reset({
        firstName: u.firstName,
        lastName: u.lastName,
        username: u.username,
      });
    }
  }

  protected setTab(next: 'perfil' | 'seguridad'): void {
    this.tab.set(next);
    this.profileMessage.set(null);
    this.passwordMessage.set(null);
  }

  protected submitProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      return;
    }
    const value = this.profileForm.getRawValue();
    const request: UpdateProfileRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      username: value.username.trim(),
    };
    this.savingProfile.set(true);
    this.profileMessage.set(null);
    this.users
      .updateProfile(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.auth.updateCurrentUser(user);
          this.savingProfile.set(false);
          this.profileMessage.set({ tone: 'ok', text: 'Perfil actualizado correctamente.' });
        },
        error: (err) => {
          this.savingProfile.set(false);
          this.profileMessage.set({
            tone: 'error',
            text: err?.error?.message ?? 'No pudimos actualizar el perfil. Inténtalo nuevamente.',
          });
        },
      });
  }

  protected submitPassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const value = this.passwordForm.getRawValue();
    if (value.newPassword !== value.confirmPassword) {
      this.passwordMessage.set({
        tone: 'error',
        text: 'La confirmación no coincide con la nueva contraseña.',
      });
      return;
    }
    const request: ChangePasswordRequest = {
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    };
    this.savingPassword.set(true);
    this.passwordMessage.set(null);
    this.users
      .changePassword(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.passwordMessage.set({
            tone: 'ok',
            text: 'Contraseña actualizada. En el próximo inicio de sesión usa la nueva.',
          });
          this.passwordForm.reset();
        },
        error: (err) => {
          this.savingPassword.set(false);
          this.passwordMessage.set({
            tone: 'error',
            text:
              err?.error?.message ??
              'No pudimos cambiar la contraseña. Verifica que la actual sea correcta.',
          });
        },
      });
  }

  private static labelFor(role: Role | undefined | null): string {
    switch (role) {
      case 'ADMINISTRADOR':
        return 'Administrador';
      case 'INSTRUCTOR':
        return 'Instructor';
      case 'ESTUDIANTE':
        return 'Estudiante';
      default:
        return '—';
    }
  }
}
