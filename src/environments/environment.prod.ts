/**
 * Configuración de entorno para el perfil de producción.
 *
 * Solo debe contener información pública. La URL de la API se sustituye en
 * el pipeline de build según el entorno objetivo.
 */
export const environment = {
  production: true,
  /** URL base de la API REST del backend de Impulso Tech. */
  apiBaseUrl: 'https://impulso-tech-backend.fly.dev/api',
  /**
   * Identificador de cliente OAuth 2.0 de Google para producción.
   * Debe coincidir con el {@code GOOGLE_CLIENT_ID} configurado en
   * Fly.io para que el backend pueda validar el ID token.
   */
  googleClientId: '',
} as const;
