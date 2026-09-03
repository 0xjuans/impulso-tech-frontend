/**
 * Configuración de entorno para el perfil de desarrollo.
 *
 * Contiene únicamente valores públicos que pueden viajar en el bundle del
 * navegador. Cualquier secreto (API keys privadas, credenciales) deberá
 * permanecer exclusivamente en el backend.
 */
export const environment = {
  production: false,
  /** URL base de la API REST del backend de Impulso Tech. */
  apiBaseUrl: 'http://localhost:8080/api',
} as const;
