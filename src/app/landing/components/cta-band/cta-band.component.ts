import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Banda de llamada a la acción final de la landing page.
 *
 * Refuerza la propuesta de valor y ofrece dos rutas claras al visitante:
 * comenzar a estudiar de inmediato o solicitar información institucional
 * para el segmento B2B (instituciones educativas y empresas).
 */
@Component({
  selector: 'app-cta-band',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta-band.component.html',
  styleUrl: './cta-band.component.scss',
})
export class CtaBandComponent {}
