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
    path: 'instructor',
    loadChildren: () =>
      import('./instructor/instructor.routes').then((m) => m.instructorRoutes),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.adminRoutes),
  },
  {
    // Página pública de verificación de certificados (RF-047). No requiere
    // autenticación; el backend expone /api/certificates/{code} sin JWT.
    path: 'verify/:code',
    loadComponent: () =>
      import('./verify/verify-certificate-page/verify-certificate-page.component').then(
        (m) => m.VerifyCertificatePageComponent,
      ),
    title: 'Verificar certificado · Impulso Tech',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
