/** Default Spring Boot port (`server.port` in application.properties). */
const API_PORT = 8090;

/**
 * Spring Boot base URL including servlet context path `/MediCareAI`.
 * Change `API_PORT` if your backend uses another port.
 * For `ng serve` with `proxy.conf.json` only, you may use a relative URL `'/MediCareAI'`
 * instead to avoid browser CORS (proxy forwards to localhost:8090).
 */
export const environment = {
  production: false,
  apiPort: API_PORT,
  apiUrl: `http://localhost:${API_PORT}/MediCareAI`,
  // For local development only: a JWT string to attach when no session token exists.
  // Leave empty in version control or use a short-lived dev token.
  devAuthToken: '',
  /** Optional public app URL (e.g. collaboration / live meeting links). */
  appUrl: '',
  /** Optional client-side key for OpenAI-powered features; never commit real secrets. */
  openaiApiKey: ''
};
