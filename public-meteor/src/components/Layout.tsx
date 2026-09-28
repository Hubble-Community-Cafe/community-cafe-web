import { Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { SkipLink } from './SkipLink'
import { PageErrorBoundary } from './PageErrorBoundary'
import { MAIN_CONTENT_ID, useFocusMainOnNavigate } from '../lib/mainContent'
import { getBarStatus, reportApiFailure, type BarStatus } from '@cafe/shared-web'
import { Header } from './Header'
import { Footer } from './Footer'
import { StatusBanner } from './StatusBanner'

export function Layout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BarStatus | null>(null)
  useFocusMainOnNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    // Without a status the banner is simply not shown; the failure is still reported.
    getBarStatus('METEOR').then(setStatus).catch((err: unknown) => void reportApiFailure('bar-status', err))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      {status && <StatusBanner status={status} />}
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none">
        {/* Pages load on demand: keep the header and footer while one downloads. */}
        <PageErrorBoundary key={pathname}>
          <Suspense fallback={null}>{children}</Suspense>
        </PageErrorBoundary>
      </main>
      <Footer />
    </div>
  )
}
