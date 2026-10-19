import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import { initSentry, installChunkReload } from '@cafe/shared-web'
import './index.css'
import App from './App.tsx'

declare const __APP_VERSION__: string

// Pages load on demand; recover a tab left open across a deploy (see installChunkReload).
installChunkReload()

// Release name, extension-noise filters and the DSN placeholder check live in shared-web.
initSentry(Sentry, {
  project: 'community-cafe-public-hubble',
  version: __APP_VERSION__,
  dsn: window.__RUNTIME_CONFIG__?.SENTRY_DSN ?? import.meta.env.VITE_PUBLIC_HUBBLE_SENTRY_DSN,
  environment: import.meta.env.MODE,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
