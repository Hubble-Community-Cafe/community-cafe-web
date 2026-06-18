import type { Configuration } from '@azure/msal-browser'
import { LogLevel } from '@azure/msal-browser'

// The `Window.__RUNTIME_CONFIG__` global is declared (with an index signature
// covering any key) in @cafe/shared-web, so we read its keys directly here.
// Runtime values are injected at container startup (see public/config.js); the
// e2e-only E2E_AUTH_* keys are read in e2eAuth.ts.

/** Prefer a substituted runtime value, else fall back to a build-time Vite env var. */
const getConfig = (runtimeKey: string, envKey: string): string => {
  const runtimeValue = window.__RUNTIME_CONFIG__?.[runtimeKey]
  if (runtimeValue && !runtimeValue.startsWith('__')) {
    return runtimeValue
  }
  return import.meta.env[envKey] || ''
}

const AZURE_CLIENT_ID = getConfig('AZURE_CLIENT_ID', 'VITE_AZURE_CLIENT_ID')
const AZURE_TENANT_ID = getConfig('AZURE_TENANT_ID', 'VITE_AZURE_TENANT_ID')
const REDIRECT_URI = getConfig('REDIRECT_URI', 'VITE_REDIRECT_URI') || window.location.origin

/** Only members of this Entra security group may access the admin. Empty = any signed-in user. */
export const ALLOWED_GROUP_ID = getConfig('ALLOWED_GROUP_ID', 'VITE_ALLOWED_GROUP_ID')

export const msalConfig: Configuration = {
  auth: {
    clientId: AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${AZURE_TENANT_ID || 'common'}`,
    redirectUri: REDIRECT_URI,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return
        if (level === LogLevel.Error) console.error(message)
        else if (level === LogLevel.Warning) console.warn(message)
      },
    },
  },
}

export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', 'email', `api://${AZURE_CLIENT_ID}/access_as_user`],
}

export const graphConfig = {
  graphMemberOfEndpoint: 'https://graph.microsoft.com/v1.0/me/memberOf',
}
