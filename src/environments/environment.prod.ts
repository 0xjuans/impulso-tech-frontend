/**
 * Configuración de entorno para el perfil de producción.
 *
 * Solo debe contener información pública. La URL de la API se sustituye en
 * el pipeline de build según el entorno objetivo.
 */
export const environment = {
  production: true,
  /** URL base de la API REST del backend de Impulso Tech. */
  apiBaseUrl: 'https://jubilant-acceptance-production-b89a.up.railway.app/api',
} as const;
