import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { getBarStatus, reportApiFailure, type BarStatus } from '@cafe/shared-web'
import { Header } from './Header'
import { Footer } from './Footer'
import { StatusBanner } from './StatusBanner'

export function Layout() {
  const [status, setStatus] = useState<BarStatus | null>(null)

  useEffect(() => {
    // Without a status the banner is simply not shown; the failure is still reported.
    getBarStatus('HUBBLE').then(setStatus).catch((err: unknown) => void reportApiFailure('bar-status', err))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {status && <StatusBanner status={status} />}
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}
