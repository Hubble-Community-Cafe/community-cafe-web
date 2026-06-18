// Runtime configuration - replaced at container startup with real env values.
// In local dev these placeholders are ignored in favour of VITE_* env vars.
window.__RUNTIME_CONFIG__ = {
  API_URL: '__API_URL__',
  AZURE_CLIENT_ID: '__AZURE_CLIENT_ID__',
  AZURE_TENANT_ID: '__AZURE_TENANT_ID__',
  REDIRECT_URI: '__REDIRECT_URI__',
  ALLOWED_GROUP_ID: '__ALLOWED_GROUP_ID__',
  SENTRY_DSN: '__SENTRY_DSN__',
};
