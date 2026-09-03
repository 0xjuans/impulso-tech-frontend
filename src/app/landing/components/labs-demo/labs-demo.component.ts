import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Descriptor de un lenguaje disponible en los laboratorios.
 */
interface LabLanguage {
  readonly name: string;
  readonly icon: string;
}

/**
 * Representa una línea de código mostrada en la terminal de demostración.
 */
interface CodeLine {
  readonly text: string;
  readonly type: 'comment' | 'keyword' | 'function' | 'string' | 'output' | 'success' | 'error';
}

/**
 * Sección de demostración de laboratorios de la landing page.
 *
 * Muestra cómo el estudiante escribe código en un editor y lo ejecuta en
 * contenedores Docker a través del backend. Incluye una terminal interactiva
 * que simula el flujo real: escritura, ejecución y resultado con métricas.
 */
@Component({
  selector: 'app-labs-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './labs-demo.component.html',
  styleUrl: './labs-demo.component.scss',
})
export class LabsDemoComponent {
  /** Lenguajes soportados por la plataforma. */
  protected readonly languages: readonly LabLanguage[] = [
    { name: 'JavaScript', icon: 'JS' },
    { name: 'Python', icon: 'PY' },
    { name: 'TypeScript', icon: 'TS' },
    { name: 'Java', icon: 'JV' },
  ];

  /** Código de ejemplo que se muestra en la terminal. */
  protected readonly codeLines: readonly CodeLine[] = [
    { text: '# fibonacci.py — laboratorio en vivo', type: 'comment' },
    { text: 'def fibonacci(n):', type: 'keyword' },
    { text: '    if n <= 1:', type: 'keyword' },
    { text: '        return n', type: 'keyword' },
    { text: '    return fibonacci(n-1) + fibonacci(n-2)', type: 'function' },
    { text: '', type: 'output' },
    { text: 'print(fibonacci(10))', type: 'function' },
    { text: '', type: 'output' },
    { text: '▶ Ejecutando en contenedor...', type: 'output' },
    { text: '✓ Pruebas aprobadas (8/8)', type: 'success' },
    { text: '⚡ Tiempo: 0.04s · Memoria: 12 MB', type: 'success' },
  ];

  /** Métricas clave de los laboratorios. */
  protected readonly metrics = [
    { value: '< 200ms', label: 'Resultado rápido' },
    { value: '8+', label: 'Lenguajes disponibles' },
    { value: 'Seguro', label: 'Ejecución en la nube' },
    { value: '100%', label: 'Corrección automática' },
  ] as const;
}
