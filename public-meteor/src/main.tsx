import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

declare const __APP_VERSION__: string

const sentryDsn =
  window.__RUNTIME_CONFIG__?.SENTRY_DSN ?? import.meta.env.VITE_PUBLIC_METEOR_SENTRY_DSN
if (sentryDsn && !sentryDsn.startsWith('__')) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: `community-cafe-public-meteor@${__APP_VERSION__}`,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
