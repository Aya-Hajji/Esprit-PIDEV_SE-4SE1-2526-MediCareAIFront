// Must match backend: server.port + server.servlet.context-path (e.g. Medicare_Ai application.properties).
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8089/MediCareAI',
  /** When true, appointments/reminders/analytics use the Spring API instead of localStorage fallbacks. */
  useLiveAppointmentApi: true,
  apiTimeout: 10000,
  apiUrl: 'http://localhost:8089/MediCareAI',
  /** Google AI Studio / Gemini — rotate/remove before pushing to a shared repo. Prefer a backend proxy in production. */
  geminiApiKey: 'AIzaSyCivY9NB8twGJHCs83GhAiTPU4P33FR0Gg',
  /** e.g. gemini-2.0-flash, gemini-1.5-flash */
  geminiModel: 'gemini-2.0-flash'
};
