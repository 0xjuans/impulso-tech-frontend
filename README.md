# Impulso Tech — Frontend

> **Proyecto educativo.** Impulso Tech es una plataforma desarrollada con
> fines **académicos y de aprendizaje**, como práctica de
> arquitectura de software, buenas prácticas de ingeniería y desarrollo
> full-stack moderno.

Aplicación web construida en Angular que consume el
[backend de Impulso Tech](https://github.com/0xjuans/impulso-tech-backend). Ofrece tres áreas
distintas —estudiante, instructor y administrador— compartiendo un
sistema de diseño consistente y componentes reutilizables.

## Contexto y propósito

Este repositorio existe como **material de estudio**. Cada componente,
servicio y decisión de UX está pensada para ilustrar principios que se
enseñan en cursos modernos de desarrollo frontend:

- Componentes *standalone* de Angular con *signals* y control-flow
  (`@if`, `@for`, `@switch`, `@let`).
- Consumo de una API REST con `HttpClient`, guards e interceptores.
- Autenticación federada con Google Identity Services.
- Separación de responsabilidades por dominio (`core`, `shared`,
  `student`, `instructor`, `admin`, `auth`, `landing`).
- Pruebas unitarias de servicios y componentes con Karma + Jasmine.
- Diseño accesible y responsivo con SCSS + variables CSS temáticas.


## Stack

- Angular 18 (standalone components, signals, new control flow).
- TypeScript 5.
- RxJS.
- SCSS con variables CSS y modo claro/oscuro implícito.
- Karma + Jasmine para pruebas unitarias.
- Angular CLI 18.

## Estructura por dominios

```
src/app
├── core                Servicios de API, guards, interceptores, auth
│   ├── api             Cliente HTTP por módulo del backend
│   └── auth            Login/logout, guard, storage del JWT
├── shared              Componentes y pipes reutilizables
│   ├── components      RichTextEditor, ContentContextPicker, AppIcon...
│   └── pipes           StripHtmlPipe y otros helpers
├── auth                Páginas de login, registro, recuperación
├── landing             Página pública inicial
├── student             Shell + páginas del estudiante
├── instructor          Shell + páginas del instructor
├── admin               Shell + páginas del administrador
├── verify              Verificación pública de certificados (RF-047)
├── app.routes.ts       Ruteo raíz con lazy-loading por área
└── app.config.ts       Bootstrap y providers globales
```

## Áreas de la aplicación

- **Estudiante** (`/student/**`): panel de aprendizaje, rutas, cursos,
  lecciones, retos, proyectos, laboratorios, evaluaciones, comunidad,
  notificaciones, mensajes, perfil y certificados.
- **Instructor** (`/instructor/**`): creación y gestión de rutas,
  cursos, retos, proyectos, laboratorios, evaluaciones y revisión de
  entregas. Editores con selectores en cascada (Ruta → Curso → Módulo →
  Lección) y editor de texto enriquecido.
- **Administrador** (`/admin/**`): panel de operación de la plataforma.
- **Público** (`/`, `/verify/:code`): landing y verificación pública de
  certificados sin autenticación.

## Requisitos

- Node.js 20 LTS.
- npm 10+.
- El backend de Impulso Tech corriendo (local o remoto).

## Configuración

La URL del backend y el `client-id` de Google se definen en
[`src/environments/environment.ts`](src/environments/environment.ts):

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api',
  googleClientId: '<google-client-id>',
} as const;
```

Para producción se sustituye por `environment.prod.ts` durante el build.

## Arranque en desarrollo

```bash
npm install
npx ng serve
```

Queda disponible en `http://localhost:4200/`. Cualquier cambio en el
código recarga automáticamente.

## Build

```bash
npx ng build
```

Los artefactos quedan en `dist/`.

## Tests

Toda la suite:

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Un archivo puntual:

```bash
npx ng test --watch=false --browsers=ChromeHeadless \
  --include='src/app/student/pages/certificates-page/**'
```

## Convenciones

- **Standalone components + signals**: no se usan NgModules.
- **`inject()` sobre inyección por constructor** en componentes y
  servicios.
- **Control-flow nuevo** (`@if`, `@for`, `@switch`, `@let`) en lugar
  de directivas estructurales.
- **`ChangeDetectionStrategy.OnPush`** por defecto.
- **`readonly` + `signal()`** para estado de componente.
- **Documentación en español** (JSDoc) — coherente con el backend.

## Verificación pública de certificados

Cualquier persona puede validar un certificado emitido por la
plataforma abriendo `/verify/<código-UUID>`. Esta ruta no requiere
autenticación y consume el endpoint público del backend
`GET /api/certificates/{code}`.

## Licencia y uso

Proyecto **educativo, sin fines de lucro**. Puedes clonarlo,
estudiarlo, ejecutarlo localmente y usarlo como referencia para tu
propio aprendizaje. 
