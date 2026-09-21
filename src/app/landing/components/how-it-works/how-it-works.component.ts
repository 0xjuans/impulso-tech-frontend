import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppIconComponent, AppIconName } from '../../../shared/components/app-icon/app-icon.component';

/**
 * Sección "Cómo funciona" de la landing page.
 *
 * <p>Muestra el recorrido del estudiante en cinco pasos secuenciales,
 * desde la elección de la ruta hasta la obtención del certificado. Es
 * la sección a la que apunta el CTA principal del hero
 * ({@code #como-funciona}), por lo que debe explicar de un vistazo qué
 * hace la plataforma sin depender de otras secciones.</p>
 */
@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss',
})
export class HowItWorksComponent {

  /**
   * Pasos del recorrido de aprendizaje. Cada uno se renderiza como una
   * tarjeta numerada con icono; visualmente se conectan por una línea
   * horizontal para reforzar la idea de un camino ordenado.
   */
  protected readonly steps: readonly Step[] = [
    {
      icon: 'route',
      title: 'Elige tu ruta',
      copy: 'Selecciona un camino guiado (JavaScript, Python, Java…) construido por instructores. Cada ruta agrupa cursos que se complementan.',
    },
    {
      icon: 'book',
      title: 'Aprende a tu ritmo',
      copy: 'Lecciones cortas con teoría, ejemplos y ejercicios. Marcas tu avance y puedes retomar exactamente donde lo dejaste.',
    },
    {
      icon: 'beaker',
      title: 'Practica en laboratorios',
      copy: 'Escribe y ejecuta código real desde el navegador, sin instalar nada. La plataforma valida tu resultado y te da pistas cuando te atoras.',
    },
    {
      icon: 'target',
      title: 'Enfrenta retos y proyectos',
      copy: 'Consolida lo aprendido resolviendo problemas gamificados. Ganas XP, subes de nivel y avanzas en el ranking global.',
    },
    {
      icon: 'certificate',
      title: 'Obtén tu certificado',
      copy: 'Al completar un curso emite un certificado con código público verificable, listo para compartir en tu portafolio y LinkedIn.',
    },
  ];
}

interface Step {
  readonly icon: AppIconName;
  readonly title: string;
  readonly copy: string;
}
