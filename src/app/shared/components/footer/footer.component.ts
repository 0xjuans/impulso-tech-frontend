import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Pie de página global del sitio público.
 *
 * Agrupa los enlaces institucionales, de producto y legales. El contenido
 * es estático y se comparte entre todas las páginas públicas.
 */
@Component({
  selector: 'app-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  /** Año actual mostrado en el aviso de copyright. */
  protected readonly currentYear = new Date().getFullYear();
}
