import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/services/auth.service';
import { UsersService } from '../../../core/api/users/users.service';
import { GamificationService } from '../../../core/api/gamification/gamification.service';
import {
  RankingEntry,
  UserBadge,
  UserStreak,
  UserXp,
} from '../../../core/api/gamification/gamification.dto';
import { CertificatesService } from '../../../core/api/certificates/certificates.service';
import { CertificateResponse } from '../../../core/api/certificates/certificate.dto';
import {
  PreferencesService,
  UpdatePreferencesRequest,
  UserPreferences,
} from '../../../core/api/preferences/preferences.service';
import { AppIconComponent } from '../../../shared/components/app-icon/app-icon.component';

type ProfileTab = 'overview' | 'badges' | 'certificates' | 'edit' | 'security' | 'notifications';

/**
 * Página de perfil del estudiante (RF-005 / RF-019 / RF-047).
 *
 * <p>Presenta un panel completo con la información pública del usuario,
 * su progreso gamificado (XP, nivel, racha, insignias, ranking) y sus
 * certificados. Además permite editar los datos del perfil y cambiar la
 * contraseña. La página se organiza en pestañas para que la carga
 * inicial muestre un resumen y las acciones de edición queden un clic
 * más profundo, sin invadir la vista principal.</p>
 */
@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly gamification = inject(GamificationService);
  private readonly certificatesService = inject(CertificatesService);
  private readonly preferencesService = inject(PreferencesService);

  /** Usuario autenticado. */
  protected readonly user = this.auth.currentUser;

  // --------------------------- Datos de gamificación --------------
  protected readonly xp = signal<UserXp | null>(null);
  protected readonly streak = signal<UserStreak | null>(null);
  protected readonly badges = signal<readonly UserBadge[]>([]);
  protected readonly certificates = signal<readonly CertificateResponse[]>([]);
  protected readonly rankPosition = signal<RankingEntry | null>(null);
  protected readonly summaryLoading = signal(true);

  // --------------------------- Estado de pestañas -----------------
  protected readonly activeTab = signal<ProfileTab>('overview');

  // --------------------------- Formularios ------------------------
  protected readonly profileSubmitting = signal(false);
  protected readonly profileMessage = signal<string | null>(null);
  protected readonly profileError = signal<string | null>(null);

  protected readonly passwordSubmitting = signal(false);
  protected readonly passwordMessage = signal<string | null>(null);
  protected readonly passwordError = signal<string | null>(null);

  // --------------------------- Preferencias de notificación -------
  protected readonly prefs = signal<UserPreferences | null>(null);
  protected readonly savingPref = signal<string | null>(null);
  protected readonly prefsMessage = signal<{ tone: 'ok' | 'error'; text: string } | null>(null);

  /** Iniciales que se usan si no hay foto de perfil. */
  protected readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const first = u.firstName?.[0] ?? '';
    const last = u.lastName?.[0] ?? '';
    return `${first}${last}`.toUpperCase() || u.username[0]?.toUpperCase() || '?';
  });

  /** Nombre completo para el hero. */
  protected readonly fullName = computed(() => {
    const u = this.user();
    return u ? `${u.firstName} ${u.lastName}`.trim() : '';
  });

  /** Porcentaje de progreso hacia el siguiente nivel. */
  protected readonly levelProgress = computed(() => {
    const xp = this.xp();
    if (!xp) return 0;
    const span = xp.xpForNextLevel - xp.xpForCurrentLevel;
    if (span <= 0) return 0;
    const pct = Math.round((xp.xpIntoCurrentLevel / span) * 100);
    return Math.max(0, Math.min(100, pct));
  });

  /** Formulario reactivo del perfil. */
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
    // Perfil fresco desde el backend.
    this.usersService.getProfile().subscribe({
      next: (user) => {
        this.auth.updateCurrentUser(user);
        this.hydrateForm(user);
      },
      error: () => {
        const cached = this.user();
        if (cached) this.hydrateForm(cached);
      },
    });

    // Carga en paralelo del resumen gamificado.
    forkJoin({
      xp: this.gamification.getMyXp().pipe(catchError(() => of(null as UserXp | null))),
      streak: this.gamification.getMyStreak().pipe(catchError(() => of(null as UserStreak | null))),
      badges: this.gamification.listMyBadges().pipe(catchError(() => of([] as readonly UserBadge[]))),
      ranking: this.gamification
        .getRanking('ALL_TIME', 20)
        .pipe(
          catchError(() =>
            of(null as { entries: readonly RankingEntry[]; me: RankingEntry | null } | null),
          ),
        ),
      certificates: this.certificatesService
        .listMine()
        .pipe(catchError(() => of([] as readonly CertificateResponse[]))),
    })
      .pipe(finalize(() => this.summaryLoading.set(false)))
      .subscribe(({ xp, streak, badges, ranking, certificates }) => {
        this.xp.set(xp);
        this.streak.set(streak);
        this.badges.set(badges);
        this.certificates.set(certificates);
        this.rankPosition.set(ranking?.me ?? null);
      });
  }

  /** Cambia la pestaña activa desde la plantilla. */
  protected setTab(tab: ProfileTab): void {
    this.activeTab.set(tab);
    this.prefsMessage.set(null);
    if (tab === 'notifications' && !this.prefs()) {
      this.loadPreferences();
    }
  }

  /** Carga las preferencias del usuario al abrir la pestaña. */
  private loadPreferences(): void {
    this.preferencesService.getMine().subscribe({
      next: (p) => this.prefs.set(p),
      error: () =>
        this.prefsMessage.set({
          tone: 'error',
          text: 'No pudimos cargar tus preferencias. Inténtalo nuevamente.',
        }),
    });
  }

  /**
   * Alterna una preferencia booleana con guardado optimista: se refleja
   * de inmediato en la UI y se revierte si el backend rechaza el cambio.
   */
  protected togglePreference(key: keyof UpdatePreferencesRequest, value: boolean): void {
    if (this.savingPref()) return;
    const current = this.prefs();
    if (!current) return;
    this.savingPref.set(key);
    this.prefsMessage.set(null);
    this.prefs.set({ ...current, [key]: value } as UserPreferences);
    this.preferencesService.updateMine({ [key]: value } as UpdatePreferencesRequest).subscribe({
      next: (updated) => {
        this.prefs.set(updated);
        this.savingPref.set(null);
      },
      error: () => {
        this.prefs.set(current);
        this.savingPref.set(null);
        this.prefsMessage.set({
          tone: 'error',
          text: 'No pudimos guardar el cambio. Revisa tu conexión e inténtalo de nuevo.',
        });
      },
    });
  }

  /** Etiqueta legible del rol para mostrarlo en el hero. */
  protected roleLabel(role: string | undefined): string {
    switch (role) {
      case 'ESTUDIANTE':     return 'Estudiante';
      case 'INSTRUCTOR':     return 'Instructor';
      case 'ADMINISTRADOR':  return 'Administrador';
      default:               return role ?? '';
    }
  }

  /** URL de descarga del PDF del certificado (público). */
  protected downloadCertificateUrl(code: string): string {
    return this.certificatesService.downloadUrl(code);
  }

  private hydrateForm(user: {
    firstName: string;
    lastName: string;
    username: string;
    profilePhotoUrl: string | null;
  }): void {
    this.profileForm.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      profilePhotoUrl: user.profilePhotoUrl ?? '',
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

  /** Extrae un mensaje legible desde los errores tipados de la API. */
  private extractMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: string }).message) || fallback;
    }
    return fallback;
  }
}
