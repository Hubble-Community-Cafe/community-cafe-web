import type { ReactNode } from 'react'
import type { BarStatus } from '@cafe/shared-web'
import { Header } from './Header'
import { Footer } from './Footer'
import { StatusBanner } from './StatusBanner'

/**
 * Placeholder status until the opening-hours milestone wires BarStatus from the
 * API. Open with no message means the banner renders nothing (no false "closed").
 */
const PLACEHOLDER_STATUS: BarStatus = {
  bar: 'METEOR',
  isOpen: true,
  bannerMessage: null,
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StatusBanner status={PLACEHOLDER_STATUS} />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
