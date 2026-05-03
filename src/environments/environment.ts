export const environment = {
  production: false,
  // Use the dev proxy path so requests are sent to `ng serve` and proxied
  // to the backend; this avoids CORS issues during development.
  apiUrl: '/MediCareAI',
  // For local development only: a JWT string to attach when no session token exists.
  // Leave empty in version control or use a short-lived dev token.
  devAuthToken: ''
};
