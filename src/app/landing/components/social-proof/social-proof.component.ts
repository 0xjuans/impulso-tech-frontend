import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Testimonio de un estudiante o institución que usa la plataforma.
 */
interface Testimonial {
  readonly quote: string;
  readonly author: string;
  readonly role: string;
  readonly initials: string;
}

/**
 * Sección de prueba social de la landing page.
 *
 * Combina un bloque de estadísticas de impacto con testimonios reales
 * de estudiantes y un carrusel de logotipos de instituciones aliadas.
 * Refuerza la credibilidad de la plataforma mediante datos concretos
 * y voces del ecosistema educativo hispanohablante.
 */
@Component({
  selector: 'app-social-proof',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-proof.component.html',
  styleUrl: './social-proof.component.scss',
})
export class SocialProofComponent {
  /** Estadísticas de impacto mostradas en la banda superior. */
  protected readonly stats = [
    { value: '+2 500', label: 'Estudiantes activos' },
    { value: '92%', label: 'Tasa de retención' },
    { value: '4.8/5', label: 'Calificación media' },
    { value: '+15', label: 'Instituciones aliadas' },
  ] as const;

  /** Testimonios de estudiantes reales. */
  protected readonly testimonials: readonly Testimonial[] = [
    {
      quote:
        'Pasé de ver tutoriales sin rumbo a resolver retos reales en semanas. La mascota IA me salvó más de una vez cuando me atascaba.',
      author: 'María Fernanda López',
      role: 'Estudiante de JavaScript',
      initials: 'ML',
    },
    {
      quote:
        'Los laboratorios en contenedores son lo más cercano a un entorno profesional que he visto en una plataforma educativa.',
      author: 'Carlos Mendoza',
      role: 'Ingeniero en formación',
      initials: 'CM',
    },
    {
      quote:
        'Implementamos Impulso Tech en nuestra universidad. El seguimiento del progreso y la evaluación automática nos ahorraron horas.',
      author: 'Dra. Ana Patricia Ruiz',
      role: 'Directora de TI — UTEC',
      initials: 'AR',
    },
  ];
}
