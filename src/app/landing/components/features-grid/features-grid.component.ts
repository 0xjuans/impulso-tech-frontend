import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AppIconComponent, AppIconName } from '../../../shared/components/app-icon/app-icon.component';

/**
 * Descriptor de un pilar de la plataforma mostrado en la cuadrícula.
 */
interface Feature {
  readonly icon: AppIconName;
  readonly title: string;
  readonly description: string;
  readonly accent: 'warm' | 'ink' | 'primary' | 'cool';
}

/**
 * Cuadrícula de pilares de Impulso Tech.
 *
 * Presenta las capacidades principales de la plataforma en tarjetas
 * intercaladas de color crema y tinta profunda, siguiendo el ritmo
 * visual de la guía de diseño.
 */
@Component({
  selector: 'app-features-grid',
  standalone: true,
  imports: [AppIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './features-grid.component.html',
  styleUrl: './features-grid.component.scss',
})
export class FeaturesGridComponent {
  /** Lista estática de pilares mostrados en la cuadrícula. */
  protected readonly features: readonly Feature[] = [
    {
      icon: 'route',
      title: 'Rutas de aprendizaje guiadas',
      description:
        'Recorres un mapa claro paso a paso: ruta, curso, módulo y lección. Sin preguntarte "qué sigue", todo fluye solo.',
      accent: 'warm',
    },
    {
      icon: 'beaker',
      title: 'Laboratorios listos en la nube',
      description:
        'Escribe código real y ejecútalo sin instalar nada. Tu equipo no se calienta, tú solo te enfocas en aprender.',
      accent: 'ink',
    },
    {
      icon: 'target',
      title: 'Retos con corrección instantánea',
      description:
        'Cada intento se revisa al momento y recibes retroalimentación específica para mejorar tu solución.',
      accent: 'primary',
    },
    {
      icon: 'sparkles',
      title: 'Mascota con IA que te acompaña',
      description:
        'Explica errores, propone pistas y celebra tus logros. Nunca resuelve por ti: te empuja a razonar el problema.',
      accent: 'cool',
    },
    {
      icon: 'trophy',
      title: 'Motivación con logros reales',
      description:
        'Gana XP, sube de nivel, construye rachas y desbloquea insignias por cada meta que alcanzas.',
      accent: 'warm',
    },
    {
      icon: 'users',
      title: 'Comunidad que te acompaña',
      description:
        'Publicaciones, respuestas y foros moderados. Aprender programación acompañado siempre pesa más que hacerlo solo.',
      accent: 'ink',
    },
  ];
}
