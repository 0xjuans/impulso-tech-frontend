import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
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
import {
  PreferencesService,
  UpdatePreferencesRequest,
  UserPreferences,
} from '../../../core/api/preferences/preferences.service';
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
export class AccountProfilePageComponent implements AfterViewInit {
  private readonly auth = inject(AuthService);
  private readonly users = inject(UsersService);
  private readonly preferences = inject(PreferencesService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tab = signal<'perfil' | 'seguridad' | 'notificaciones' | 'firma'>('perfil');

  /** Indica si el usuario actual puede administrar su firma. */
  protected readonly canManageSignature = computed<boolean>(() => {
    const role = this.currentUser()?.role;
    return role === 'INSTRUCTOR' || role === 'ADMINISTRADOR';
  });

  /** Ref al canvas donde el usuario dibuja la firma. */
  @ViewChild('signatureCanvas') private signatureCanvasRef?: ElementRef<HTMLCanvasElement>;

  protected readonly signatureSaving = signal(false);
  protected readonly signatureMessage = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);
  private signatureCtx: CanvasRenderingContext2D | null = null;
  private signatureDrawing = false;
  private signatureLastX = 0;
  private signatureLastY = 0;
  /** Marca si el usuario ya trazó algo desde el último clear. */
  protected readonly signatureDirty = signal(false);

  /** Preferencias cargadas del backend. */
  protected readonly prefs = signal<UserPreferences | null>(null);

  /** Estado de guardado por categoría de notificación (para deshabilitar el toggle). */
  protected readonly savingPref = signal<string | null>(null);

  /** Mensaje contextual para la pestaña de notificaciones. */
  protected readonly prefsMessage = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);

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

  protected setTab(next: 'perfil' | 'seguridad' | 'notificaciones' | 'firma'): void {
    this.tab.set(next);
    this.profileMessage.set(null);
    this.passwordMessage.set(null);
    this.signatureMessage.set(null);
    if (next === 'notificaciones' && !this.prefs()) {
      this.loadPreferences();
    }
    if (next === 'firma') {
      // Esperamos al render del canvas para inicializarlo.
      setTimeout(() => this.initSignatureCanvas(), 0);
    }
  }

  ngAfterViewInit(): void {
    // El canvas puede no estar renderizado aún si la pestaña inicial no
    // es "firma"; la inicialización se dispara al abrir la pestaña.
    if (this.tab() === 'firma') {
      this.initSignatureCanvas();
    }
  }

  /**
   * Prepara el canvas para captura de trazos con soporte de mouse y
   * touch. Usa la resolución del dispositivo para trazos nítidos.
   */
  private initSignatureCanvas(): void {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 480;
    const cssHeight = canvas.clientHeight || 160;
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#201515';
    this.signatureCtx = ctx;
    this.signatureDirty.set(false);
  }

  protected onSignaturePointerDown(event: PointerEvent): void {
    if (!this.signatureCtx || !this.signatureCanvasRef) return;
    event.preventDefault();
    this.signatureCanvasRef.nativeElement.setPointerCapture(event.pointerId);
    const [x, y] = this.pointerCoords(event);
    this.signatureLastX = x;
    this.signatureLastY = y;
    this.signatureDrawing = true;
  }

  protected onSignaturePointerMove(event: PointerEvent): void {
    if (!this.signatureDrawing || !this.signatureCtx) return;
    event.preventDefault();
    const [x, y] = this.pointerCoords(event);
    this.signatureCtx.beginPath();
    this.signatureCtx.moveTo(this.signatureLastX, this.signatureLastY);
    this.signatureCtx.lineTo(x, y);
    this.signatureCtx.stroke();
    this.signatureLastX = x;
    this.signatureLastY = y;
    if (!this.signatureDirty()) this.signatureDirty.set(true);
  }

  protected onSignaturePointerUp(event: PointerEvent): void {
    if (!this.signatureCanvasRef) return;
    this.signatureDrawing = false;
    try {
      this.signatureCanvasRef.nativeElement.releasePointerCapture(event.pointerId);
    } catch {
      // El navegador puede no soportar releasePointerCapture; se ignora.
    }
  }

  private pointerCoords(event: PointerEvent): [number, number] {
    const canvas = this.signatureCanvasRef!.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  }

  /** Vacía el canvas para volver a firmar desde cero. */
  protected clearSignature(): void {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas || !this.signatureCtx) return;
    this.signatureCtx.clearRect(0, 0, canvas.width, canvas.height);
    this.signatureDirty.set(false);
    this.signatureMessage.set(null);
  }

  /** Convierte el canvas a data URL PNG y lo envía al backend. */
  protected saveSignature(): void {
    const canvas = this.signatureCanvasRef?.nativeElement;
    if (!canvas) return;
    if (!this.signatureDirty()) {
      this.signatureMessage.set({
        tone: 'error',
        text: 'Dibuja tu firma antes de guardarla.',
      });
      return;
    }
    this.signatureSaving.set(true);
    this.signatureMessage.set(null);
    const dataUrl = canvas.toDataURL('image/png');
    this.users.updateSignature(dataUrl).subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.signatureSaving.set(false);
        this.signatureMessage.set({
          tone: 'ok',
          text: 'Firma guardada. Aparecerá en los certificados que emitas de ahora en adelante.',
        });
      },
      error: (err) => {
        this.signatureSaving.set(false);
        this.signatureMessage.set({
          tone: 'error',
          text: err?.error?.message ?? 'No pudimos guardar la firma. Inténtalo nuevamente.',
        });
      },
    });
  }

  /** Elimina la firma cargada. */
  protected removeSignature(): void {
    this.signatureSaving.set(true);
    this.signatureMessage.set(null);
    this.users.deleteSignature().subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.signatureSaving.set(false);
        this.clearSignature();
        this.signatureMessage.set({
          tone: 'ok',
          text: 'Firma eliminada.',
        });
      },
      error: () => {
        this.signatureSaving.set(false);
        this.signatureMessage.set({
          tone: 'error',
          text: 'No pudimos eliminar la firma. Inténtalo nuevamente.',
        });
      },
    });
  }

  private loadPreferences(): void {
    this.preferences
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.prefs.set(p),
        error: () =>
          this.prefsMessage.set({
            tone: 'error',
            text: 'No pudimos cargar tus preferencias. Inténtalo nuevamente.',
          }),
      });
  }

  /**
   * Alterna una preferencia booleana y persiste el cambio. Se actualiza
   * el estado local optimísticamente y se revierte si el backend
   * responde con error.
   */
  protected togglePreference(key: keyof UpdatePreferencesRequest, value: boolean): void {
    if (this.savingPref()) {
      return;
    }
    const current = this.prefs();
    if (!current) return;
    this.savingPref.set(key);
    this.prefsMessage.set(null);
    // Actualización optimista para dar feedback inmediato.
    this.prefs.set({ ...current, [key]: value } as UserPreferences);
    this.preferences
      .updateMine({ [key]: value } as UpdatePreferencesRequest)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.prefs.set(updated);
          this.savingPref.set(null);
        },
        error: () => {
          this.prefs.set(current);
          this.savingPref.set(null);
          this.prefsMessage.set({
            tone: 'error',
            text: 'No pudimos guardar el cambio. Revisa tu conexión y vuelve a intentarlo.',
          });
        },
      });
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
