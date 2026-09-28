import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SkipLink } from './SkipLink'
import { MAIN_CONTENT_ID, useFocusMainOnNavigate } from '../lib/mainContent'
import { getBarStatus, reportApiFailure, type BarStatus } from '@cafe/shared-web'
import { Header } from './Header'
import { Footer } from './Footer'
import { StatusBanner } from './StatusBanner'

export function Layout() {
  const [status, setStatus] = useState<BarStatus | null>(null)
  useFocusMainOnNavigate()

  useEffect(() => {
    // Without a status the banner is simply not shown; the failure is still reported.
    getBarStatus('HUBBLE').then(setStatus).catch((err: unknown) => void reportApiFailure('bar-status', err))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      {status && <StatusBanner status={status} />}
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="flex-1 focus:outline-none"><Outlet /></main>
      <Footer />
    </div>
  )
}
