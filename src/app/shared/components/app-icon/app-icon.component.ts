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
  | 'trophy'
  | 'certificate'
  | 'flame'
  | 'bolt'
  | 'arrow-right'
  | 'shield';

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
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      @switch (name) {
        @case ('dashboard') { <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" /> }
        @case ('route') { <path d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13 6-3m-6 3V7m6 10 5.553 2.724A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m-6 3 6-3" /> }
        @case ('book') { <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /> }
        @case ('chat') { <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> }
        @case ('bell') { <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" /> }
        @case ('user') { <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0" /> }
        @case ('users') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /> }
        @case ('life-ring') { <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4.93 4.93l4.24 4.24M14.83 14.83l4.24 4.24M14.83 9.17l4.24-4.24M14.83 9.17l3.53-3.53M4.93 19.07l4.24-4.24" /> }
        @case ('logout') { <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /> }
        @case ('menu') { <path d="M4 6h16M4 12h16M4 18h16" /> }
        @case ('close') { <path d="M18 6 6 18M6 6l12 12" /> }
        @case ('home') { <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" /> }
        @case ('check') { <path d="M20 6 9 17l-5-5" /> }
        @case ('beaker') { <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12" /> }
        @case ('target') { <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4" /> }
        @case ('sparkles') { <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3zM5 3v4M19 17v4M3 5h4M17 19h4" /> }
        @case ('trophy') { <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z" /> }
        @case ('certificate') { <path d="M15 20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707zM9 13l2 2 4-4" /> }
        @case ('flame') { <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /> }
        @case ('bolt') { <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /> }
        @case ('arrow-right') { <path d="M5 12h14M13 5l7 7-7 7" /> }
        @case ('shield') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> }
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
