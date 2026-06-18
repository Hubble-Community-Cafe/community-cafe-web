import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getBarStatus, type BarStatus } from '@cafe/shared-web'
import { Header } from './Header'
import { Footer } from './Footer'
import { StatusBanner } from './StatusBanner'

export function Layout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<BarStatus | null>(null)

  useEffect(() => {
    getBarStatus('HUBBLE').then(setStatus).catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      {status && <StatusBanner status={status} />}
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
