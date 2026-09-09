import {
  ChangeDetectionStrategy,
  Component,
  Input,
  computed,
  signal,
} from '@angular/core';

/**
 * Nombres de icono disponibles en la biblioteca interna de la
 * plataforma. Cada nombre corresponde a un {@code path} SVG en la
 * tabla {@link AppIconComponent.PATHS}.
 */
export type AppIconName =
  | 'dashboard'
  | 'route'
  | 'book'
  | 'chat'
  | 'bell'
  | 'user'
  | 'users'
  | 'life-ring'
  | 'logout'
  | 'menu'
  | 'close'
  | 'home'
  | 'check'
  | 'beaker'
  | 'target'
  | 'sparkles'
  | 'trophy';

/**
 * Componente que renderiza un icono SVG monocromático usando el
 * {@code currentColor} del contexto para adaptarse a temas y estados.
 *
 * <p>Se prefiere sobre emojis por consistencia visual entre sistemas
 * operativos y navegadores, así como por accesibilidad y control total
 * del color y tamaño desde CSS.</p>
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.viewBox]="'0 0 24 24'"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.aria-hidden]="ariaLabel ? null : true"
      [attr.role]="ariaLabel ? 'img' : null"
      [attr.aria-label]="ariaLabel"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round">
      @switch (name) {
        @case ('dashboard') { <path d="M3 12h6V3H3zm12 9h6V10h-6zm-12 0h6v-6H3zm12-12h6V3h-6z" /> }
        @case ('route') { <path d="M6 3v10a4 4 0 0 0 4 4h5a3 3 0 0 1 3 3M6 3l-3 3M6 3l3 3M18 21l3-3-3-3" /> }
        @case ('book') { <path d="M4 5a2 2 0 0 1 2-2h11v16H6a2 2 0 0 0-2 2zm0 0v14M9 7h5M9 11h5" /> }
        @case ('chat') { <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4V5z" /> }
        @case ('bell') { <path d="M6 8a6 6 0 1 1 12 0c0 6 3 7 3 7H3s3-1 3-7M10 21a2 2 0 0 0 4 0" /> }
        @case ('user') { <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0" /> }
        @case ('users') { <path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 8a7 7 0 0 1 14 0m1-8a4 4 0 0 0 0-8m4 15a5 5 0 0 0-3-4.6" /> }
        @case ('life-ring') { <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm-6.4-.4 3.5 3.5m5.8 5.8 3.5 3.5m-12.8 0 3.5-3.5m5.8-5.8 3.5-3.5" /> }
        @case ('logout') { <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l-5-5 5-5M5 12h12" /> }
        @case ('menu') { <path d="M4 6h16M4 12h16M4 18h16" /> }
        @case ('close') { <path d="M6 6l12 12M18 6 6 18" /> }
        @case ('home') { <path d="M3 12l9-9 9 9M5 10v10h14V10" /> }
        @case ('check') { <path d="M5 12l5 5L20 7" /> }
        @case ('beaker') { <path d="M9 3h6M10 3v6l-5 10a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-10V3M7 15h10" /> }
        @case ('target') { <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" /> }
        @case ('sparkles') { <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.5 5.5l2 2m9 9 2 2m0-13-2 2m-9 9-2 2" /> }
        @case ('trophy') { <path d="M8 21h8M12 17v4M6 3h12v6a6 6 0 0 1-12 0V3zM6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" /> }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 0;
      }
    `,
  ],
})
export class AppIconComponent {
  /** Nombre del icono a renderizar. */
  @Input({ required: true }) name!: AppIconName;

  /** Tamaño en pixeles del icono. */
  @Input() set sizePx(value: number | string | undefined) {
    if (value == null) return;
    const parsed = typeof value === 'string' ? Number(value) : value;
    if (!Number.isNaN(parsed) && parsed > 0) {
      this.sizeSignal.set(parsed);
    }
  }

  /** Etiqueta accesible; cuando es {@code null} el icono queda oculto para lectores. */
  @Input() ariaLabel: string | null = null;

  protected readonly sizeSignal = signal(20);
  protected readonly size = computed(() => this.sizeSignal());
}
