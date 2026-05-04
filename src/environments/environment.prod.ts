export const environment = {
  production: true,
  apiBaseUrl: 'https://api.medicare-ai.com',
  useLiveAppointmentApi: true,
  apiTimeout: 10000,
  // Legacy alias kept to avoid breaking existing services during migration.
  apiUrl: 'https://api.medicare-ai.com',
  geminiApiKey: '',
  geminiModel: 'gemini-2.0-flash'
};
