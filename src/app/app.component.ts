import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Componente raíz de la aplicación.
 *
 * Actúa únicamente como contenedor del enrutador principal; toda la
 * composición visual se delega en las páginas correspondientes cargadas
 * a través de las rutas definidas en {@link appRoutes}.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class AppComponent {}
