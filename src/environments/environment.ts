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
  /**
   * Identificador de cliente OAuth 2.0 de Google. Debe coincidir con
   * el {@code GOOGLE_CLIENT_ID} configurado en el backend para que
   * éste pueda validar el ID token emitido a este mismo cliente.
   * Se sobrescribe en {@code environment.prod.ts} para producción.
   */
  googleClientId: '',
} as const;
