import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

import { environment } from '../../../../environments/environment';

/** Payload emitido tras la respuesta de Google Identity Services. */
export interface GoogleCredential {
  readonly idToken: string;
}

/** Firma mínima del SDK global {@code google.accounts.id}. */
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    context?: 'signin' | 'signup' | 'use';
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id: GoogleAccountsId } };
  }
}

/**
 * Botón oficial "Iniciar sesión con Google" implementado sobre
 * {@code Google Identity Services}.
 *
 * <p>Carga el script de Google la primera vez que se instancia el
 * componente en la sesión y utiliza {@code renderButton} para dibujar
 * el botón oficial dentro de un contenedor propio. El {@code idToken}
 * devuelto por Google se emite mediante {@link GoogleSignInButtonComponent.credential}
 * para que el componente contenedor lo intercambie con el backend por
 * un JWT propio de Impulso Tech.</p>
 */
@Component({
  selector: 'app-google-sign-in-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './google-sign-in-button.component.html',
  styleUrl: './google-sign-in-button.component.scss',
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  /** Texto mostrado en el botón (signin_with, signup_with, continue_with). */
  @Input() text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with';

  /** Tema visual del botón. */
  @Input() theme: 'outline' | 'filled_blue' | 'filled_black' = 'outline';

  /** Emite el ID token generado por Google al completar el flujo. */
  @Output() readonly credential = new EventEmitter<GoogleCredential>();

  /** Se emite cuando el SDK reporta un error antes de emitir credential. */
  @Output() readonly errored = new EventEmitter<string>();

  @ViewChild('container', { static: true })
  private readonly container!: ElementRef<HTMLDivElement>;

  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  /** Cliente configurado o no. Sirve para mostrar un fallback claro. */
  protected readonly configured = signal(true);

  /** URL del SDK oficial de Google Identity Services. */
  private static readonly SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

  /**
   * Evita que `initialize` y `renderButton` se ejecuten más de una vez
   * por instancia del componente. Sin esta guarda, Angular en modo dev
   * puede disparar `ngAfterViewInit` dos veces y ambas iniciarian GSI
   * en paralelo, produciendo el warning
   * "google.accounts.id.initialize() is called multiple times" y, en
   * ocasiones, un botón que nunca termina de pintarse.
   */
  private rendered = false;

  ngAfterViewInit(): void {
    if (this.rendered) {
      return;
    }
    if (!environment.googleClientId) {
      this.configured.set(false);
      return;
    }
    this.rendered = true;
    this.loadScript()
      .then(() => this.render())
      .catch(() => this.errored.emit('No pudimos cargar Google Sign-In.'));
  }

  private render(): void {
    const gid = window.google?.accounts?.id;
    if (!gid) {
      this.errored.emit('Google Sign-In no está disponible.');
      return;
    }
    // Se ejecuta fuera de la zona de Angular para no gatillar detecciones
    // por cada micro-evento del iframe de Google; el emit posterior
    // vuelve a entrar en la zona para que la UI reactiva se actualice.
    this.zone.runOutsideAngular(() => {
      gid.initialize({
        client_id: environment.googleClientId,
        callback: (response) => {
          this.zone.run(() => this.credential.emit({ idToken: response.credential }));
        },
        ux_mode: 'popup',
        auto_select: false,
      });
      gid.renderButton(this.container.nativeElement, {
        type: 'standard',
        theme: this.theme,
        size: 'large',
        text: this.text,
        shape: 'pill',
        logo_alignment: 'left',
        locale: 'es',
        width: 320,
      });
    });
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GoogleSignInButtonComponent.SCRIPT_SRC}"]`,
    );
    if (existing) {
      return new Promise((resolve, reject) => {
        fromEvent(existing, 'load')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => resolve());
        fromEvent(existing, 'error')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => reject(new Error('google-script-error')));
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GoogleSignInButtonComponent.SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('google-script-error'));
      document.head.appendChild(script);
    });
  }
}
