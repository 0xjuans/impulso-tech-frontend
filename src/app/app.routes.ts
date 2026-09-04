import { Routes } from '@angular/router';

/**
 * Rutas principales de la aplicación.
 *
 * Cada módulo funcional del frontend se carga de forma diferida (lazy) para
 * mantener liviano el bundle inicial y mejorar el tiempo de carga percibido
 * por el estudiante.
 */
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./landing/pages/landing-page/landing-page.component').then(
        (m) => m.LandingPageComponent,
      ),
    title: 'Impulso Tech — Aprende programación con retos, IA y comunidad',
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'student',
    loadChildren: () => import('./student/student.routes').then((m) => m.studentRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
