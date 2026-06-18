import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication, EventType, type AccountInfo } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { msalConfig } from './lib/authConfig'
import { setMsalInstance } from './lib/api'
import App from './App'
import './index.css'

declare const __APP_VERSION__: string

const sentryDsn = window.__RUNTIME_CONFIG__?.SENTRY_DSN ?? import.meta.env.VITE_SENTRY_DSN
if (sentryDsn && !sentryDsn.startsWith('__')) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: `community-cafe-admin@${__APP_VERSION__}`,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  })
}

const msalInstance = new PublicClientApplication(msalConfig)
setMsalInstance(msalInstance)

msalInstance
  .initialize()
  .then(async () => {
    try {
      const response = await msalInstance.handleRedirectPromise()
      const account = response?.account ?? msalInstance.getAllAccounts()[0] ?? null
      if (account) {
        msalInstance.setActiveAccount(account)
        Sentry.setUser({ email: account.username })
        window.dispatchEvent(new Event('msal:accountChanged'))
      }
    } catch (error) {
      console.error('Error handling redirect:', error)
      Sentry.captureException(error)
    }

    msalInstance.addEventCallback((event) => {
      if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const account = (event.payload as { account: AccountInfo | null }).account
        msalInstance.setActiveAccount(account)
        if (account) Sentry.setUser({ email: account.username })
        window.dispatchEvent(new Event('msal:accountChanged'))
      }
      if (event.eventType === EventType.LOGOUT_SUCCESS) {
        msalInstance.setActiveAccount(null)
        Sentry.setUser(null)
      }
    })

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <MsalProvider instance={msalInstance}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </MsalProvider>
      </StrictMode>,
    )
  })
  .catch((error) => {
    console.error('MSAL initialization error:', error)
    Sentry.captureException(error)
  })
